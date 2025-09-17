-- Fix critical security vulnerability in contacts table
-- Remove the overly permissive policy that allows public access
DROP POLICY IF EXISTS "Allow all operations on contacts" ON public.contacts;

-- Create secure RLS policies for contacts table
-- Policy 1: Only authenticated users can view contacts
CREATE POLICY "Authenticated users can view contacts" 
ON public.contacts 
FOR SELECT 
TO authenticated 
USING (true);

-- Policy 2: Only authenticated users can insert contacts
CREATE POLICY "Authenticated users can insert contacts" 
ON public.contacts 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy 3: Only authenticated users can update contacts
CREATE POLICY "Authenticated users can update contacts" 
ON public.contacts 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Policy 4: Only authenticated users can delete contacts
CREATE POLICY "Authenticated users can delete contacts" 
ON public.contacts 
FOR DELETE 
TO authenticated 
USING (true);

-- Also secure the companies table which has the same vulnerability
DROP POLICY IF EXISTS "Allow all operations on companies" ON public.companies;

CREATE POLICY "Authenticated users can view companies" 
ON public.companies 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert companies" 
ON public.companies 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update companies" 
ON public.companies 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete companies" 
ON public.companies 
FOR DELETE 
TO authenticated 
USING (true);

-- Also secure other tables that have overly permissive policies
DROP POLICY IF EXISTS "Allow all operations on sites" ON public.sites;

CREATE POLICY "Authenticated users can view sites" 
ON public.sites 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert sites" 
ON public.sites 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update sites" 
ON public.sites 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete sites" 
ON public.sites 
FOR DELETE 
TO authenticated 
USING (true);

-- Secure meters table
DROP POLICY IF EXISTS "Allow all operations on meters" ON public.meters;

CREATE POLICY "Authenticated users can view meters" 
ON public.meters 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert meters" 
ON public.meters 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update meters" 
ON public.meters 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete meters" 
ON public.meters 
FOR DELETE 
TO authenticated 
USING (true);

-- Secure optimiser_runs table
DROP POLICY IF EXISTS "Allow all operations on optimiser_runs" ON public.optimiser_runs;

CREATE POLICY "Authenticated users can view optimiser_runs" 
ON public.optimiser_runs 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert optimiser_runs" 
ON public.optimiser_runs 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update optimiser_runs" 
ON public.optimiser_runs 
FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete optimiser_runs" 
ON public.optimiser_runs 
FOR DELETE 
TO authenticated 
USING (true);