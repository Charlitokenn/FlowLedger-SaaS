"use server"

import { plots } from "@/database/tenant-schema";
import { getTenantDbForRequest, MISSING_TENANT_CONTEXT_ERROR } from "@/lib/tenant-context";
import { desc, eq } from "drizzle-orm";

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
        console.error("Error fetching projects:", error);
        return {
            success: false,
            error:
                error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
                    ? "Unauthorized"
                    : error instanceof Error
                        ? error.message
                        : "Failed to fetch projects",
        };
    }
};