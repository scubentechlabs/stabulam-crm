import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@4.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SalaryRecord {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  base_salary: number;
  late_deductions: number | null;
  leave_deductions: number | null;
  leave_penalties: number | null;
  tod_penalties: number | null;
  eod_penalties: number | null;
  extra_work_additions: number | null;
  other_deductions: number | null;
  other_additions: number | null;
  net_salary: number;
  breakdown: Record<string, unknown> | null;
  is_finalized: boolean;
  generated_at: string;
}

interface Profile {
  full_name: string;
  email: string;
  department: string | null;
  monthly_salary: number;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user is an admin
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (!roleData || roleData.role !== "admin") {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { salaryRecordId } = await req.json();
    
    if (!salaryRecordId) {
      return new Response(JSON.stringify({ error: "salaryRecordId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Sending salary email for record: ${salaryRecordId}`);

    // Fetch salary record
    const { data: salaryRecord, error: salaryError } = await supabase
      .from("salary_records")
      .select("*")
      .eq("id", salaryRecordId)
      .single();

    if (salaryError || !salaryRecord) {
      console.error("Salary record error:", salaryError);
      return new Response(JSON.stringify({ error: "Salary record not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const record = salaryRecord as SalaryRecord;

    // Fetch employee profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email, department, monthly_salary")
      .eq("user_id", record.user_id)
      .single();

    if (profileError || !profile) {
      console.error("Profile error:", profileError);
      return new Response(JSON.stringify({ error: "Employee profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const employeeProfile = profile as Profile;

    // Format helpers
    const formatCurrency = (amount: number | null) => 
      `₹${(amount || 0).toLocaleString("en-IN")}`;
    
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-IN", { 
        day: "numeric", 
        month: "long", 
        year: "numeric" 
      });
    };

    // Calculate totals
    const totalDeductions = 
      (record.late_deductions || 0) +
      (record.leave_deductions || 0) +
      (record.leave_penalties || 0) +
      (record.tod_penalties || 0) +
      (record.eod_penalties || 0) +
      (record.other_deductions || 0);

    const totalAdditions = 
      (record.extra_work_additions || 0) +
      (record.other_additions || 0);

    // Generate HTML email content
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Salary Slip - ${employeeProfile.full_name}</title>
</head>
<body style="font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #333; background: #f5f5f5; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="background: #1a1a2e; color: white; padding: 30px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px;">AgencyOps</h1>
      <p style="margin: 10px 0 0; opacity: 0.9;">Salary Slip</p>
      <p style="margin: 5px 0 0; font-size: 12px; opacity: 0.7;">
        ${formatDate(record.period_start)} - ${formatDate(record.period_end)}
      </p>
    </div>

    <!-- Employee Info -->
    <div style="padding: 20px; background: #f8f9fa; border-bottom: 1px solid #e0e0e0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 5px 0;">
            <span style="color: #666; font-size: 12px;">Employee</span><br>
            <strong>${employeeProfile.full_name}</strong>
          </td>
          <td style="padding: 5px 0; text-align: right;">
            <span style="color: #666; font-size: 12px;">Department</span><br>
            <strong>${employeeProfile.department || "General"}</strong>
          </td>
        </tr>
      </table>
    </div>

    <!-- Salary Details -->
    <div style="padding: 20px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr style="border-bottom: 2px solid #1a1a2e;">
          <th style="text-align: left; padding: 12px 0; color: #1a1a2e;">Description</th>
          <th style="text-align: right; padding: 12px 0; color: #1a1a2e;">Amount</th>
        </tr>
        
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 12px 0;"><strong>Base Salary</strong></td>
          <td style="text-align: right; padding: 12px 0; font-family: monospace; font-weight: 600;">
            ${formatCurrency(record.base_salary)}
          </td>
        </tr>

        ${totalAdditions > 0 ? `
        <tr style="background: #f0f9f4;">
          <td colspan="2" style="padding: 10px 0; font-weight: 600; color: #28a745;">
            Additions
          </td>
        </tr>
        ${record.extra_work_additions && record.extra_work_additions > 0 ? `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 10px 0 10px 20px;">Extra Work Compensation</td>
          <td style="text-align: right; padding: 10px 0; font-family: monospace; color: #28a745;">
            +${formatCurrency(record.extra_work_additions)}
          </td>
        </tr>
        ` : ""}
        ${record.other_additions && record.other_additions > 0 ? `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 10px 0 10px 20px;">Other Additions</td>
          <td style="text-align: right; padding: 10px 0; font-family: monospace; color: #28a745;">
            +${formatCurrency(record.other_additions)}
          </td>
        </tr>
        ` : ""}
        <tr style="background: #e9ecef; border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 10px 0 10px 20px; font-weight: 600;">Total Additions</td>
          <td style="text-align: right; padding: 10px 0; font-family: monospace; font-weight: 600; color: #28a745;">
            +${formatCurrency(totalAdditions)}
          </td>
        </tr>
        ` : ""}

        ${totalDeductions > 0 ? `
        <tr style="background: #fdf4f4;">
          <td colspan="2" style="padding: 10px 0; font-weight: 600; color: #dc3545;">
            Deductions
          </td>
        </tr>
        ${record.late_deductions && record.late_deductions > 0 ? `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 10px 0 10px 20px;">Late Attendance Penalty</td>
          <td style="text-align: right; padding: 10px 0; font-family: monospace; color: #dc3545;">
            -${formatCurrency(record.late_deductions)}
          </td>
        </tr>
        ` : ""}
        ${record.leave_deductions && record.leave_deductions > 0 ? `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 10px 0 10px 20px;">Unpaid Leave Deduction</td>
          <td style="text-align: right; padding: 10px 0; font-family: monospace; color: #dc3545;">
            -${formatCurrency(record.leave_deductions)}
          </td>
        </tr>
        ` : ""}
        ${record.leave_penalties && record.leave_penalties > 0 ? `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 10px 0 10px 20px;">Leave Notice Penalty</td>
          <td style="text-align: right; padding: 10px 0; font-family: monospace; color: #dc3545;">
            -${formatCurrency(record.leave_penalties)}
          </td>
        </tr>
        ` : ""}
        ${record.tod_penalties && record.tod_penalties > 0 ? `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 10px 0 10px 20px;">Missing TOD Penalty</td>
          <td style="text-align: right; padding: 10px 0; font-family: monospace; color: #dc3545;">
            -${formatCurrency(record.tod_penalties)}
          </td>
        </tr>
        ` : ""}
        ${record.eod_penalties && record.eod_penalties > 0 ? `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 10px 0 10px 20px;">Missing EOD Penalty</td>
          <td style="text-align: right; padding: 10px 0; font-family: monospace; color: #dc3545;">
            -${formatCurrency(record.eod_penalties)}
          </td>
        </tr>
        ` : ""}
        ${record.other_deductions && record.other_deductions > 0 ? `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 10px 0 10px 20px;">Other Deductions</td>
          <td style="text-align: right; padding: 10px 0; font-family: monospace; color: #dc3545;">
            -${formatCurrency(record.other_deductions)}
          </td>
        </tr>
        ` : ""}
        <tr style="background: #e9ecef; border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 10px 0 10px 20px; font-weight: 600;">Total Deductions</td>
          <td style="text-align: right; padding: 10px 0; font-family: monospace; font-weight: 600; color: #dc3545;">
            -${formatCurrency(totalDeductions)}
          </td>
        </tr>
        ` : ""}

        <!-- Net Salary -->
        <tr style="background: #1a1a2e; color: white;">
          <td style="padding: 15px;"><strong>Net Salary</strong></td>
          <td style="text-align: right; padding: 15px; font-family: monospace; font-size: 18px; font-weight: bold;">
            ${formatCurrency(record.net_salary)}
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer -->
    <div style="padding: 20px; background: #f8f9fa; text-align: center; border-top: 1px solid #e0e0e0;">
      <p style="margin: 0; color: #888; font-size: 12px;">
        Generated on ${formatDate(record.generated_at || new Date().toISOString())}<br>
        Slip ID: ${record.id.slice(0, 8).toUpperCase()}
      </p>
      <p style="margin: 10px 0 0; padding: 5px 15px; display: inline-block; border-radius: 20px; font-size: 11px; font-weight: 600; ${record.is_finalized 
        ? "background: #d4edda; color: #155724;" 
        : "background: #fff3cd; color: #856404;"}">
        ${record.is_finalized ? "✓ Finalized" : "Draft"}
      </p>
    </div>
  </div>

  <p style="text-align: center; color: #888; font-size: 12px; margin-top: 20px;">
    This is an automated email from AgencyOps. Please do not reply.
  </p>
</body>
</html>
    `;

    // Send email using Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "AgencyOps <onboarding@resend.dev>", // Use your verified domain in production
      to: [employeeProfile.email],
      subject: `Your Salary Slip for ${formatDate(record.period_start)} - ${formatDate(record.period_end)}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      return new Response(
        JSON.stringify({ error: `Failed to send email: ${emailError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Salary slip sent to ${employeeProfile.email}`,
        emailId: emailData?.id 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in send-salary-email function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
