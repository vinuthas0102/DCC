import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const demoEmail = "demo@fms.com";
    const demoPassword = "demo123";

    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingAuthUser?.users?.some(u => u.email === demoEmail);

    if (userExists) {
      return new Response(
        JSON.stringify({
          message: "Demo user already exists",
          email: demoEmail,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "Demo Admin User",
      },
      app_metadata: {
        role: "admin",
      },
    });

    if (authError) {
      throw new Error(`Failed to create auth user: ${authError.message}`);
    }

    if (!authData.user) {
      throw new Error("User creation failed");
    }

    const { error: userError } = await supabaseAdmin
      .from("users")
      .insert({
        id: authData.user.id,
        email: demoEmail,
        full_name: "Demo Admin User",
        phone: "+91 9876543210",
        role: "admin",
        govt_department: "Demo Department",
        govt_employee_id: "DEMO001",
        metadata: {},
      });

    if (userError) {
      throw new Error(`Failed to create user record: ${userError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Demo user created successfully",
        email: demoEmail,
        userId: authData.user.id,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error seeding demo user:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
