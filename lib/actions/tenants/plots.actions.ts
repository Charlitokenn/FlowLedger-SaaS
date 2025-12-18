"use server";

import { plots } from "@/database/tenant-schema";
import { getTenantDbForRequest, MISSING_TENANT_CONTEXT_ERROR } from "@/lib/tenant-context";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export const GetAllPlots = async () => {
  try {
    const { db } = await getTenantDbForRequest();

    const results = await db
      .select()
      .from(plots)
      .where(eq(plots.isDeleted, false))
      .orderBy(desc(plots.plotNumber));

    return { success: true, data: results };
  } catch (error) {
    console.error("Error fetching plots:", error);
    return {
      success: false,
      error:
        error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
          ? "Unauthorized"
          : error instanceof Error
            ? error.message
            : "Failed to fetch plots",
    };
  }
};

const PlotAvailabilitySchema = z.enum(["AVAILABLE", "SOLD"]);

const NumericLikeSchema = z.union([z.number(), z.string()]).transform((v) => {
  const s = String(v).trim();
  if (!s) return null;
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
});

const PlotNumberSchema = z.union([
  z.number().finite(),
  z.string().trim().min(1, "plotNumber is required"),
]);

const ContactIdSchema = z.preprocess(
  (v) => {
    if (v == null) return null;
    if (typeof v === "string") {
      const trimmed = v.trim();
      return trimmed === "" ? null : trimmed;
    }
    return v;
  },
  z.string().uuid().nullable(),
);

const PlotUpdateRowSchema = z.object({
  plotNumber: PlotNumberSchema,
  surveyedPlotNumber: z.string().trim().min(1).optional().nullable(),
  availability: PlotAvailabilitySchema.optional().nullable(),
  unsurveyedSize: NumericLikeSchema.optional().nullable(),
  surveyedSize: NumericLikeSchema.optional().nullable(),
  contactId: ContactIdSchema.optional(),
});

const BulkUpdatePlotsForProjectSchema = z.object({
  projectId: z.string().uuid(),
  rows: z.array(PlotUpdateRowSchema).min(1).max(20000),
});

function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    out.push(items.slice(i, i + chunkSize));
  }
  return out;
}

export async function BulkUpdatePlotsForProject(
  input: z.infer<typeof BulkUpdatePlotsForProjectSchema>,
) {
  try {
    const parsed = BulkUpdatePlotsForProjectSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues.map((i) => i.message).join(", "),
      } as const;
    }

    const { projectId } = parsed.data;

    const normalizePlotNumber = (v: unknown): string | null => {
      const s = String(v ?? "").trim().replace(/,/g, "");
      if (!s) return null;
      const n = Number(s);
      return Number.isFinite(n) ? s : null;
    };

    // De-dupe rows by plotNumber (keep the last occurrence).
    const byPlotNumber = new Map<string, z.infer<typeof PlotUpdateRowSchema>>();
    for (const row of parsed.data.rows) {
      const key = normalizePlotNumber(row.plotNumber);
      if (!key) {
        return {
          success: false,
          error: "Invalid plotNumber found in the upload.",
        } as const;
      }
      byPlotNumber.set(key, row);
    }

    // Normalize plotNumber to a string so comparisons and SQL casting are consistent.
    const rows = Array.from(byPlotNumber.entries()).map(([plotNumber, row]) => ({
      ...row,
      plotNumber,
    }));

    const { db } = await getTenantDbForRequest();

    // Fetch existing plots for this project so we can split into updates vs inserts.
    const plotNumbers = rows.map((r) => r.plotNumber);
    const existing = await db
      .select({ plotNumber: plots.plotNumber })
      .from(plots)
      .where(
        and(
          eq(plots.projectId, projectId),
          eq(plots.isDeleted, false),
          inArray(plots.plotNumber, plotNumbers),
        ),
      );

    const existingSet = new Set(existing.map((r) => String(r.plotNumber)));

    const updates = rows.filter((r) => existingSet.has(r.plotNumber));
    const inserts = rows.filter((r) => !existingSet.has(r.plotNumber));

    // For inserts, unsurveyedSize is required by the DB schema.
    const missingInsertFields = inserts.filter((r) => r.unsurveyedSize == null);
    if (missingInsertFields.length) {
      return {
        success: false,
        error:
          `Missing unsurveyedSize for ${missingInsertFields.length} new plot(s). ` +
          `Provide unsurveyedSize or remove those rows.`,
      } as const;
    }

    // NOTE: the neon-http driver does not support interactive transactions.
    // Run bulk operations in chunks without wrapping in a transaction.
    // Each individual SQL statement is still atomic.

    // Bulk UPDATE existing plots (chunked to avoid overly-large SQL statements).
    for (const chunk of chunkArray(updates, 500)) {
      const values = sql.join(
        chunk.map(
          (r) =>
            sql`(${projectId}, ${r.plotNumber}, ${r.surveyedPlotNumber ?? null}, ${r.availability ?? null}, ${r.unsurveyedSize ?? null}, ${r.surveyedSize ?? null}, ${r.contactId ?? null})`,
        ),
        sql`,`,
      );

      await db.execute(sql`
        UPDATE ${plots} AS p
        SET
          surveyed_plot_number = COALESCE(v.surveyed_plot_number, p.surveyed_plot_number),
          availability = COALESCE(v.availability::plot_availability, p.availability),
          unsurveyed_size = COALESCE(v.unsurveyed_size::numeric, p.unsurveyed_size),
          surveyed_size = COALESCE(v.surveyed_size::numeric, p.surveyed_size),
          contact_id = COALESCE(v.contact_id::uuid, p.contact_id),
          updated_at = NOW()
        FROM (
          VALUES ${values}
        ) AS v(
          project_id,
          plot_number,
          surveyed_plot_number,
          availability,
          unsurveyed_size,
          surveyed_size,
          contact_id
        )
        WHERE
          p.project_id = v.project_id::uuid
          AND p.plot_number = v.plot_number::numeric
          AND p.is_deleted = false;
      `);
    }

    // Bulk INSERT new plots.
    for (const chunk of chunkArray(inserts, 500)) {
      await db.insert(plots).values(
        chunk.map((r) => ({
          projectId,
          plotNumber: r.plotNumber,
          // numeric columns are represented as strings in Drizzle; normalize to string
          unsurveyedSize: String(r.unsurveyedSize),
          surveyedPlotNumber: r.surveyedPlotNumber ?? undefined,
          availability: r.availability ?? undefined,
          surveyedSize: r.surveyedSize != null ? String(r.surveyedSize) : undefined,
          contactId: r.contactId ?? undefined,
          updatedAt: new Date(),
        })),
      );
    }

    // Keep it broad; the plots table is primarily displayed under /projects.
    revalidatePath("/projects");

    return {
      success: true,
      updated: updates.length,
      inserted: inserts.length,
      total: rows.length,
    } as const;
  } catch (error) {
    console.error("BulkUpdatePlotsForProject failed", error);
    return {
      success: false,
      error:
        error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
          ? "Unauthorized"
          : error instanceof Error
            ? error.message
            : "Failed to update plots",
    } as const;
  }
}
