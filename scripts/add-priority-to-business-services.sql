ALTER TABLE public.business_services
ADD COLUMN priority TEXT NOT NULL DEFAULT 'medium'
CHECK (priority IN ('low', 'medium', 'high'));
