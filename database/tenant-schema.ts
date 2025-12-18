/**
 * Tenant Database Schema
 * Each tenant gets their own Neon project with this schema
 */

import {
  varchar,
  uuid,
  pgTable,
  pgEnum,
  date,
  timestamp,
  text,
  numeric,
  boolean,
  index,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const APPROVAL_STATUS_ENUM = pgEnum('approval_status', ['APPROVED', 'REJECTED', 'PENDING']);
export const GENDER_ENUM = pgEnum('gender', ['MALE', 'FEMALE']);
export const ID_TYPE_ENUM = pgEnum('id_type', ['NATIONAL_ID', 'PASSPORT', 'DRIVER_LICENSE', 'VOTER_ID']);
export const RELATIONSHIP_ENUM = pgEnum('relationship', ['PARENT', 'SIBLING', 'SPOUSE', 'FRIEND', 'OTHER']);
export const CONTACT_TYPE = pgEnum('contact_type', ['CLIENT', 'LAND_SELLER', 'AUDITOR', 'ICT SUPPORT', 'STATIONERY', 'SURVEYOR']);
export const ACCOUNT_TYPE = pgEnum('account_type', ['Bank Account', 'Mobile Wallet']);

// NOTE: per requirements, plots are either AVAILABLE or SOLD.
// "Held" plots are represented by plots.activeContractId.
export const PLOT_AVAILABILITY_ENUM = pgEnum('plot_availability', ['AVAILABLE', 'SOLD']);

export const CONTRACT_STATUS_ENUM = pgEnum('contract_status', ['ACTIVE', 'DELINQUENT', 'COMPLETED', 'CANCELLED']);
export const INSTALLMENT_STATUS_ENUM = pgEnum('installment_status', ['DUE', 'PARTIAL', 'PAID']);
export const PAYMENT_DIRECTION_ENUM = pgEnum('payment_direction', ['IN', 'OUT']);
export const PURCHASE_PLAN_ENUM = pgEnum('purchase_plan', ['FLAT_RATE', 'DOWNPAYMENT']);

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

export const plots = pgTable(
  'plots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    plotNumber: numeric('plot_number').notNull(),
    surveyedPlotNumber: varchar('surveyed_plot_number', { length: 50 }),
    availability: PLOT_AVAILABILITY_ENUM('availability').default('AVAILABLE').notNull(),

    // Holds the currently active/delinquent contract (plot is not sellable while set)
    // NOTE: Do not declare a Drizzle-level FK here to avoid circular table init typing.
    // The actual FK is created in migrations.
    activeContractId: uuid('active_contract_id'),

    unsurveyedSize: numeric('unsurveyed_size').notNull(),
    surveyedSize: numeric('surveyed_size'),

    // 🔗 Project → Plot (many plots belong to one project)
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'restrict' }),

    // 🔗 Contact → Plot (current payer/owner; cleared on cancellation)
    contactId: uuid('contact_id').references(() => contacts.id, { onDelete: 'set null' }),

    isDeleted: boolean('is_deleted').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('plots_project_idx').on(table.projectId),
    index('plots_contact_idx').on(table.contactId),
    index('plots_active_contract_idx').on(table.activeContractId),
  ],
);

export const plotSaleContracts = pgTable(
  'plot_sale_contracts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    plotId: uuid('plot_id').notNull(),
    clientContactId: uuid('client_contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'restrict' }),

    status: CONTRACT_STATUS_ENUM('status').default('ACTIVE').notNull(),

    startDate: date('start_date').notNull(),

    // Number of *monthly* installments (excluding any upfront downpayment installment)
    termMonths: integer('term_months').notNull(),

    totalContractValue: numeric('total_contract_value').notNull(),

    purchasePlan: PURCHASE_PLAN_ENUM('purchase_plan').default('FLAT_RATE').notNull(),
    downpaymentPercent: numeric('downpayment_percent'),
    downpaymentAmount: numeric('downpayment_amount').default('0').notNull(),
    financedAmount: numeric('financed_amount').notNull(),

    cancellationFeePercent: numeric('cancellation_fee_percent').notNull(),

    graceDays: integer('grace_days').default(0).notNull(),
    delinquentDaysThreshold: integer('delinquent_days_threshold').default(1).notNull(),
    delinquentSince: timestamp('delinquent_since', { withTimezone: true }),

    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelledBy: text('cancelled_by'),
    cancellationFeeAmount: numeric('cancellation_fee_amount'),
    refundedAmount: numeric('refunded_amount'),
    cancellationReason: text('cancellation_reason'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('plot_sale_contracts_plot_idx').on(table.plotId),
    index('plot_sale_contracts_client_idx').on(table.clientContactId),
    index('plot_sale_contracts_status_idx').on(table.status),
  ],
);

export const contractInstallments = pgTable(
  'contract_installments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contractId: uuid('contract_id')
      .notNull()
      .references(() => plotSaleContracts.id, { onDelete: 'cascade' }),

    // installment_no = 0 is reserved for an optional downpayment installment
    installmentNo: integer('installment_no').notNull(),
    dueDate: date('due_date').notNull(),
    amountDue: numeric('amount_due').notNull(),
    amountPaid: numeric('amount_paid').default('0').notNull(),
    status: INSTALLMENT_STATUS_ENUM('status').default('DUE').notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('contract_installments_contract_idx').on(table.contractId),
    index('contract_installments_due_idx').on(table.dueDate),
    index('contract_installments_contract_due_idx').on(table.contractId, table.dueDate),
  ],
);

