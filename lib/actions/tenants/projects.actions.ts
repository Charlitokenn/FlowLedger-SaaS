"use server";

import { projects } from "@/database/tenant-schema";
import { getTenantDbForRequest, MISSING_TENANT_CONTEXT_ERROR } from "@/lib/tenant-context";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const GetAllProjects = async () => {
    try {
        const { db } = await getTenantDbForRequest();

        const results = await db
            .select()
            .from(projects)
            .where(eq(projects.isDeleted, false));

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

export const SoftDeleteProjects = async (ids: string[]) => {
    try {
        const { db } = await getTenantDbForRequest();

        const results = await db
            .update(projects)
            .set({ isDeleted: true })
            .where(inArray(projects.id, ids))
            .returning();
        // Revalidate the projects page route so deleted records disappear
        revalidatePath("/projects");

        return { success: true, data: results };
        
    } catch (error) {
        console.error("Error deleting projects:", error);
        return {
            success: false,
            error:
                error instanceof Error && error.message === MISSING_TENANT_CONTEXT_ERROR
                    ? "Unauthorized"
                    : error instanceof Error
                        ? error.message
                        : "Failed to delete project",
        };
    }
};