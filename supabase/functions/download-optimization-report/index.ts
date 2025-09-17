import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { logGuid, solarPvUnitCost, batteryUnitCost } = await req.json();
    
    console.log('Downloading report for GUID:', logGuid);
    console.log('Costs - Solar:', solarPvUnitCost, 'Battery:', batteryUnitCost);

    const response = await fetch('https://api.perse.io/ncc/api/v1/transform/solar-pv/report-download-csv', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic YWRtaW46YWRtaW4xMjM=',
      },
      body: JSON.stringify({
        logGuid,
        solarPvUnitCost: Number(solarPvUnitCost),
        batteryUnitCost: Number(batteryUnitCost)
      }),
    });

    console.log('Report download response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Report download error:', errorData);
      return new Response(JSON.stringify({ 
        error: 'Failed to download report', 
        details: errorData 
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const csvContent = await response.text();
    console.log('CSV content received, length:', csvContent.length);

    return new Response(JSON.stringify({
      csvContent,
      success: true
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in download-optimization-report function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});