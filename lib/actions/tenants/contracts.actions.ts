"use server";

import { auth } from '@clerk/nextjs/server';
import type {
  Contact,
  ContractInstallment,
  ContractPayment,
  Plot,
  PlotSaleContract,
} from '@/database/tenant-schema';
import { plots, plotSaleContracts } from '@/database/tenant-schema';
import { requireStaffRole } from '@/lib/authz';
import { getTenantDbForRequest, MISSING_TENANT_CONTEXT_ERROR } from '@/lib/tenant-context';
import {and, desc, eq, isNull, sql} from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

type ExecRow = Record<string, unknown>;

function extractRows(res: unknown): ExecRow[] {
  if (Array.isArray(res)) {
    return res.filter((r): r is ExecRow => typeof r === 'object' && r !== null);
  }
  if (typeof res === 'object' && res !== null && 'rows' in res) {
    const rows = (res as { rows?: unknown }).rows;
    if (Array.isArray(rows)) {
      return rows.filter((r): r is ExecRow => typeof r === 'object' && r !== null);
    }
  }
  return [];
}

function getFirstRowValue<T>(res: unknown, key: string): T | undefined {
  const rows = extractRows(res);
  if (!rows.length) return undefined;
  return rows[0]?.[key] as T | undefined;
}

const NumericLike = z.union([z.string(), z.number()]).transform((v) => {
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
});

const DateOnlyString = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD');

const PurchasePlanSchema = z.enum(['FLAT_RATE', 'DOWNPAYMENT']);

const CreateContractSchema = z
  .object({
    plotId: z.string().uuid(),
    clientContactId: z.string().uuid(),
    startDate: DateOnlyString,
    termMonths: z.number().int().min(1).max(24),
    totalContractValue: NumericLike,
    purchasePlan: PurchasePlanSchema,
    downpaymentPercent: NumericLike.optional(),
    downpaymentAmount: NumericLike.optional(),
    cancellationFeePercent: NumericLike,
    graceDays: z.number().int().min(0).max(60).optional(),
    delinquentDaysThreshold: z.number().int().min(0).max(365).optional(),
  })
  .superRefine((val, ctx) => {
    if (val.totalContractValue == null || val.totalContractValue <= 0) {
      ctx.addIssue({ code: 'custom', path: ['totalContractValue'], message: 'totalContractValue must be > 0' });
    }
    if (val.cancellationFeePercent == null || val.cancellationFeePercent < 0 || val.cancellationFeePercent > 100) {
      ctx.addIssue({ code: 'custom', path: ['cancellationFeePercent'], message: 'cancellationFeePercent must be 0..100' });
    }
    if (val.purchasePlan === 'FLAT_RATE') {
      // Ignore downpayment fields
      return;
    }
    const hasAmount = val.downpaymentAmount != null && val.downpaymentAmount > 0;
    const hasPercent = val.downpaymentPercent != null && val.downpaymentPercent > 0;
    if (!hasAmount && !hasPercent) {
      ctx.addIssue({ code: 'custom', path: ['downpaymentAmount'], message: 'Provide downpaymentAmount or downpaymentPercent' });
    }
  });

export async function CreateContract(input: z.infer<typeof CreateContractSchema>): Promise<ActionResult<{ contractId: string }>> {
  try {
    const parsed = CreateContractSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(', ') };
    }

    const data = parsed.data;
    const { db } = await getTenantDbForRequest();
    const { userId } = await auth();

    const res: unknown = await db.execute(sql`
      SELECT public.create_plot_sale_contract(
        ${data.plotId}::uuid,
        ${data.clientContactId}::uuid,
        ${data.startDate}::date,
        ${data.termMonths}::integer,
        ${data.totalContractValue}::numeric,
        ${data.purchasePlan}::public.purchase_plan,
        ${data.downpaymentPercent ?? null}::numeric,
        ${data.downpaymentAmount ?? null}::numeric,
        ${data.cancellationFeePercent}::numeric,
        ${data.graceDays ?? 0}::integer,
        ${data.delinquentDaysThreshold ?? 0}::integer,
        ${userId ?? null}::text
      ) AS contract_id;
    `);

    const contractId = getFirstRowValue<string>(res, 'contract_id');
    if (!contractId) {
      return { success: false, error: 'Failed to create contract' };
    }

    revalidatePath('/contracts');

    return { success: true, data: { contractId: String(contractId) } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
          ? 'Unauthorized'
          : error instanceof Error
            ? error.message
            : 'Failed to create contract',
    };
  }
}

