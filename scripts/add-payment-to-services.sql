-- Add payment_status to business_services
ALTER TABLE public.business_services
ADD COLUMN payment_status TEXT DEFAULT 'unpaid' NOT NULL,
ADD CONSTRAINT business_services_payment_status_check CHECK (payment_status IN ('unpaid', 'paid'));

-- Add service_id to transactions
ALTER TABLE public.transactions
ADD COLUMN service_id UUID,
ADD CONSTRAINT transactions_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.business_services(id) ON DELETE SET NULL;

-- Add an index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_transactions_service_id ON public.transactions USING btree (service_id) TABLESPACE pg_default;
