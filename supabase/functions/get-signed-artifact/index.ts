import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.8";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate admin user
    const authClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: { 
          headers: { 
            Authorization: req.headers.get("Authorization") ?? "" 
          } 
        }
      }
    );

    const { data: { user }, error: userError } = await authClient.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    // Check if user is admin using service role
    const svc = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: admin, error: adminError } = await svc
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .single();

    if (adminError || !admin) {
      console.error("Admin check failed:", adminError);
      return new Response("Forbidden - Admin access required", { status: 403, headers: corsHeaders });
    }

    // Parse request body
    const { jobId, path } = await req.json();

    if (!jobId || !path) {
      return new Response("Bad Request - Missing jobId or path", { status: 400, headers: corsHeaders });
    }

    // Validate job ownership (for additional security)
    const { data: job, error: jobError } = await svc
      .from("processing_jobs")
      .select("id, user_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      return new Response("Job not found", { status: 404, headers: corsHeaders });
    }

    // Generate signed URL (5 minute expiry)
    const { data: signedUrlData, error: signedUrlError } = await svc.storage
      .from("gl-artifacts")
      .createSignedUrl(path, 300); // 5 minutes

    if (signedUrlError) {
      console.error("Signed URL error:", signedUrlError);
      return new Response("Failed to generate signed URL", { status: 500, headers: corsHeaders });
    }

    return new Response(
      JSON.stringify({ signedUrl: signedUrlData.signedUrl }), 
      { 
        status: 200, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error("Get signed artifact error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }), 
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});