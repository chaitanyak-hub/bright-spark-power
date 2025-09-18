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
    const { logGuid } = await req.json();
    
    if (!logGuid) {
      return new Response(JSON.stringify({ error: 'Log GUID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Downloading detailed analysis CSV for log GUID:', logGuid);

    const response = await fetch(`https://api.perse.io/ncc/api/v1/transform/solar-pv/download-csv?logGuid=${logGuid}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic YWRtaW46YWRtaW4xMjM=',
      }
    });

    console.log('Detailed analysis download API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Detailed analysis download API error:', errorData);
      return new Response(JSON.stringify({ 
        error: 'Failed to download detailed analysis', 
        details: errorData 
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const csvContent = await response.text();
    console.log('Detailed analysis CSV content received, length:', csvContent.length);

    return new Response(JSON.stringify({
      csvContent,
      success: true,
      logGuid
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in download-detailed-analysis function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});