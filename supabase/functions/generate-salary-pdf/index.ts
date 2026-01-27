import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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

    // Verify the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
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

    console.log(`Generating PDF for salary record: ${salaryRecordId}`);

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

    // Generate HTML for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Salary Slip - ${employeeProfile.full_name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #333;
      background: #fff;
      padding: 40px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      border: 2px solid #1a1a2e;
      padding: 30px;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #1a1a2e;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    .company-name {
      font-size: 28px;
      font-weight: bold;
      color: #1a1a2e;
      margin-bottom: 5px;
    }
    .slip-title {
      font-size: 18px;
      color: #666;
      margin-top: 10px;
    }
    .period {
      font-size: 14px;
      color: #888;
      margin-top: 5px;
    }
    .employee-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      padding: 15px;
      background: #f8f9fa;
      border-radius: 8px;
    }
    .info-group {
      flex: 1;
    }
    .info-label {
      font-size: 10px;
      text-transform: uppercase;
      color: #666;
      margin-bottom: 3px;
    }
    .info-value {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a2e;
    }
    .salary-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .salary-table th,
    .salary-table td {
      padding: 12px 15px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }
    .salary-table th {
      background: #1a1a2e;
      color: white;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 11px;
    }
    .salary-table tr:nth-child(even) {
      background: #f8f9fa;
    }
    .amount {
      text-align: right;
      font-family: 'Courier New', monospace;
      font-weight: 600;
    }
    .amount.negative {
      color: #dc3545;
    }
    .amount.positive {
      color: #28a745;
    }
    .subtotal-row {
      background: #e9ecef !important;
      font-weight: 600;
    }
    .total-row {
      background: #1a1a2e !important;
      color: white;
      font-size: 16px;
    }
    .total-row td {
      border-bottom: none;
      padding: 15px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .generated-info {
      font-size: 10px;
      color: #888;
    }
    .status-badge {
      padding: 5px 15px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-finalized {
      background: #d4edda;
      color: #155724;
    }
    .status-draft {
      background: #fff3cd;
      color: #856404;
    }
    .signature-section {
      display: flex;
      justify-content: space-between;
      margin-top: 50px;
      padding-top: 20px;
    }
    .signature-box {
      text-align: center;
      width: 200px;
    }
    .signature-line {
      border-top: 1px solid #333;
      margin-bottom: 5px;
    }
    .signature-label {
      font-size: 10px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="company-name">AgencyOps</div>
      <div class="slip-title">Salary Slip</div>
      <div class="period">${formatDate(record.period_start)} - ${formatDate(record.period_end)}</div>
    </div>

    <div class="employee-info">
      <div class="info-group">
        <div class="info-label">Employee Name</div>
        <div class="info-value">${employeeProfile.full_name}</div>
      </div>
      <div class="info-group">
        <div class="info-label">Email</div>
        <div class="info-value">${employeeProfile.email}</div>
      </div>
      <div class="info-group">
        <div class="info-label">Department</div>
        <div class="info-value">${employeeProfile.department || "General"}</div>
      </div>
    </div>

    <table class="salary-table">
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Base Salary</strong></td>
          <td class="amount">${formatCurrency(record.base_salary)}</td>
        </tr>
        
        ${totalAdditions > 0 ? `
        <tr>
          <td colspan="2" style="background: #f0f9f4; font-weight: 600; color: #28a745;">
            Additions
          </td>
        </tr>
        ${record.extra_work_additions && record.extra_work_additions > 0 ? `
        <tr>
          <td style="padding-left: 30px;">Extra Work Compensation</td>
          <td class="amount positive">+${formatCurrency(record.extra_work_additions)}</td>
        </tr>
        ` : ""}
        ${record.other_additions && record.other_additions > 0 ? `
        <tr>
          <td style="padding-left: 30px;">Other Additions</td>
          <td class="amount positive">+${formatCurrency(record.other_additions)}</td>
        </tr>
        ` : ""}
        <tr class="subtotal-row">
          <td style="padding-left: 30px;">Total Additions</td>
          <td class="amount positive">+${formatCurrency(totalAdditions)}</td>
        </tr>
        ` : ""}

        ${totalDeductions > 0 ? `
        <tr>
          <td colspan="2" style="background: #fdf4f4; font-weight: 600; color: #dc3545;">
            Deductions
          </td>
        </tr>
        ${record.late_deductions && record.late_deductions > 0 ? `
        <tr>
          <td style="padding-left: 30px;">Late Attendance Penalty</td>
          <td class="amount negative">-${formatCurrency(record.late_deductions)}</td>
        </tr>
        ` : ""}
        ${record.leave_deductions && record.leave_deductions > 0 ? `
        <tr>
          <td style="padding-left: 30px;">Unpaid Leave Deduction</td>
          <td class="amount negative">-${formatCurrency(record.leave_deductions)}</td>
        </tr>
        ` : ""}
        ${record.leave_penalties && record.leave_penalties > 0 ? `
        <tr>
          <td style="padding-left: 30px;">Leave Notice Penalty</td>
          <td class="amount negative">-${formatCurrency(record.leave_penalties)}</td>
        </tr>
        ` : ""}
        ${record.tod_penalties && record.tod_penalties > 0 ? `
        <tr>
          <td style="padding-left: 30px;">Missing TOD Penalty</td>
          <td class="amount negative">-${formatCurrency(record.tod_penalties)}</td>
        </tr>
        ` : ""}
        ${record.eod_penalties && record.eod_penalties > 0 ? `
        <tr>
          <td style="padding-left: 30px;">Missing EOD Penalty</td>
          <td class="amount negative">-${formatCurrency(record.eod_penalties)}</td>
        </tr>
        ` : ""}
        ${record.other_deductions && record.other_deductions > 0 ? `
        <tr>
          <td style="padding-left: 30px;">Other Deductions</td>
          <td class="amount negative">-${formatCurrency(record.other_deductions)}</td>
        </tr>
        ` : ""}
        <tr class="subtotal-row">
          <td style="padding-left: 30px;">Total Deductions</td>
          <td class="amount negative">-${formatCurrency(totalDeductions)}</td>
        </tr>
        ` : ""}

        <tr class="total-row">
          <td><strong>Net Salary</strong></td>
          <td class="amount" style="color: white; font-size: 18px;">${formatCurrency(record.net_salary)}</td>
        </tr>
      </tbody>
    </table>

    <div class="signature-section">
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">Employee Signature</div>
      </div>
      <div class="signature-box">
        <div class="signature-line"></div>
        <div class="signature-label">Authorized Signature</div>
      </div>
    </div>

    <div class="footer">
      <div class="generated-info">
        Generated on ${formatDate(record.generated_at || new Date().toISOString())}
        <br>
        Slip ID: ${record.id.slice(0, 8).toUpperCase()}
      </div>
      <div class="status-badge ${record.is_finalized ? "status-finalized" : "status-draft"}">
        ${record.is_finalized ? "Finalized" : "Draft"}
      </div>
    </div>
  </div>
</body>
</html>
    `;

    console.log("PDF HTML generated successfully");

    // Return HTML that can be printed/saved as PDF
    return new Response(htmlContent, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      },
    });

  } catch (error) {
    console.error("Error generating salary PDF:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
