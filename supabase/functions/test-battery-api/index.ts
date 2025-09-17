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
    // Test with the exact body provided by the user
    const testBody = {
      "mpan": "1470000721881",
      "fromDateTime": "2025-04-01T00:00",
      "toDateTime": "2026-03-31T00:00",
      "availableCapacity": null,
      "MIC": 500,
      "cycleEff": 0.95,
      "minThresh": 0.1,
      "maxThresh": 0.9,
      "batteryGross": 500.0,
      "startKwp": 0.0,
      "incrementKwp": 0.0,
      "endKwp": 0.0,
      "startKwh": 500.0,
      "incrementKwh": 100.0,
      "endKwh": 1200.0,
      "generationMetaData": {
        "panelCount": null,
        "panelCapacityWatts": 500,
        "installationCostPerWatt": 1.0,
        "dcToAcDerate": 0.85,
        "installationLifeSpan": 30,
        "efficiencyDepreciationFactor": 0.995
      }
    };

    console.log('Testing with body:', JSON.stringify(testBody, null, 2));

    const perseApiKey = Deno.env.get('PERSE_API_KEY');
    if (!perseApiKey) {
      console.error('PERSE_API_KEY not found in environment variables');
      return new Response(JSON.stringify({ 
        error: 'API key not configured',
        testBody: testBody 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Making test request to Perse API...');
    const response = await fetch('https://api.perse.io/ncc/api/v1/transform/async-battery-optimizer', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': 'PERSE-TEST-CLIENT-APIKEY-0fcac2975984',
        'Authorization': 'Basic YWRtaW46YWRtaW4xMjM=',
      },
      body: JSON.stringify(testBody),
    });

    console.log('Perse API response status:', response.status);
    console.log('Perse API response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Perse API raw response:', responseText);

    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response as JSON:', parseError);
      responseData = { rawResponse: responseText };
    }

    const result = {
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      testBody: testBody,
      responseData: responseData,
      rawResponse: responseText
    };

    console.log('Final result:', JSON.stringify(result, null, 2));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in test-battery-api function:', error);
    return new Response(JSON.stringify({ 
      error: 'Test failed', 
      message: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});