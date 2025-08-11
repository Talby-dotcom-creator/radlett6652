/*
  # Fix RLS Infinite Recursion for Member Profiles

  1. New Functions
    - `is_admin()` - Helper function to check if current user is admin
    - Uses SECURITY DEFINER to bypass RLS on internal queries

  2. Policy Updates
    - Update "Admins can update any profile" policy to use helper function
    - This prevents infinite recursion when admins update their own profiles

  3. Security
    - Function uses explicit search_path to prevent injection attacks
    - Maintains proper access control while fixing recursion issue
*/

-- Create helper function to check if current user is admin
-- This function bypasses RLS to prevent infinite recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.member_profiles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'::text
  );
END;
$$;

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Admins can update any profile" ON public.member_profiles;

-- Recreate the policy using the helper function to avoid recursion
CREATE POLICY "Admins can update any profile"
ON public.member_profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Also update the insert policy to use the helper function for consistency
DROP POLICY IF EXISTS "Admins can insert any profile" ON public.member_profiles;

CREATE POLICY "Admins can insert any profile"
ON public.member_profiles
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

-- Update the delete policy as well
DROP POLICY IF EXISTS "Only admins can delete profiles" ON public.member_profiles;

CREATE POLICY "Only admins can delete profiles"
ON public.member_profiles
FOR DELETE
TO authenticated
USING (public.is_admin());