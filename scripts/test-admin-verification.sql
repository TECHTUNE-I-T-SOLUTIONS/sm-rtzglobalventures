-- Test script for admin verification system
-- Run this in Supabase SQL Editor to test the functions

-- Test 1: Create a verification
SELECT create_admin_verification('test@smartzglobal.com', 'Test Admin');

-- Test 2: Check if verification was created
SELECT * FROM admin_verifications WHERE email = 'test@smartzglobal.com';

-- Test 3: Verify the code (replace '123456' with the actual code from step 2)
SELECT verify_admin_verification('test@smartzglobal.com', '123456');

-- Test 4: Check if verification was marked as verified
SELECT * FROM admin_verifications WHERE email = 'test@smartzglobal.com';

-- Test 5: Get verified admin data
SELECT * FROM get_verified_admin_data('test@smartzglobal.com');

-- Test 6: Clean up test data
DELETE FROM admin_verifications WHERE email = 'test@smartzglobal.com';

-- Test 7: Test cleanup function
SELECT cleanup_expired_admin_verifications();

-- Verification that everything is working:
-- 1. create_admin_verification should return a 6-digit code
-- 2. verify_admin_verification should return true for valid codes
-- 3. get_verified_admin_data should return the admin data
-- 4. cleanup function should not throw errors 