export type ContractListRow = PlotSaleContract & { plot: Plot; client: Contact };

export async function GetContracts(): Promise<ActionResult<ContractListRow[]>> {
  try {
    const { db } = await getTenantDbForRequest();

    const rows = await db.query.plotSaleContracts.findMany({
      orderBy: (c, { desc }) => [desc(c.createdAt)],
      with: {
        client: {
          columns: {
            fullName: true,
          },
        },
        plot: {
          columns: {
            plotNumber: true,
          },
          with: {
            project: {
                columns: {
                  projectName: true,
                }
            }
          }
        },
      },
    });

    return { success: true, data: rows as unknown as ContractListRow[] };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
          ? 'Unauthorized'
          : error instanceof Error
            ? error.message
            : 'Failed to fetch contracts',
    };
  }
}

const UpdateContractSchema = z.object({
  contractId: z.string().uuid(),
  cancellationFeePercent: NumericLike.nullable().optional(),
  graceDays: z.number().int().min(0).max(60).optional(),
  delinquentDaysThreshold: z.number().int().min(0).max(365).optional(),
});

export async function UpdateContract(
  input: z.infer<typeof UpdateContractSchema>,
): Promise<ActionResult<{ updated: number }>> {
  try {
    await requireStaffRole();

    const parsed = UpdateContractSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(', ') };
    }

    const { db } = await getTenantDbForRequest();
    const data = parsed.data;

    const updatePayload: Partial<PlotSaleContract> = {};

    if (data.cancellationFeePercent !== undefined) {
      // allow null to explicitly clear, otherwise set numeric value
      (updatePayload as any).cancellationFeePercent = data.cancellationFeePercent;
    }
    if (data.graceDays !== undefined) {
      (updatePayload as any).graceDays = data.graceDays;
    }
    if (data.delinquentDaysThreshold !== undefined) {
      (updatePayload as any).delinquentDaysThreshold = data.delinquentDaysThreshold;
    }

    if (Object.keys(updatePayload).length === 0) {
      return { success: true, data: { updated: 0 } };
    }

    await db
      .update(plotSaleContracts)
      .set(updatePayload as any)
      .where(eq(plotSaleContracts.id, data.contractId));

    revalidatePath('/contracts');
    revalidatePath(`/contracts/${data.contractId}`);

    return { success: true, data: { updated: 1 } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
          ? 'Unauthorized'
          : error instanceof Error
            ? error.message
            : 'Failed to update contract',
    };
  }
}

const GetContractDetailsSchema = z.object({ contractId: z.string().uuid() });

export type ContractDetails = PlotSaleContract & {
  plot: Plot;
  client: Contact;
  installments: ContractInstallment[];
  payments: ContractPayment[];
};

export async function GetContractDetails(
  input: z.infer<typeof GetContractDetailsSchema>,
): Promise<ActionResult<ContractDetails>> {
  try {
    const parsed = GetContractDetailsSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: 'Invalid request' };
    }

    const { db } = await getTenantDbForRequest();

    const contract = await db.query.plotSaleContracts.findFirst({
      where: (c, { eq }) => eq(c.id, parsed.data.contractId),
      with: {
        plot: true,
        client: true,
        installments: {
          orderBy: (i, { asc }) => [asc(i.dueDate), asc(i.installmentNo)],
        },
        payments: {
          orderBy: (p, { desc }) => [desc(p.receivedAt)],
        },
      },
    });

    if (!contract) {
      return { success: false, error: 'Contract not found' };
    }

    return { success: true, data: contract as unknown as ContractDetails };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
          ? 'Unauthorized'
          : error instanceof Error
            ? error.message
            : 'Failed to fetch contract',
    };
  }
}

