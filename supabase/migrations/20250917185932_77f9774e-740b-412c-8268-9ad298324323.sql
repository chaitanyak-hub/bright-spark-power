-- Fix the chicken-and-egg problem with company creation
-- Allow any authenticated user to INSERT companies, then we'll handle access separately
DROP POLICY IF EXISTS "Users can insert companies" ON public.companies;

CREATE POLICY "Authenticated users can create companies" 
ON public.companies 
FOR INSERT 
TO authenticated 
WITH CHECK (true); -- Allow any authenticated user to create companies

-- Create a function to handle company creation + access grant atomically
CREATE OR REPLACE FUNCTION public.create_company_with_access(
  company_name text,
  companies_house_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_company_id uuid;
BEGIN
  -- Insert the new company
  INSERT INTO public.companies (name, companies_house_id)
  VALUES (company_name, companies_house_id)
  RETURNING id INTO new_company_id;
  
  -- Grant the current user access to this company
  INSERT INTO public.user_company_access (user_id, company_id, role)
  VALUES (auth.uid(), new_company_id, 'admin');
  
  RETURN new_company_id;
END;
$$;

-- Also need to allow users to INSERT into user_company_access for their own records
CREATE POLICY "Users can grant themselves company access" 
ON public.user_company_access 
FOR INSERT 
TO authenticated 
WITH CHECK (user_id = auth.uid());