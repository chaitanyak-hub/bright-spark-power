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
    const { processGuid } = await req.json();
    
    if (!processGuid) {
      return new Response(JSON.stringify({ error: 'Process GUID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Fetching solar PV report for process GUID:', processGuid);

    const response = await fetch(`https://api.perse.io/ncc/api/v1/transform/get-solar-pv-report?process-guid=${processGuid}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic YWRtaW46YWRtaW4xMjM=',
      },
    });

    console.log('Solar PV report API response status:', response.status);
    
    const reportData = await response.json();
    console.log('Solar PV report data:', JSON.stringify(reportData, null, 2));

    if (!response.ok) {
      console.error('Solar PV report API error:', reportData);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch solar PV report', 
        details: reportData 
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      data: reportData,
      processGuid
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-solar-pv-report function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});