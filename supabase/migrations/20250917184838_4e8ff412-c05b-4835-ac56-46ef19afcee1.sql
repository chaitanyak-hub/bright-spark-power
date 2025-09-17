-- Create user-company access mapping table
CREATE TABLE IF NOT EXISTS public.user_company_access (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'viewer',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE(user_id, company_id)
);

-- Enable RLS on user_company_access table
ALTER TABLE public.user_company_access ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_company_access table
CREATE POLICY "Users can view their own company access" 
ON public.user_company_access 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

CREATE POLICY "Users can update their own company access" 
ON public.user_company_access 
FOR UPDATE 
TO authenticated 
USING (user_id = auth.uid()) 
WITH CHECK (user_id = auth.uid());

-- Create security definer function to check company access
CREATE OR REPLACE FUNCTION public.user_has_company_access(target_company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.user_company_access 
    WHERE user_id = auth.uid() 
    AND company_id = target_company_id
  );
$$;

-- Update companies table RLS policies to be company-scoped
DROP POLICY IF EXISTS "Authenticated users can view companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can delete companies" ON public.companies;

CREATE POLICY "Users can view accessible companies" 
ON public.companies 
FOR SELECT 
TO authenticated 
USING (public.user_has_company_access(id));

CREATE POLICY "Users can insert companies" 
ON public.companies 
FOR INSERT 
TO authenticated 
WITH CHECK (true); -- Allow creating companies, access will be granted separately

CREATE POLICY "Users can update accessible companies" 
ON public.companies 
FOR UPDATE 
TO authenticated 
USING (public.user_has_company_access(id)) 
WITH CHECK (public.user_has_company_access(id));

CREATE POLICY "Users can delete accessible companies" 
ON public.companies 
FOR DELETE 
TO authenticated 
USING (public.user_has_company_access(id));

-- Update contacts table RLS policies to be company-scoped
DROP POLICY IF EXISTS "Authenticated users can view contacts" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can insert contacts" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can update contacts" ON public.contacts;
DROP POLICY IF EXISTS "Authenticated users can delete contacts" ON public.contacts;

CREATE POLICY "Users can view contacts from accessible companies" 
ON public.contacts 
FOR SELECT 
TO authenticated 
USING (public.user_has_company_access(company_id));

CREATE POLICY "Users can insert contacts for accessible companies" 
ON public.contacts 
FOR INSERT 
TO authenticated 
WITH CHECK (public.user_has_company_access(company_id));

CREATE POLICY "Users can update contacts from accessible companies" 
ON public.contacts 
FOR UPDATE 
TO authenticated 
USING (public.user_has_company_access(company_id)) 
WITH CHECK (public.user_has_company_access(company_id));

CREATE POLICY "Users can delete contacts from accessible companies" 
ON public.contacts 
FOR DELETE 
TO authenticated 
USING (public.user_has_company_access(company_id));

-- Create security definer function to check site access via company
CREATE OR REPLACE FUNCTION public.user_has_site_access(target_site_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.sites s
    JOIN public.user_company_access uca ON s.company_id = uca.company_id
    WHERE s.id = target_site_id 
    AND uca.user_id = auth.uid()
  );
$$;

-- Update sites table RLS policies to be company-scoped
DROP POLICY IF EXISTS "Authenticated users can view sites" ON public.sites;
DROP POLICY IF EXISTS "Authenticated users can insert sites" ON public.sites;
DROP POLICY IF EXISTS "Authenticated users can update sites" ON public.sites;
DROP POLICY IF EXISTS "Authenticated users can delete sites" ON public.sites;

CREATE POLICY "Users can view sites from accessible companies" 
ON public.sites 
FOR SELECT 
TO authenticated 
USING (public.user_has_company_access(company_id));

CREATE POLICY "Users can insert sites for accessible companies" 
ON public.sites 
FOR INSERT 
TO authenticated 
WITH CHECK (public.user_has_company_access(company_id));

CREATE POLICY "Users can update sites from accessible companies" 
ON public.sites 
FOR UPDATE 
TO authenticated 
USING (public.user_has_company_access(company_id)) 
WITH CHECK (public.user_has_company_access(company_id));

CREATE POLICY "Users can delete sites from accessible companies" 
ON public.sites 
FOR DELETE 
TO authenticated 
USING (public.user_has_company_access(company_id));

-- Update meters table RLS policies to be site/company-scoped
DROP POLICY IF EXISTS "Authenticated users can view meters" ON public.meters;
DROP POLICY IF EXISTS "Authenticated users can insert meters" ON public.meters;
DROP POLICY IF EXISTS "Authenticated users can update meters" ON public.meters;
DROP POLICY IF EXISTS "Authenticated users can delete meters" ON public.meters;

CREATE POLICY "Users can view meters from accessible sites" 
ON public.meters 
FOR SELECT 
TO authenticated 
USING (public.user_has_site_access(site_id));

CREATE POLICY "Users can insert meters for accessible sites" 
ON public.meters 
FOR INSERT 
TO authenticated 
WITH CHECK (public.user_has_site_access(site_id));

CREATE POLICY "Users can update meters from accessible sites" 
ON public.meters 
FOR UPDATE 
TO authenticated 
USING (public.user_has_site_access(site_id)) 
WITH CHECK (public.user_has_site_access(site_id));

CREATE POLICY "Users can delete meters from accessible sites" 
ON public.meters 
FOR DELETE 
TO authenticated 
USING (public.user_has_site_access(site_id));

-- Update optimiser_runs table RLS policies to be site/company-scoped
DROP POLICY IF EXISTS "Authenticated users can view optimiser_runs" ON public.optimiser_runs;
DROP POLICY IF EXISTS "Authenticated users can insert optimiser_runs" ON public.optimiser_runs;
DROP POLICY IF EXISTS "Authenticated users can update optimiser_runs" ON public.optimiser_runs;
DROP POLICY IF EXISTS "Authenticated users can delete optimiser_runs" ON public.optimiser_runs;

CREATE POLICY "Users can view optimiser_runs from accessible sites" 
ON public.optimiser_runs 
FOR SELECT 
TO authenticated 
USING (public.user_has_site_access(site_id));

CREATE POLICY "Users can insert optimiser_runs for accessible sites" 
ON public.optimiser_runs 
FOR INSERT 
TO authenticated 
WITH CHECK (public.user_has_site_access(site_id));

CREATE POLICY "Users can update optimiser_runs from accessible sites" 
ON public.optimiser_runs 
FOR UPDATE 
TO authenticated 
USING (public.user_has_site_access(site_id)) 
WITH CHECK (public.user_has_site_access(site_id));

CREATE POLICY "Users can delete optimiser_runs from accessible sites" 
ON public.optimiser_runs 
FOR DELETE 
TO authenticated 
USING (public.user_has_site_access(site_id));

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_user_company_access_updated_at
BEFORE UPDATE ON public.user_company_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();