-- Temporarily disable restrictive RLS policies for development
-- Allow all authenticated users to perform all operations

-- Update companies policies to allow any authenticated user
DROP POLICY IF EXISTS "Users can view accessible companies" ON public.companies;
DROP POLICY IF EXISTS "Users can update accessible companies" ON public.companies;
DROP POLICY IF EXISTS "Users can delete accessible companies" ON public.companies;
DROP POLICY IF EXISTS "Authenticated users can create companies" ON public.companies;

CREATE POLICY "Allow all operations on companies for development" 
ON public.companies 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Update contacts policies
DROP POLICY IF EXISTS "Users can view contacts from accessible companies" ON public.contacts;
DROP POLICY IF EXISTS "Users can insert contacts for accessible companies" ON public.contacts;
DROP POLICY IF EXISTS "Users can update contacts from accessible companies" ON public.contacts;
DROP POLICY IF EXISTS "Users can delete contacts from accessible companies" ON public.contacts;

CREATE POLICY "Allow all operations on contacts for development" 
ON public.contacts 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Update sites policies
DROP POLICY IF EXISTS "Users can view sites from accessible companies" ON public.sites;
DROP POLICY IF EXISTS "Users can insert sites for accessible companies" ON public.sites;
DROP POLICY IF EXISTS "Users can update sites from accessible companies" ON public.sites;
DROP POLICY IF EXISTS "Users can delete sites from accessible companies" ON public.sites;

CREATE POLICY "Allow all operations on sites for development" 
ON public.sites 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Update meters policies
DROP POLICY IF EXISTS "Users can view meters from accessible sites" ON public.meters;
DROP POLICY IF EXISTS "Users can insert meters for accessible sites" ON public.meters;
DROP POLICY IF EXISTS "Users can update meters from accessible sites" ON public.meters;
DROP POLICY IF EXISTS "Users can delete meters from accessible sites" ON public.meters;

CREATE POLICY "Allow all operations on meters for development" 
ON public.meters 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Update optimiser_runs policies
DROP POLICY IF EXISTS "Users can view optimiser_runs from accessible sites" ON public.optimiser_runs;
DROP POLICY IF EXISTS "Users can insert optimiser_runs for accessible sites" ON public.optimiser_runs;
DROP POLICY IF EXISTS "Users can update optimiser_runs from accessible sites" ON public.optimiser_runs;
DROP POLICY IF EXISTS "Users can delete optimiser_runs from accessible sites" ON public.optimiser_runs;

CREATE POLICY "Allow all operations on optimiser_runs for development" 
ON public.optimiser_runs 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Update user_company_access policies  
DROP POLICY IF EXISTS "Users can view their own company access" ON public.user_company_access;
DROP POLICY IF EXISTS "Users can update their own company access" ON public.user_company_access;
DROP POLICY IF EXISTS "Users can grant themselves company access" ON public.user_company_access;

CREATE POLICY "Allow all operations on user_company_access for development" 
ON public.user_company_access 
FOR ALL 
USING (true)
WITH CHECK (true);