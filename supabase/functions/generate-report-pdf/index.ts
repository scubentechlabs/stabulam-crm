import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReportRequest {
  reportType: 'attendance' | 'tasks' | 'leaves';
  startDate: string;
  endDate: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user is admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!roleData || roleData.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { reportType, startDate, endDate }: ReportRequest = await req.json();
    console.log(`Generating ${reportType} report from ${startDate} to ${endDate}`);

    // Fetch profiles for employee names
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, monthly_salary')
      .eq('is_active', true);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    let reportData: any;
    let reportTitle: string;

    switch (reportType) {
      case 'attendance':
        reportData = await generateAttendanceReport(supabase, startDate, endDate, profileMap);
        reportTitle = 'Attendance Report';
        break;
      case 'tasks':
        reportData = await generateTasksReport(supabase, startDate, endDate, profileMap);
        reportTitle = 'Task Completion Report';
        break;
      case 'leaves':
        reportData = await generateLeavesReport(supabase, startDate, endDate, profileMap);
        reportTitle = 'Leave Analysis Report';
        break;
      default:
        throw new Error('Invalid report type');
    }

    // Generate HTML for PDF
    const html = generateReportHtml(reportTitle, startDate, endDate, reportData, reportType);

    return new Response(JSON.stringify({ 
      success: true, 
      html,
      title: reportTitle,
      data: reportData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating report:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateAttendanceReport(supabase: any, startDate: string, endDate: string, profileMap: Map<string, any>) {
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  const employeeStats: Record<string, any> = {};

  (attendance || []).forEach((record: any) => {
    const profile = profileMap.get(record.user_id);
    if (!profile) return;

    if (!employeeStats[record.user_id]) {
      employeeStats[record.user_id] = {
        name: profile.full_name,
        email: profile.email,
        presentDays: 0,
        lateDays: 0,
        totalLateMinutes: 0,
        totalWorkHours: 0,
      };
    }

    if (record.clock_in_time) {
      employeeStats[record.user_id].presentDays++;
      if (record.is_late) {
        employeeStats[record.user_id].lateDays++;
        employeeStats[record.user_id].totalLateMinutes += record.late_minutes || 0;
      }
      if (record.clock_in_time && record.clock_out_time) {
        const clockIn = new Date(record.clock_in_time);
        const clockOut = new Date(record.clock_out_time);
        const hours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
        employeeStats[record.user_id].totalWorkHours += hours;
      }
    }
  });

  return {
    summary: {
      totalRecords: attendance?.length || 0,
      totalEmployees: Object.keys(employeeStats).length,
    },
    employees: Object.values(employeeStats).map((e: any) => ({
      ...e,
      avgWorkHours: e.presentDays > 0 ? (e.totalWorkHours / e.presentDays).toFixed(1) : '0',
      onTimeRate: e.presentDays > 0 ? Math.round(((e.presentDays - e.lateDays) / e.presentDays) * 100) : 0,
    })),
  };
}

async function generateTasksReport(supabase: any, startDate: string, endDate: string, profileMap: Map<string, any>) {
  const { data: attendance } = await supabase
    .from('attendance')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate);

  const { data: tasks } = await supabase
    .from('tasks')
    .select('*')
    .gte('created_at', `${startDate}T00:00:00`)
    .lte('created_at', `${endDate}T23:59:59`);

  const employeeStats: Record<string, any> = {};

  (attendance || []).forEach((record: any) => {
    const profile = profileMap.get(record.user_id);
    if (!profile) return;

    if (!employeeStats[record.user_id]) {
      employeeStats[record.user_id] = {
        name: profile.full_name,
        email: profile.email,
        presentDays: 0,
        todSubmitted: 0,
        eodSubmitted: 0,
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
      };
    }

    if (record.clock_in_time) {
      employeeStats[record.user_id].presentDays++;
      if (record.tod_submitted) employeeStats[record.user_id].todSubmitted++;
      if (record.eod_submitted) employeeStats[record.user_id].eodSubmitted++;
    }
  });

  (tasks || []).forEach((task: any) => {
    if (employeeStats[task.user_id]) {
      employeeStats[task.user_id].totalTasks++;
      if (task.status === 'completed') {
        employeeStats[task.user_id].completedTasks++;
      } else {
        employeeStats[task.user_id].pendingTasks++;
      }
    }
  });

  return {
    summary: {
      totalTasks: tasks?.length || 0,
      completedTasks: tasks?.filter((t: any) => t.status === 'completed').length || 0,
      pendingTasks: tasks?.filter((t: any) => t.status === 'pending').length || 0,
    },
    employees: Object.values(employeeStats).map((e: any) => ({
      ...e,
      todRate: e.presentDays > 0 ? Math.round((e.todSubmitted / e.presentDays) * 100) : 0,
      eodRate: e.presentDays > 0 ? Math.round((e.eodSubmitted / e.presentDays) * 100) : 0,
      completionRate: e.totalTasks > 0 ? Math.round((e.completedTasks / e.totalTasks) * 100) : 0,
    })),
  };
}

async function generateLeavesReport(supabase: any, startDate: string, endDate: string, profileMap: Map<string, any>) {
  const { data: leaves } = await supabase
    .from('leaves')
    .select('*')
    .gte('start_date', startDate)
    .lte('start_date', endDate);

  const employeeStats: Record<string, any> = {};

  (leaves || []).forEach((leave: any) => {
    const profile = profileMap.get(leave.user_id);
    if (!profile) return;

    if (!employeeStats[leave.user_id]) {
      employeeStats[leave.user_id] = {
        name: profile.full_name,
        email: profile.email,
        totalRequests: 0,
        approved: 0,
        rejected: 0,
        pending: 0,
        halfDay: 0,
        fullDay: 0,
        multipleDays: 0,
        totalPenalties: 0,
      };
    }

    employeeStats[leave.user_id].totalRequests++;
    if (leave.status === 'approved') employeeStats[leave.user_id].approved++;
    else if (leave.status === 'rejected') employeeStats[leave.user_id].rejected++;
    else employeeStats[leave.user_id].pending++;

    if (leave.leave_type === 'half_day') employeeStats[leave.user_id].halfDay++;
    else if (leave.leave_type === 'full_day') employeeStats[leave.user_id].fullDay++;
    else employeeStats[leave.user_id].multipleDays++;

    employeeStats[leave.user_id].totalPenalties += leave.penalty_amount || 0;
  });

  const typeDistribution = {
    halfDay: leaves?.filter((l: any) => l.leave_type === 'half_day').length || 0,
    fullDay: leaves?.filter((l: any) => l.leave_type === 'full_day').length || 0,
    multipleDays: leaves?.filter((l: any) => l.leave_type === 'multiple_days').length || 0,
  };

  return {
    summary: {
      totalRequests: leaves?.length || 0,
      approved: leaves?.filter((l: any) => l.status === 'approved').length || 0,
      rejected: leaves?.filter((l: any) => l.status === 'rejected').length || 0,
      pending: leaves?.filter((l: any) => l.status === 'pending').length || 0,
      typeDistribution,
    },
    employees: Object.values(employeeStats),
  };
}

function generateReportHtml(title: string, startDate: string, endDate: string, data: any, reportType: string): string {
  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formatCurrency = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

  let tableHeaders = '';
  let tableRows = '';

  if (reportType === 'attendance') {
    tableHeaders = `
      <th>Employee</th>
      <th>Present Days</th>
      <th>Late Days</th>
      <th>Late Minutes</th>
      <th>Total Hours</th>
      <th>Avg Hours</th>
      <th>On-Time Rate</th>
    `;
    tableRows = data.employees.map((e: any) => `
      <tr>
        <td><strong>${e.name}</strong><br><small>${e.email}</small></td>
        <td>${e.presentDays}</td>
        <td>${e.lateDays}</td>
        <td>${e.totalLateMinutes}</td>
        <td>${e.totalWorkHours.toFixed(1)}</td>
        <td>${e.avgWorkHours}</td>
        <td>${e.onTimeRate}%</td>
      </tr>
    `).join('');
  } else if (reportType === 'tasks') {
    tableHeaders = `
      <th>Employee</th>
      <th>Present Days</th>
      <th>TOD Rate</th>
      <th>EOD Rate</th>
      <th>Total Tasks</th>
      <th>Completed</th>
      <th>Pending</th>
      <th>Completion Rate</th>
    `;
    tableRows = data.employees.map((e: any) => `
      <tr>
        <td><strong>${e.name}</strong><br><small>${e.email}</small></td>
        <td>${e.presentDays}</td>
        <td>${e.todRate}%</td>
        <td>${e.eodRate}%</td>
        <td>${e.totalTasks}</td>
        <td>${e.completedTasks}</td>
        <td>${e.pendingTasks}</td>
        <td>${e.completionRate}%</td>
      </tr>
    `).join('');
  } else if (reportType === 'leaves') {
    tableHeaders = `
      <th>Employee</th>
      <th>Total</th>
      <th>Approved</th>
      <th>Rejected</th>
      <th>Pending</th>
      <th>Half Day</th>
      <th>Full Day</th>
      <th>Multiple</th>
      <th>Penalties</th>
    `;
    tableRows = data.employees.map((e: any) => `
      <tr>
        <td><strong>${e.name}</strong><br><small>${e.email}</small></td>
        <td>${e.totalRequests}</td>
        <td>${e.approved}</td>
        <td>${e.rejected}</td>
        <td>${e.pending}</td>
        <td>${e.halfDay}</td>
        <td>${e.fullDay}</td>
        <td>${e.multipleDays}</td>
        <td>${formatCurrency(e.totalPenalties)}</td>
      </tr>
    `).join('');
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1a1a1a; background: #fff; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
    .header h1 { color: #1e40af; font-size: 28px; margin-bottom: 8px; }
    .header p { color: #64748b; font-size: 14px; }
    .summary { display: flex; justify-content: center; gap: 20px; margin-bottom: 30px; flex-wrap: wrap; }
    .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 24px; text-align: center; min-width: 140px; }
    .summary-card .value { font-size: 24px; font-weight: bold; color: #1e40af; }
    .summary-card .label { font-size: 12px; color: #64748b; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
    th { background: #1e40af; color: white; padding: 12px 8px; text-align: left; font-weight: 600; }
    td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    tr:hover { background: #f1f5f9; }
    small { color: #64748b; font-size: 11px; }
    .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
    @media print { body { padding: 20px; } .summary-card { break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <p>Period: ${formatDate(startDate)} - ${formatDate(endDate)}</p>
    <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
  </div>
  
  <div class="summary">
    ${reportType === 'attendance' ? `
      <div class="summary-card"><div class="value">${data.summary.totalEmployees}</div><div class="label">Employees</div></div>
      <div class="summary-card"><div class="value">${data.summary.totalRecords}</div><div class="label">Records</div></div>
    ` : ''}
    ${reportType === 'tasks' ? `
      <div class="summary-card"><div class="value">${data.summary.totalTasks}</div><div class="label">Total Tasks</div></div>
      <div class="summary-card"><div class="value">${data.summary.completedTasks}</div><div class="label">Completed</div></div>
      <div class="summary-card"><div class="value">${data.summary.pendingTasks}</div><div class="label">Pending</div></div>
    ` : ''}
    ${reportType === 'leaves' ? `
      <div class="summary-card"><div class="value">${data.summary.totalRequests}</div><div class="label">Total Requests</div></div>
      <div class="summary-card"><div class="value">${data.summary.approved}</div><div class="label">Approved</div></div>
      <div class="summary-card"><div class="value">${data.summary.rejected}</div><div class="label">Rejected</div></div>
      <div class="summary-card"><div class="value">${data.summary.pending}</div><div class="label">Pending</div></div>
    ` : ''}
  </div>

  <table>
    <thead><tr>${tableHeaders}</tr></thead>
    <tbody>${tableRows || '<tr><td colspan="9" style="text-align: center; padding: 40px; color: #94a3b8;">No data available for this period</td></tr>'}</tbody>
  </table>

  <div class="footer">
    <p>This report was automatically generated by the Operations Management System</p>
  </div>
</body>
</html>
  `;
}
