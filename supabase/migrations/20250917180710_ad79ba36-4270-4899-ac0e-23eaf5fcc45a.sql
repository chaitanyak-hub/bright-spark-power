-- Create companies table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  companies_house_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  title TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sites table
CREATE TABLE public.sites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id),
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  postcode TEXT,
  uprn TEXT,
  elec_unit_rate_pence DECIMAL(10,2),
  elec_supplier TEXT,
  gas_unit_rate_pence DECIMAL(10,2),
  gas_supplier TEXT,
  area_m2 INTEGER,
  floors INTEGER,
  year_built INTEGER,
  listed_grade TEXT CHECK (listed_grade IN ('I', 'II*', 'II', 'None')),
  heating_pct INTEGER,
  hot_water_pct INTEGER,
  lighting_pct INTEGER,
  cooking_pct INTEGER,
  others_pct INTEGER,
  loa_status TEXT NOT NULL DEFAULT 'NotStarted' CHECK (loa_status IN ('NotStarted', 'Uploaded', 'Verifying', 'Verified', 'Failed', 'Sent', 'PendingSignature')),
  loa_file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meters table
CREATE TABLE public.meters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  meter_type TEXT NOT NULL CHECK (meter_type IN ('ELEC', 'GAS')),
  mpan_top_line TEXT,
  mpan_full TEXT,
  mprn TEXT,
  mic INTEGER,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create optimiser_runs table
CREATE TABLE public.optimiser_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  mpan TEXT NOT NULL,
  mic INTEGER NOT NULL,
  battery_cost_per_kwh DECIMAL(10,2) NOT NULL,
  solar_cost_per_kw DECIMAL(10,2) NOT NULL,
  cycle_eff_pct DECIMAL(5,2) NOT NULL,
  min_thresh_pct DECIMAL(5,2) NOT NULL,
  max_thresh_pct DECIMAL(5,2) NOT NULL,
  process_guid TEXT,
  status TEXT NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Processing', 'Succeeded', 'Failed')),
  logs JSONB,
  result_csv TEXT,
  parsed_report JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.optimiser_runs ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust these based on your auth requirements)
CREATE POLICY "Allow all operations on companies" ON public.companies FOR ALL USING (true);
CREATE POLICY "Allow all operations on contacts" ON public.contacts FOR ALL USING (true);
CREATE POLICY "Allow all operations on sites" ON public.sites FOR ALL USING (true);
CREATE POLICY "Allow all operations on meters" ON public.meters FOR ALL USING (true);
CREATE POLICY "Allow all operations on optimiser_runs" ON public.optimiser_runs FOR ALL USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_sites_updated_at BEFORE UPDATE ON public.sites FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_meters_updated_at BEFORE UPDATE ON public.meters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_optimiser_runs_updated_at BEFORE UPDATE ON public.optimiser_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add constraint to check energy split sums to 100%
ALTER TABLE public.sites ADD CONSTRAINT check_energy_split_sum 
CHECK (
  CASE 
    WHEN heating_pct IS NOT NULL AND hot_water_pct IS NOT NULL AND lighting_pct IS NOT NULL AND cooking_pct IS NOT NULL AND others_pct IS NOT NULL 
    THEN (heating_pct + hot_water_pct + lighting_pct + cooking_pct + others_pct = 100)
    ELSE true
  END
);