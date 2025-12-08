"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { getTenantDb } from "@/lib/tenant-db";
import { projects } from "@/database/tenant-schema";
import { eq, inArray } from "drizzle-orm";

export const GetAllProjects = async () => {
    try {
        const authData = await auth();

        if (!authData.userId || !authData.orgId || !authData.orgSlug) {
            throw new Error("Unauthorized");
        }

        const client = await clerkClient();
        const org = await client.organizations.getOrganization({
            organizationId: authData.orgId,
        });

        const db = await getTenantDb(
            authData.orgId,
            authData.orgSlug,
            org.name,
        );

        const results = await db
            .select()
            .from(projects)
            .where(eq(projects.isDeleted, false));

        return { success: true, data: results };
    } catch (error) {
        console.error("Error fetching projects:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to fetch projects",
        };
    }
};

export const SoftDeleteProjects = async (ids: string[]) => {
    try {
        const authData = await auth();

        if (!authData.userId || !authData.orgId || !authData.orgSlug) {
            throw new Error("Unauthorized");
        }

        const client = await clerkClient();
        const org = await client.organizations.getOrganization({
            organizationId: authData.orgId,
        });

        const db = await getTenantDb(
            authData.orgId,
            authData.orgSlug,
            org.name,
        );

        const results = await db
            .update(projects)
            .set({ isDeleted: true })
            .where(inArray(projects.id, ids))
            .returning();

        return { success: true, data: results };
    } catch (error) {
        console.error("Error deleting projects:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete project",
        };
    }
};
