"use server"

import { db } from "@/database/drizzle";
import { contacts } from "@/database/schema";
import { desc, eq } from "drizzle-orm";

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const GetAllContacts = async () => {
    try {
        await delay(1000); // 1 second delay
        
        const results = await db.select().from(contacts).where(eq(contacts.isDeleted, false));
        return { success: true, data: results };
    } catch (error) {
        console.error("Error fetching contacts:", error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to fetch contacts" 
        };
    }
}

export const CreateContacts = async (data: ContactFormData[]) => {
    try {
        await delay(1000); // 1 second delay
        const result = await db.insert(contacts).values(data).returning();

        return { success: true, data: result };
    } catch (error) {
        console.error("Error creating contact:", error);
        
        return { 
            success: false, 
            error: error instanceof Error ? error.message : "Failed to create contact" 
        };        
    }
}