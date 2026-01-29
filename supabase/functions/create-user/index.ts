import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  mobile?: string;
  department?: string;
  monthly_salary?: number;
  work_start_time?: string;
  work_end_time?: string;
  role?: "admin" | "employee";
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the requesting user is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's token to verify they're an admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: requestingUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !requestingUser) {
      throw new Error("Unauthorized");
    }

    // Check if requesting user is admin
    const { data: roleData, error: roleError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .single();

    if (roleError || roleData?.role !== "admin") {
      throw new Error("Only admins can create users");
    }

    // Parse request body
    const body: CreateUserRequest = await req.json();
    const { email, password, full_name, mobile, department, monthly_salary, work_start_time, work_end_time, role } = body;

    if (!email || !password || !full_name) {
      throw new Error("Email, password, and full name are required");
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create user using admin API (doesn't affect current session)
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
      },
    });

    if (createError) {
      throw createError;
    }

    if (!newUser.user) {
      throw new Error("Failed to create user");
    }

    // Wait for trigger to create profile
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update profile with additional data
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        mobile: mobile || null,
        department: department || null,
        monthly_salary: monthly_salary || 0,
        work_start_time: work_start_time || "09:00:00",
        work_end_time: work_end_time || "18:00:00",
      })
      .eq("user_id", newUser.user.id);

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // Update role if different from default
    if (role && role !== "employee") {
      const { error: roleUpdateError } = await adminClient
        .from("user_roles")
        .update({ role })
        .eq("user_id", newUser.user.id);

      if (roleUpdateError) {
        console.error("Role update error:", roleUpdateError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, user: newUser.user }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
