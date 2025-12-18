CREATE TYPE "public"."contract_status" AS ENUM('ACTIVE', 'DELINQUENT', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."installment_status" AS ENUM('DUE', 'PARTIAL', 'PAID');--> statement-breakpoint
CREATE TYPE "public"."payment_direction" AS ENUM('IN', 'OUT');--> statement-breakpoint
CREATE TYPE "public"."purchase_plan" AS ENUM('FLAT_RATE', 'DOWNPAYMENT');--> statement-breakpoint
CREATE TABLE "contract_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"message" text,
	"meta" jsonb,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contract_installments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"installment_no" integer NOT NULL,
	"due_date" date NOT NULL,
	"amount_due" numeric NOT NULL,
	"amount_paid" numeric DEFAULT '0' NOT NULL,
	"status" "installment_status" DEFAULT 'DUE' NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contract_payment_allocations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" uuid NOT NULL,
	"installment_id" uuid NOT NULL,
	"amount" numeric NOT NULL,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "contract_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"client_contact_id" uuid NOT NULL,
	"direction" "payment_direction" NOT NULL,
	"amount" numeric NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"method" text,
	"reference" text,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "plot_sale_contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plot_id" uuid NOT NULL,
	"client_contact_id" uuid NOT NULL,
	"status" "contract_status" DEFAULT 'ACTIVE' NOT NULL,
	"start_date" date NOT NULL,
	"term_months" integer NOT NULL,
	"total_contract_value" numeric NOT NULL,
	"purchase_plan" "purchase_plan" DEFAULT 'FLAT_RATE' NOT NULL,
	"downpayment_percent" numeric,
	"downpayment_amount" numeric DEFAULT '0' NOT NULL,
	"financed_amount" numeric NOT NULL,
	"cancellation_fee_percent" numeric NOT NULL,
	"grace_days" integer DEFAULT 0 NOT NULL,
	"delinquent_days_threshold" integer DEFAULT 1 NOT NULL,
	"delinquent_since" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"cancelled_by" text,
	"cancellation_fee_amount" numeric,
	"refunded_amount" numeric,
	"cancellation_reason" text,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "plots" ALTER COLUMN "availability" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "plots" ALTER COLUMN "availability" SET DEFAULT 'AVAILABLE'::text;--> statement-breakpoint
UPDATE "plots" SET "availability" = 'AVAILABLE' WHERE "availability" = 'RESERVED';--> statement-breakpoint
DROP TYPE "public"."plot_availability";--> statement-breakpoint
CREATE TYPE "public"."plot_availability" AS ENUM('AVAILABLE', 'SOLD');--> statement-breakpoint
ALTER TABLE "plots" ALTER COLUMN "availability" SET DEFAULT 'AVAILABLE'::"public"."plot_availability";--> statement-breakpoint
ALTER TABLE "plots" ALTER COLUMN "availability" SET DATA TYPE "public"."plot_availability" USING "availability"::"public"."plot_availability";--> statement-breakpoint
ALTER TABLE "plots" ADD COLUMN "active_contract_id" uuid;--> statement-breakpoint
ALTER TABLE "contract_events" ADD CONSTRAINT "contract_events_contract_id_plot_sale_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."plot_sale_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_installments" ADD CONSTRAINT "contract_installments_contract_id_plot_sale_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."plot_sale_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_payment_allocations" ADD CONSTRAINT "contract_payment_allocations_payment_id_contract_payments_id_fk" FOREIGN KEY ("payment_id") REFERENCES "public"."contract_payments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_payment_allocations" ADD CONSTRAINT "contract_payment_allocations_installment_id_contract_installments_id_fk" FOREIGN KEY ("installment_id") REFERENCES "public"."contract_installments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_payments" ADD CONSTRAINT "contract_payments_contract_id_plot_sale_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."plot_sale_contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_payments" ADD CONSTRAINT "contract_payments_client_contact_id_contacts_id_fk" FOREIGN KEY ("client_contact_id") REFERENCES "public"."contacts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plot_sale_contracts" ADD CONSTRAINT "plot_sale_contracts_plot_id_plots_id_fk" FOREIGN KEY ("plot_id") REFERENCES "public"."plots"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plot_sale_contracts" ADD CONSTRAINT "plot_sale_contracts_client_contact_id_contacts_id_fk" FOREIGN KEY ("client_contact_id") REFERENCES "public"."contacts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contract_events_contract_idx" ON "contract_events" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "contract_installments_contract_idx" ON "contract_installments" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "contract_installments_due_idx" ON "contract_installments" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "contract_installments_contract_due_idx" ON "contract_installments" USING btree ("contract_id","due_date");--> statement-breakpoint
CREATE INDEX "contract_payment_allocations_payment_idx" ON "contract_payment_allocations" USING btree ("payment_id");--> statement-breakpoint
CREATE INDEX "contract_payment_allocations_installment_idx" ON "contract_payment_allocations" USING btree ("installment_id");--> statement-breakpoint
CREATE INDEX "contract_payments_contract_idx" ON "contract_payments" USING btree ("contract_id");--> statement-breakpoint
CREATE INDEX "contract_payments_client_idx" ON "contract_payments" USING btree ("client_contact_id");--> statement-breakpoint
CREATE INDEX "contract_payments_received_idx" ON "contract_payments" USING btree ("received_at");--> statement-breakpoint
CREATE INDEX "plot_sale_contracts_plot_idx" ON "plot_sale_contracts" USING btree ("plot_id");--> statement-breakpoint
CREATE INDEX "plot_sale_contracts_client_idx" ON "plot_sale_contracts" USING btree ("client_contact_id");--> statement-breakpoint
CREATE INDEX "plot_sale_contracts_status_idx" ON "plot_sale_contracts" USING btree ("status");--> statement-breakpoint
ALTER TABLE "plots" ADD CONSTRAINT "plots_active_contract_id_plot_sale_contracts_id_fk" FOREIGN KEY ("active_contract_id") REFERENCES "public"."plot_sale_contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "plots_active_contract_idx" ON "plots" USING btree ("active_contract_id");--> statement-breakpoint

-- Constraints to support installment tracking and prevent double-selling
CREATE UNIQUE INDEX "contract_installments_contract_no_uq" ON "contract_installments" USING btree ("contract_id","installment_no");--> statement-breakpoint
CREATE UNIQUE INDEX "plot_sale_contracts_open_per_plot_uq" ON "plot_sale_contracts" USING btree ("plot_id") WHERE "status" IN ('ACTIVE','DELINQUENT');--> statement-breakpoint

-- Stored procedures to keep multi-step operations atomic (Neon HTTP client cannot rely on interactive transactions)
CREATE OR REPLACE FUNCTION public.create_plot_sale_contract(
  p_plot_id uuid,
  p_client_contact_id uuid,
  p_start_date date,
  p_term_months integer,
  p_total_contract_value numeric,
  p_purchase_plan public.purchase_plan,
  p_downpayment_percent numeric,
  p_downpayment_amount numeric,
  p_cancellation_fee_percent numeric,
  p_grace_days integer,
  p_delinquent_days_threshold integer,
  p_created_by text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_contract_id uuid;
  v_downpayment numeric := COALESCE(p_downpayment_amount, 0);
  v_financed numeric;
  v_base numeric;
  v_last numeric;
  v_offset_months integer;
  i integer;
BEGIN
  IF p_term_months IS NULL OR p_term_months < 1 OR p_term_months > 24 THEN
    RAISE EXCEPTION 'term_months must be between 1 and 24';
  END IF;

  -- Ensure plot is sellable
  PERFORM 1
  FROM public.plots
  WHERE id = p_plot_id
    AND is_deleted = false
    AND availability = 'AVAILABLE'
    AND active_contract_id IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Plot is not available for sale';
  END IF;

  IF p_purchase_plan = 'FLAT_RATE' THEN
    v_downpayment := 0;
  ELSE
    IF v_downpayment = 0 AND p_downpayment_percent IS NOT NULL AND p_downpayment_percent > 0 THEN
      v_downpayment := round(p_total_contract_value * (p_downpayment_percent / 100.0), 2);
    END IF;
  END IF;

  IF v_downpayment < 0 OR v_downpayment > p_total_contract_value THEN
    RAISE EXCEPTION 'Invalid downpayment';
  END IF;

  v_financed := p_total_contract_value - v_downpayment;

  INSERT INTO public.plot_sale_contracts(
    plot_id,
    client_contact_id,
    status,
    start_date,
    term_months,
    total_contract_value,
    purchase_plan,
    downpayment_percent,
    downpayment_amount,
    financed_amount,
    cancellation_fee_percent,
    grace_days,
    delinquent_days_threshold,
    created_at,
    updated_at
  ) VALUES (
    p_plot_id,
    p_client_contact_id,
    'ACTIVE',
    p_start_date,
    p_term_months,
    p_total_contract_value,
    p_purchase_plan,
    p_downpayment_percent,
    v_downpayment,
    v_financed,
    p_cancellation_fee_percent,
    COALESCE(p_grace_days, 0),
    COALESCE(p_delinquent_days_threshold, 1),
    now(),
    now()
  )
  RETURNING id INTO v_contract_id;

  -- Hold plot
  UPDATE public.plots
  SET active_contract_id = v_contract_id,
      contact_id = p_client_contact_id,
      updated_at = now()
  WHERE id = p_plot_id;

  -- Optional downpayment installment (installment_no=0) due immediately on start_date
  IF v_downpayment > 0 THEN
    INSERT INTO public.contract_installments(
      contract_id,
      installment_no,
      due_date,
      amount_due,
      amount_paid,
      status,
      created_at,
      updated_at
    ) VALUES (
      v_contract_id,
      0,
      p_start_date,
      v_downpayment,
      0,
      'DUE',
      now(),
      now()
    );
  END IF;

  -- Monthly installments
  v_base := trunc(v_financed / p_term_months, 2);
  v_last := v_financed - (v_base * (p_term_months - 1));

  v_offset_months := CASE WHEN v_downpayment > 0 THEN 1 ELSE 0 END;

  FOR i IN 1..p_term_months LOOP
    INSERT INTO public.contract_installments(
      contract_id,
      installment_no,
      due_date,
      amount_due,
      amount_paid,
      status,
      created_at,
      updated_at
    ) VALUES (
      v_contract_id,
      i,
      (p_start_date + ((i - 1 + v_offset_months) * interval '1 month'))::date,
      CASE WHEN i = p_term_months THEN v_last ELSE v_base END,
      0,
      'DUE',
      now(),
      now()
    );
  END LOOP;

  INSERT INTO public.contract_events(contract_id, event_type, message, meta, created_by, created_at)
  VALUES (v_contract_id, 'CONTRACT_CREATED', 'Contract created', jsonb_build_object('purchasePlan', p_purchase_plan), p_created_by, now());

  RETURN v_contract_id;
END;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.post_contract_payment(
  p_contract_id uuid,
  p_amount numeric,
  p_received_at timestamptz,
  p_method text,
  p_reference text,
  p_created_by text
)
RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_payment_id uuid;
  v_client_contact_id uuid;
  v_plot_id uuid;
  v_remaining numeric;
  v_outstanding numeric;
  r record;
  v_apply numeric;
  v_min_unpaid_due date;
  v_grace_days integer;
BEGIN
  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Payment amount must be > 0';
  END IF;

  SELECT c.client_contact_id, c.plot_id, c.grace_days
  INTO v_client_contact_id, v_plot_id, v_grace_days
  FROM public.plot_sale_contracts c
  WHERE c.id = p_contract_id
    AND c.status IN ('ACTIVE','DELINQUENT');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found or not payable';
  END IF;

  SELECT COALESCE(SUM(i.amount_due - i.amount_paid), 0)
  INTO v_outstanding
  FROM public.contract_installments i
  WHERE i.contract_id = p_contract_id
    AND i.status <> 'PAID';

  IF p_amount > v_outstanding THEN
    RAISE EXCEPTION 'Payment exceeds outstanding balance';
  END IF;

  INSERT INTO public.contract_payments(
    contract_id,
    client_contact_id,
    direction,
    amount,
    received_at,
    method,
    reference,
    created_by,
    created_at
  ) VALUES (
    p_contract_id,
    v_client_contact_id,
    'IN',
    p_amount,
    COALESCE(p_received_at, now()),
    p_method,
    p_reference,
    p_created_by,
    now()
  )
  RETURNING id INTO v_payment_id;

  v_remaining := p_amount;

  FOR r IN (
    SELECT id, amount_due, amount_paid
    FROM public.contract_installments
    WHERE contract_id = p_contract_id
      AND status <> 'PAID'
    ORDER BY due_date ASC, installment_no ASC
    FOR UPDATE
  ) LOOP
    EXIT WHEN v_remaining <= 0;

    v_apply := LEAST(v_remaining, (r.amount_due - r.amount_paid));

    INSERT INTO public.contract_payment_allocations(payment_id, installment_id, amount, created_at)
    VALUES (v_payment_id, r.id, v_apply, now());

    UPDATE public.contract_installments
    SET amount_paid = amount_paid + v_apply,
        status = CASE
          WHEN (amount_paid + v_apply) >= amount_due THEN 'PAID'
          WHEN (amount_paid + v_apply) > 0 THEN 'PARTIAL'
          ELSE status
        END,
        paid_at = CASE
          WHEN (amount_paid + v_apply) >= amount_due THEN COALESCE(p_received_at, now())
          ELSE paid_at
        END,
        updated_at = now()
    WHERE id = r.id;

    v_remaining := v_remaining - v_apply;
  END LOOP;

  -- Complete contract if all installments are paid
  IF NOT EXISTS (
    SELECT 1 FROM public.contract_installments
    WHERE contract_id = p_contract_id AND status <> 'PAID'
  ) THEN
    UPDATE public.plot_sale_contracts
    SET status = 'COMPLETED',
        delinquent_since = NULL,
        updated_at = now()
    WHERE id = p_contract_id;

    UPDATE public.plots
    SET availability = 'SOLD',
        active_contract_id = NULL,
        updated_at = now()
    WHERE id = v_plot_id;

    INSERT INTO public.contract_events(contract_id, event_type, message, created_by, created_at)
    VALUES (p_contract_id, 'CONTRACT_COMPLETED', 'Contract fully paid', p_created_by, now());

    RETURN v_payment_id;
  END IF;

  -- If contract was delinquent, it may be cured by this payment
  SELECT MIN(due_date)
  INTO v_min_unpaid_due
  FROM public.contract_installments
  WHERE contract_id = p_contract_id
    AND status <> 'PAID';

  IF v_min_unpaid_due IS NOT NULL AND current_date <= (v_min_unpaid_due + COALESCE(v_grace_days, 0)) THEN
    UPDATE public.plot_sale_contracts
    SET status = 'ACTIVE',
        delinquent_since = NULL,
        updated_at = now()
    WHERE id = p_contract_id AND status = 'DELINQUENT';
  END IF;

  RETURN v_payment_id;
END;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.cancel_contract(
  p_contract_id uuid,
  p_cancelled_by text,
  p_reason text,
  p_refund_method text,
  p_refund_reference text
)
RETURNS TABLE(cancellation_fee_amount numeric, refund_amount numeric)
LANGUAGE plpgsql
AS $$
DECLARE
  v_plot_id uuid;
  v_client_contact_id uuid;
  v_total_contract_value numeric;
  v_fee_percent numeric;
  v_total_paid numeric;
  v_fee numeric;
  v_refund numeric;
BEGIN
  SELECT plot_id, client_contact_id, total_contract_value, cancellation_fee_percent
  INTO v_plot_id, v_client_contact_id, v_total_contract_value, v_fee_percent
  FROM public.plot_sale_contracts
  WHERE id = p_contract_id
    AND status IN ('ACTIVE','DELINQUENT')
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found or not cancellable';
  END IF;

  SELECT COALESCE(SUM(amount), 0)
  INTO v_total_paid
  FROM public.contract_payments
  WHERE contract_id = p_contract_id AND direction = 'IN';

  v_fee := round(v_total_contract_value * (v_fee_percent / 100.0), 2);
  v_refund := GREATEST(0, v_total_paid - v_fee);

  UPDATE public.plot_sale_contracts
  SET status = 'CANCELLED',
      cancelled_at = now(),
      cancelled_by = p_cancelled_by,
      cancellation_fee_amount = v_fee,
      refunded_amount = v_refund,
      cancellation_reason = p_reason,
      delinquent_since = NULL,
      updated_at = now()
  WHERE id = p_contract_id;

  IF v_refund > 0 THEN
    INSERT INTO public.contract_payments(
      contract_id,
      client_contact_id,
      direction,
      amount,
      received_at,
      method,
      reference,
      created_by,
      created_at
    ) VALUES (
      p_contract_id,
      v_client_contact_id,
      'OUT',
      v_refund,
      now(),
      p_refund_method,
      p_refund_reference,
      p_cancelled_by,
      now()
    );
  END IF;

  UPDATE public.plots
  SET availability = 'AVAILABLE',
      active_contract_id = NULL,
      contact_id = NULL,
      updated_at = now()
  WHERE id = v_plot_id;

  INSERT INTO public.contract_events(contract_id, event_type, message, meta, created_by, created_at)
  VALUES (
    p_contract_id,
    'CONTRACT_CANCELLED',
    'Contract cancelled',
    jsonb_build_object('cancellationFee', v_fee, 'refund', v_refund),
    p_cancelled_by,
    now()
  );

  cancellation_fee_amount := v_fee;
  refund_amount := v_refund;
  RETURN NEXT;
END;
$$;--> statement-breakpoint

CREATE OR REPLACE FUNCTION public.evaluate_contract_delinquency(p_as_of date)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated integer := 0;
BEGIN
  -- Mark ACTIVE -> DELINQUENT
  WITH due AS (
    SELECT c.id AS contract_id,
           MIN(i.due_date) AS min_unpaid_due,
           c.grace_days,
           c.delinquent_days_threshold
    FROM public.plot_sale_contracts c
    JOIN public.contract_installments i ON i.contract_id = c.id
    WHERE c.status = 'ACTIVE'
      AND i.status <> 'PAID'
    GROUP BY c.id, c.grace_days, c.delinquent_days_threshold
  )
  UPDATE public.plot_sale_contracts c
  SET status = 'DELINQUENT',
      delinquent_since = COALESCE(c.delinquent_since, now()),
      updated_at = now()
  FROM due
  WHERE c.id = due.contract_id
    AND p_as_of > (due.min_unpaid_due + (COALESCE(due.grace_days, 0) + COALESCE(due.delinquent_days_threshold, 0)));

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  -- Cure DELINQUENT -> ACTIVE when within grace window for oldest unpaid installment
  WITH due2 AS (
    SELECT c.id AS contract_id,
           MIN(i.due_date) AS min_unpaid_due,
           c.grace_days
    FROM public.plot_sale_contracts c
    JOIN public.contract_installments i ON i.contract_id = c.id
    WHERE c.status = 'DELINQUENT'
      AND i.status <> 'PAID'
    GROUP BY c.id, c.grace_days
  )
  UPDATE public.plot_sale_contracts c
  SET status = 'ACTIVE',
      delinquent_since = NULL,
      updated_at = now()
  FROM due2
  WHERE c.id = due2.contract_id
    AND p_as_of <= (due2.min_unpaid_due + COALESCE(due2.grace_days, 0));

  RETURN v_updated;
END;
$$;
