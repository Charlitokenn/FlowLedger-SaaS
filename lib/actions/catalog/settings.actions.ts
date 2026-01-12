"use server";

import { auth } from "@clerk/nextjs/server";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { tenants, type Tenant } from "@/database/catalog-schema";
import type { SessionClaims } from "@/types/auth";
import {z} from "zod";
import {zodToProperCase} from "@/lib/zod-transformers";

type GetCurrentTenantResult =
    | { success: true; data: Tenant }
    | { success: false; error: string };

export async function getCurrentTenantFromCatalog(): Promise<GetCurrentTenantResult> {
    try {
        const { sessionClaims } = await auth();
        const claims = sessionClaims as SessionClaims | null;

        if (!claims?.o?.id) {
            return { success: false, error: "Missing organization context" };
        }

        const sql = neon(process.env.CATALOG_DATABASE_URL!);
        const db = drizzle(sql);

        const rows = await db
            .select()
            .from(tenants)
            .where(eq(tenants.clerkOrgId, claims.o.id))
            .limit(1);

        const tenant = rows[0];

        if (!tenant) {
            return { success: false, error: "Tenant not found in catalog" };
        }

        return { success: true, data: tenant };
    } catch (error) {
        console.error("Error fetching current tenant from catalog:", error);
        return {
            success: false,
            error: "Failed to fetch current tenant from catalog",
        };
    }
}

const UpdateCurrentTenantSchema = z.object({
    slogan: z
        .string()
        .optional()
        .transform((val) => (val ? zodToProperCase(val) : val)),
    mobile: z
        .string()
        .optional(),
    email: z
        .email("Invalid email address")
        .optional()
        .or(z.literal("")),
    address: z
        .string()
        .optional()
        .transform((val) => (val ? zodToProperCase(val) : val)),
    color: z.string().optional(),
    senderID: z.string().optional(),
    website: z.url().optional(),
});

export type UpdateCurrentTenantInput = z.infer<typeof UpdateCurrentTenantSchema>;

export async function updateTenantSettings(
    data: UpdateCurrentTenantInput,
): Promise<GetCurrentTenantResult> {
    try {
        const { sessionClaims } = await auth();
        const claims = sessionClaims as SessionClaims | null;

        if (!claims?.o?.id) {
            return { success: false, error: "Missing organization context" };
        }

        // Validate input
        const parsed = UpdateCurrentTenantSchema.safeParse(data);
        if (!parsed.success) {
            const err = parsed.error.flatten().fieldErrors;
            console.error("Invalid tenant catalog update payload:", err);
            return { success: false, error: "Invalid data" };
        }

        const sql = neon(process.env.CATALOG_DATABASE_URL!);
        const db = drizzle(sql);

        // Ensure tenant exists and belongs to current org
        const existing = await db
            .select()
            .from(tenants)
            .where(eq(tenants.clerkOrgId, claims.o.id))
            .limit(1);

        const current = existing[0];
        if (!current) {
            return { success: false, error: "Tenant not found in catalog" };
        }

        const updates = {
            slogan: parsed.data.slogan ?? current.slogan,
            mobile: parsed.data.mobile ?? current.mobile,
            email: parsed.data.email ?? current.email,
            address: parsed.data.address ?? current.address,
            color: parsed.data.color ?? current.color,
            senderID: parsed.data.senderID ?? current.senderID,
            updatedAt: new Date(),
        };

        const [updated] = await db
            .update(tenants)
            .set(updates)
            .where(eq(tenants.id, current.id))
            .returning();

        if (!updated) {
            return { success: false, error: "Failed to update tenant in catalog" };
        }

        return { success: true, data: updated };
    } catch (error) {
        console.error("Error updating current tenant in catalog:", error);
        return {
            success: false,
            error: "Failed to update current tenant in catalog",
        };
    }
}