const PostPaymentSchema = z.object({
  contractId: z.string().uuid(),
  amount: NumericLike,
  receivedAt: z.string().datetime().optional(),
  method: z.string().trim().min(1).max(100).optional(),
  reference: z.string().trim().max(200).optional(),
});

export async function PostContractPayment(input: z.infer<typeof PostPaymentSchema>): Promise<ActionResult<{ paymentId: string }>> {
  try {
    const parsed = PostPaymentSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(', ') };
    }

    const { contractId } = parsed.data;
    const amount = parsed.data.amount;

    if (amount == null || amount <= 0) {
      return { success: false, error: 'amount must be > 0' };
    }

    const { db } = await getTenantDbForRequest();
    const { userId } = await auth();

    const res: unknown = await db.execute(sql`
      SELECT public.post_contract_payment(
        ${contractId}::uuid,
        ${amount}::numeric,
        ${parsed.data.receivedAt ?? null}::timestamptz,
        ${parsed.data.method ?? null}::text,
        ${parsed.data.reference ?? null}::text,
        ${userId ?? null}::text
      ) AS payment_id;
    `);

    const paymentId = getFirstRowValue<string>(res, 'payment_id');
    if (!paymentId) {
      return { success: false, error: 'Failed to post payment' };
    }

    revalidatePath(`/contracts/${contractId}`);
    revalidatePath('/receipts');

    return { success: true, data: { paymentId: String(paymentId) } };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
          ? 'Unauthorized'
          : error instanceof Error
            ? error.message
            : 'Failed to post payment',
    };
  }
}

const CancelContractSchema = z.object({
  contractId: z.string().uuid(),
  reason: z.string().trim().min(2).max(500),
  refundMethod: z.string().trim().max(100).optional(),
  refundReference: z.string().trim().max(200).optional(),
});

export async function CancelContract(input: z.infer<typeof CancelContractSchema>): Promise<
  ActionResult<{ cancellationFeeAmount: string; refundAmount: string }>
> {
  try {
    await requireStaffRole();

    const parsed = CancelContractSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues.map((i) => i.message).join(', ') };
    }

    const { db } = await getTenantDbForRequest();
    const { userId } = await auth();

    const res: unknown = await db.execute(sql`
      SELECT * FROM public.cancel_contract(
        ${parsed.data.contractId}::uuid,
        ${userId ?? null}::text,
        ${parsed.data.reason}::text,
        ${parsed.data.refundMethod ?? null}::text,
        ${parsed.data.refundReference ?? null}::text
      );
    `);

    const rows = extractRows(res);
    const row = rows[0];
    if (!row) {
      return { success: false, error: 'Failed to cancel contract' };
    }

    revalidatePath(`/contracts/${parsed.data.contractId}`);
    revalidatePath('/contracts');

    return {
      success: true,
      data: {
        cancellationFeeAmount: String(row.cancellation_fee_amount ?? ''),
        refundAmount: String(row.refund_amount ?? ''),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cancel contract',
    };
  }
}

export async function EvaluateContractDelinquency(): Promise<ActionResult<{ updated: number }>> {
  try {
    // This is intended for system/cron usage; keep it staff-only if triggered manually.
    await requireStaffRole();

    const { db } = await getTenantDbForRequest();

    const res: unknown = await db.execute(sql`
      SELECT public.evaluate_contract_delinquency(current_date) AS updated;
    `);

    const updated = getFirstRowValue<number | string>(res, 'updated') ?? 0;
    return { success: true, data: { updated: Number(updated) } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to evaluate delinquency',
    };
  }
}

// Convenience queries (optional)
export async function GetSellablePlots(): Promise<ActionResult<Plot[]>> {
  try {
    const { db } = await getTenantDbForRequest();

    const rows = await db
      .select()
      .from(plots)
      .where(and(eq(plots.availability, 'AVAILABLE'), isNull(plots.activeContractId), eq(plots.isDeleted, false)))
      .orderBy(desc(plots.plotNumber));

    return { success: true, data: rows as Plot[] };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
          ? 'Unauthorized'
          : error instanceof Error
            ? error.message
            : 'Failed to fetch sellable plots',
    };
  }
}
