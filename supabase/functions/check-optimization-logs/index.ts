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

    console.log('Checking logs for process GUID:', processGuid);

    const response = await fetch(`https://api.perse.io/ncc/api/v1/transform/logs/get-processing-log?process-guid=${processGuid}`, {
      method: 'GET',
      headers: {
        'Authorization': 'Basic YWRtaW46YWRtaW4xMjM=',
      },
    });

    console.log('Logs API response status:', response.status);
    
    const logsData = await response.json();
    console.log('Logs data:', JSON.stringify(logsData, null, 2));

    if (!response.ok) {
      console.error('Logs API error:', logsData);
      return new Response(JSON.stringify({ 
        error: 'Failed to fetch logs', 
        details: logsData 
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check completion criteria
    const logs = Array.isArray(logsData) ? logsData : [logsData];
    const hasSuccess = logs.some(log => log.code === 'cc-success' && log.status === 'SUCCESS');
    const hasFailed = logs.some(log => log.status === 'FAILED');

    let status = 'Processing';
    if (hasSuccess) {
      status = 'Succeeded';
    } else if (hasFailed) {
      status = 'Failed';
    }

    return new Response(JSON.stringify({
      status,
      logs,
      isComplete: status === 'Succeeded' || status === 'Failed',
      processGuid
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in check-optimization-logs function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});