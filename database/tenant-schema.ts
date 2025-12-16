/**
 * Tenant Database Schema
 * Each tenant gets their own Neon project with this schema
 */

import { varchar, uuid, pgTable, pgEnum, date, timestamp, text, numeric, boolean, index, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const APPROVAL_STATUS_ENUM = pgEnum('approval_status', ['APPROVED', 'REJECTED', 'PENDING']);
export const GENDER_ENUM = pgEnum('gender', ['MALE', 'FEMALE']);
export const ID_TYPE_ENUM = pgEnum('id_type', ['NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE', 'VOTER_ID']);
export const RELATIONSHIP_ENUM = pgEnum('relationship', ['PARENT', 'SIBLING', 'SPOUSE', 'FRIEND', 'OTHER']);
export const CONTACT_TYPE = pgEnum('contact_type', ['CLIENT', 'LAND_SELLER', 'AUDITOR', 'ICT SUPPORT', 'STATIONERY', 'SURVEYOR'])
export const ACCOUNT_TYPE = pgEnum('account_type', ['Bank Account', 'Mobile Wallet']);
export const PLOT_AVAILABILITY_ENUM = pgEnum('plot_availability', ['AVAILABLE', 'RESERVED', 'SOLD']);

export const contacts = pgTable('contacts', {
    id: uuid('id').primaryKey().defaultRandom(),
    fullName: text('full_name').notNull(),
    mobileNumber: text('mobile_number'),
    altMobileNumber: text('alt_mobile_number'),
    email: text('email'),
    gender: GENDER_ENUM('gender'),
    contactType: CONTACT_TYPE('contact_type').default('CLIENT'),
    idType: ID_TYPE_ENUM('id_type'),
    idNumber: text('id_number'),
    region: varchar('regions'),
    district: varchar('district'),
    ward: text('ward'),
    street: text('street'),
    firstNOKName: text('first_NOK_Name'),
    firstNOKMobile: text('first_NOK_Mobile'),
    firstNOKRelationship: RELATIONSHIP_ENUM('first_NOK_Relationship'),
    secondNOKName: text('second_NOK_Name'),
    secondNOKMobile: text('second_NOK_Mobile'),
    secondNOKRelationship: RELATIONSHIP_ENUM('second_NOK_Relationship'),
    clientPhoto: text('clientPhoto').unique(),
    addedBy: text('added_by'),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const projects = pgTable('projects', {
    id: uuid('id').primaryKey().defaultRandom(),
    projectName: text('project_name').notNull(),
    projectDetails: text('project_details'),
    acquisitionDate: date('acquisition_date').notNull(),
    sqmBought: numeric('sqm_bought'),
    acquisitionValue: numeric('acquisition_value').notNull(),
    region: text('region'),
    district: text('district'),
    ward: text('ward').default(''),
    projectOwner: text('project_owner'),
    committmentAmount: numeric('committment_amount'),
    lgaFee: numeric('lga_fee'),
    street: text('street'),
    tpNumber: text('tp_number'),
    tpStatus: text('tp_status'),
    surveyStatus: text('survey_status'),
    surveyNumber: text('survey_number'),
    originalContractPdf: text('original_contract_pdf'),
    supplierName: uuid('supplier_name'),
    mwenyekitiName: text('mwenyekiti_name'),
    mwenyekitiMobile: text('mwenyekiti_mobile'),
    mtendajiName: text('mtendaji_name'),
    mtendajiMobile: text('mtendaji_mobile'),
    numberOfPlots: integer('number_of_plots').notNull(),
    tpUrl: text('tp_url'),
    surveyUrl: text('survey_url'),
    addedBy: text('added_by'),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const accounts = pgTable('accounts', {
    id: uuid('id').primaryKey().defaultRandom(),
    accountName: varchar('account_name', { length: 255 }).notNull(),
    accountNumber: varchar('account_number', { length: 20 }).notNull().unique(),
    bankName: varchar('bank_name', { length: 255 }).notNull(),
    accountType: ACCOUNT_TYPE('account_type').notNull(),
    telcoName: varchar('telco_name', { length: 100 }),
    telcoNumber: varchar('telco_number', { length: 20 }),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const plots = pgTable('plots', {
    id: uuid('id').primaryKey().defaultRandom(),
    plotNumber: numeric('plot_number').notNull(),
    surveyedPlotNumber: varchar('surveyed_plot_number', { length: 50 }).notNull().unique(),
    availability: PLOT_AVAILABILITY_ENUM('availability').default('AVAILABLE').notNull(),
    unsurveyedSize: numeric('unsurveyed_size').notNull(),
    surveyedSize: numeric('surveyed_size'),
    // 🔗 Project → Plot (many plots belong to one project)
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'restrict' }),
    // 🔗 Contact → Plot (many plots belong to one contact)
    contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
},
    (table) => [
        index('plots_project_idx').on(table.projectId),
        index('plots_contact_idx').on(table.contactId),
    ],
);

// Type exports
export type Contact = typeof contacts.$inferSelect;
export type NewContact = typeof contacts.$inferInsert;
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Plot = typeof plots.$inferSelect;
export type NewPlot = typeof plots.$inferInsert;
export type ProjectWithPlots = Project & {
  plots: Plot[];
};

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
    plots: many(plots),
}));

export const contactsRelations = relations(contacts, ({ many }) => ({
    plots: many(plots),
}));

export const plotsRelations = relations(plots, ({ one }) => ({
    project: one(projects, {
        fields: [plots.projectId],
        references: [projects.id],
    }),
    contact: one(contacts, {
        fields: [plots.contactId],
        references: [contacts.id],
    }),
}));