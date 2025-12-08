import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const GetOrgPrivateMetaData = async () => {
    try {
        const { orgId } = await auth();
        
        if (!orgId) {
            return NextResponse.json({ error: 'No organization found' }, { status: 401 });
        }

        // In Next.js, you must await clerkClient instantiation
        const client = await clerkClient();
        const organization = await client.organizations.getOrganization({ organizationId: orgId });
        
        // Access private metadata
        const privateData = organization.privateMetadata;
        
        return privateData;        
    } catch (error) {
        console.error("Error fetching organization metadata:", error);
    }
}

