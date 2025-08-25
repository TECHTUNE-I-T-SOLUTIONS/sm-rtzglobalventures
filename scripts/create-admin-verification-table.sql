-- I'm creating a temporary table for admin verification
CREATE TABLE IF NOT EXISTS public.admin_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  verification_code text NOT NULL,
           expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '15 minutes'),
  created_at timestamp with time zone DEFAULT now(),
  verified_at timestamp with time zone NULL,
  CONSTRAINT admin_verifications_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Createed index for performance
CREATE INDEX IF NOT EXISTS idx_admin_verifications_email ON public.admin_verifications(email);
CREATE INDEX IF NOT EXISTS idx_admin_verifications_expires_at ON public.admin_verifications(expires_at);

-- to grant permissions
GRANT ALL ON public.admin_verifications TO authenticated, anon, service_role;

-- the function to clean up expired verifications
CREATE OR REPLACE FUNCTION cleanup_expired_admin_verifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.admin_verifications 
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

-- to create a trigger to automatically clean up expired verifications
CREATE OR REPLACE FUNCTION trigger_cleanup_expired_admin_verifications()
RETURNS trigger AS $$
BEGIN
  PERFORM cleanup_expired_admin_verifications();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- to create trigger (runs on any insert/update)
DROP TRIGGER IF EXISTS cleanup_expired_admin_verifications_trigger ON public.admin_verifications;
CREATE TRIGGER cleanup_expired_admin_verifications_trigger
  AFTER INSERT OR UPDATE ON public.admin_verifications
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_expired_admin_verifications();

-- Function to generate verification code
CREATE OR REPLACE FUNCTION generate_admin_verification_code()
RETURNS text AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to create admin verification
CREATE OR REPLACE FUNCTION create_admin_verification(
  p_email text,
  p_full_name text
)
RETURNS text AS $$
DECLARE
  v_verification_code text;
BEGIN
  -- to generate 6-digit verification code
  v_verification_code := generate_admin_verification_code();
  
  -- to insert or update verification record
  INSERT INTO public.admin_verifications (email, full_name, verification_code)
  VALUES (p_email, p_full_name, v_verification_code)
  ON CONFLICT (email) 
  DO UPDATE SET 
    full_name = EXCLUDED.full_name,
    verification_code = v_verification_code,
               expires_at = now() + interval '15 minutes',
    verified_at = NULL;
  
  RETURN v_verification_code;
END;
$$ LANGUAGE plpgsql;

-- Function to verify admin verification code
CREATE OR REPLACE FUNCTION verify_admin_verification(
  p_email text,
  p_verification_code text
)
RETURNS boolean AS $$
DECLARE
  v_count integer;
BEGIN
  -- to check if verification code is valid and not expired
  SELECT COUNT(*) INTO v_count
  FROM public.admin_verifications
  WHERE email = p_email 
    AND verification_code = p_verification_code
    AND expires_at > now()
    AND verified_at IS NULL;
  
  -- If valid, mark as verified
  IF v_count > 0 THEN
    UPDATE public.admin_verifications
    SET verified_at = now()
    WHERE email = p_email 
      AND verification_code = p_verification_code;
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get verified admin data
CREATE OR REPLACE FUNCTION get_verified_admin_data(p_email text)
RETURNS TABLE(full_name text, email text) AS $$
BEGIN
  RETURN QUERY
  SELECT av.full_name, av.email
  FROM public.admin_verifications av
  WHERE av.email = p_email 
    AND av.verified_at IS NOT NULL
    AND av.expires_at > now();
END;
$$ LANGUAGE plpgsql;

-- to grant execute permissions
GRANT EXECUTE ON FUNCTION create_admin_verification(text, text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION verify_admin_verification(text, text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION get_verified_admin_data(text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION cleanup_expired_admin_verifications() TO authenticated, anon, service_role; 