export const contractPayments = pgTable(
  'contract_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contractId: uuid('contract_id')
      .notNull()
      .references(() => plotSaleContracts.id, { onDelete: 'cascade' }),
    clientContactId: uuid('client_contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'restrict' }),

    direction: PAYMENT_DIRECTION_ENUM('direction').notNull(),
    amount: numeric('amount').notNull(),
    receivedAt: timestamp('received_at', { withTimezone: true }).defaultNow().notNull(),
    method: text('method'),
    reference: text('reference'),
    createdBy: text('created_by'),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('contract_payments_contract_idx').on(table.contractId),
    index('contract_payments_client_idx').on(table.clientContactId),
    index('contract_payments_received_idx').on(table.receivedAt),
  ],
);

export const contractPaymentAllocations = pgTable(
  'contract_payment_allocations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => contractPayments.id, { onDelete: 'cascade' }),
    installmentId: uuid('installment_id')
      .notNull()
      .references(() => contractInstallments.id, { onDelete: 'restrict' }),
    amount: numeric('amount').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('contract_payment_allocations_payment_idx').on(table.paymentId),
    index('contract_payment_allocations_installment_idx').on(table.installmentId),
  ],
);

export const contractEvents = pgTable(
  'contract_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contractId: uuid('contract_id')
      .notNull()
      .references(() => plotSaleContracts.id, { onDelete: 'cascade' }),
    eventType: text('event_type').notNull(),
    message: text('message'),
    meta: jsonb('meta'),
    createdBy: text('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [index('contract_events_contract_idx').on(table.contractId)],
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
export type PlotSaleContract = typeof plotSaleContracts.$inferSelect;
export type NewPlotSaleContract = typeof plotSaleContracts.$inferInsert;
export type ContractInstallment = typeof contractInstallments.$inferSelect;
export type NewContractInstallment = typeof contractInstallments.$inferInsert;
export type ContractPayment = typeof contractPayments.$inferSelect;
export type NewContractPayment = typeof contractPayments.$inferInsert;
export type ContractPaymentAllocation = typeof contractPaymentAllocations.$inferSelect;
export type NewContractPaymentAllocation = typeof contractPaymentAllocations.$inferInsert;
export type ContractEvent = typeof contractEvents.$inferSelect;
export type NewContractEvent = typeof contractEvents.$inferInsert;
export type ProjectWithPlots = Project & {
  plots: Plot[];
};

// Relations
export const projectsRelations = relations(projects, ({ many }) => ({
  plots: many(plots),
}));

export const contactsRelations = relations(contacts, ({ many }) => ({
  plots: many(plots),
  plotSaleContracts: many(plotSaleContracts),
}));

export const plotsRelations = relations(plots, ({ one, many }) => ({
  project: one(projects, {
    fields: [plots.projectId],
    references: [projects.id],
  }),
  contact: one(contacts, {
    fields: [plots.contactId],
    references: [contacts.id],
  }),
  activeContract: one(plotSaleContracts, {
    fields: [plots.activeContractId],
    references: [plotSaleContracts.id],
  }),
  contracts: many(plotSaleContracts),
}));

export const plotSaleContractsRelations = relations(plotSaleContracts, ({ one, many }) => ({
  plot: one(plots, {
    fields: [plotSaleContracts.plotId],
    references: [plots.id],
  }),
  client: one(contacts, {
    fields: [plotSaleContracts.clientContactId],
    references: [contacts.id],
  }),
  installments: many(contractInstallments),
  payments: many(contractPayments),
  events: many(contractEvents),
}));

export const contractInstallmentsRelations = relations(contractInstallments, ({ one, many }) => ({
  contract: one(plotSaleContracts, {
    fields: [contractInstallments.contractId],
    references: [plotSaleContracts.id],
  }),
  allocations: many(contractPaymentAllocations),
}));

export const contractPaymentsRelations = relations(contractPayments, ({ one, many }) => ({
  contract: one(plotSaleContracts, {
    fields: [contractPayments.contractId],
    references: [plotSaleContracts.id],
  }),
  client: one(contacts, {
    fields: [contractPayments.clientContactId],
    references: [contacts.id],
  }),
  allocations: many(contractPaymentAllocations),
}));

export const contractPaymentAllocationsRelations = relations(contractPaymentAllocations, ({ one }) => ({
  payment: one(contractPayments, {
    fields: [contractPaymentAllocations.paymentId],
    references: [contractPayments.id],
  }),
  installment: one(contractInstallments, {
    fields: [contractPaymentAllocations.installmentId],
    references: [contractInstallments.id],
  }),
}));

export const contractEventsRelations = relations(contractEvents, ({ one }) => ({
  contract: one(plotSaleContracts, {
    fields: [contractEvents.contractId],
    references: [plotSaleContracts.id],
  }),
}));
