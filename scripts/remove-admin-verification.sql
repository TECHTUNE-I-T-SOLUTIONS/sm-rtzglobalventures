-- due to frustration, I'll remove Admin Verification System 😂

-- to drop functions first (in reverse dependency order)
DROP FUNCTION IF EXISTS get_verified_admin_data(text);
DROP FUNCTION IF EXISTS verify_admin_verification(text, text);
DROP FUNCTION IF EXISTS create_admin_verification(text, text);
DROP FUNCTION IF EXISTS generate_admin_verification_code();
DROP FUNCTION IF EXISTS trigger_cleanup_expired_admin_verifications();
DROP FUNCTION IF EXISTS cleanup_expired_admin_verifications();

-- to drop triggers
DROP TRIGGER IF EXISTS cleanup_expired_admin_verifications_trigger ON public.admin_verifications;

-- to drop indexes
DROP INDEX IF EXISTS idx_admin_verifications_expires_at;
DROP INDEX IF EXISTS idx_admin_verifications_email;

-- to drop the main table
DROP TABLE IF EXISTS public.admin_verifications;

-- to verify cleanup
SELECT 'Admin verification system has been removed successfully' as status;

-- this is to check if any admin verification related objects remain
SELECT 
    schemaname,
    tablename,
    indexname
FROM pg_indexes 
WHERE tablename LIKE '%admin_verification%' 
   OR indexname LIKE '%admin_verification%';

SELECT 
    schemaname,
    proname
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE proname LIKE '%admin_verification%'; 