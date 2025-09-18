-- Create table to store optimization results with parameters
CREATE TABLE public.optimization_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  site_id UUID NOT NULL,
  process_guid TEXT NOT NULL,
  mpan TEXT NOT NULL,
  mic INTEGER NOT NULL,
  battery_cost_per_kwh NUMERIC NOT NULL,
  solar_cost_per_kw NUMERIC NOT NULL,
  cycle_eff_pct NUMERIC NOT NULL,
  min_thresh_pct NUMERIC NOT NULL,
  max_thresh_pct NUMERIC NOT NULL,
  scenarios_data JSONB NOT NULL,
  best_scenario JSONB NOT NULL,
  summary_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'Completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.optimization_results ENABLE ROW LEVEL SECURITY;

-- Create policy for development (allow all operations)
CREATE POLICY "Allow all operations on optimization_results for development" 
ON public.optimization_results 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_optimization_results_updated_at
BEFORE UPDATE ON public.optimization_results
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_optimization_results_site_id ON public.optimization_results(site_id);
CREATE INDEX idx_optimization_results_process_guid ON public.optimization_results(process_guid);