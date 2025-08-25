-- to create the ebooks table
CREATE TABLE public.ebooks (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text NOT NULL,
    author text,
    price numeric(10, 2) NOT NULL DEFAULT 0,
    cover_image_url text,
    file_url text,
    file_type text,
    is_free boolean GENERATED ALWAYS AS (price <= 0) STORED,
    created_at timestamp with time zone NULL DEFAULT now(),
    updated_at timestamp with time zone NULL DEFAULT now(),
    CONSTRAINT ebooks_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- to create trigger to update the updated_at column
CREATE TRIGGER update_ebooks_updated_at
BEFORE UPDATE ON public.ebooks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a function to notify users about a new ebook
CREATE OR REPLACE FUNCTION public.notify_new_ebook()
RETURNS TRIGGER AS $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN SELECT id FROM public.profiles LOOP
    INSERT INTO public.notifications (user_id, title, message, type, role, related_id, related_table)
    VALUES (
      profile_record.id,
      'New E-book Available!',
      'A new e-book has been added: ' || NEW.title,
      'info',
      'user',
      NEW.id,
      'ebooks'
    );
  END LOOP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to execute the function when a new ebook is inserted
CREATE TRIGGER new_ebook_notification_trigger
AFTER INSERT ON public.ebooks
FOR EACH ROW
EXECUTE FUNCTION public.notify_new_ebook();
