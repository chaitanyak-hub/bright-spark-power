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
    const requestBody = await req.json();
    console.log('Received request body:', JSON.stringify(requestBody, null, 2));

    const perseApiKey = Deno.env.get('PERSE_API_KEY');
    if (!perseApiKey) {
      console.error('PERSE_API_KEY not found in environment variables');
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Making request to Perse API...');
    const response = await fetch('https://api.perse.io/ncc/api/v1/transform/async-battery-optimizer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perseApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Perse API response status:', response.status);
    const responseData = await response.json();
    console.log('Perse API response data:', JSON.stringify(responseData, null, 2));

    if (!response.ok) {
      console.error('Perse API error:', responseData);
      return new Response(JSON.stringify({ 
        error: 'API request failed', 
        details: responseData 
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(responseData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in battery-optimizer function:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error', 
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});