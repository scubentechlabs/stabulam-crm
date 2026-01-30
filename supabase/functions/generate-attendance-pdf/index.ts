import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// IST offset: UTC+5:30
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function toIST(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return new Date(d.getTime() + IST_OFFSET_MS);
}

interface AttendanceRecord {
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  is_late: boolean | null;
  late_minutes: number | null;
  tod_submitted: boolean | null;
  eod_submitted: boolean | null;
  employee_name?: string;
  employee_email?: string;
}

interface RequestBody {
  records: AttendanceRecord[];
  startDate: string;
  endDate: string;
  isAdmin: boolean;
  employeeName?: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { records, startDate, endDate, isAdmin, employeeName }: RequestBody = await req.json();

    console.log(`Generating attendance PDF: ${records.length} records from ${startDate} to ${endDate}`);

    // Calculate summary stats
    const totalDays = records.length;
    const presentDays = records.filter(r => r.clock_in_time).length;
    const lateDays = records.filter(r => r.is_late).length;
    const onTimeDays = presentDays - lateDays;
    const totalLateMinutes = records.reduce((sum, r) => sum + (r.late_minutes || 0), 0);
    const avgLateMinutes = lateDays > 0 ? Math.round(totalLateMinutes / lateDays) : 0;

    const formatTime = (timeStr: string | null) => {
      if (!timeStr) return '-';
      const istDate = toIST(timeStr);
      if (!istDate) return '-';
      const hours = istDate.getUTCHours();
      const minutes = istDate.getUTCMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h = hours % 12 || 12;
      return `${h}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    };

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    };

    // Generate table rows
    const tableRows = records.map(record => `
      <tr>
        <td>${formatDate(record.date)}</td>
        ${isAdmin ? `<td>${record.employee_name || '-'}</td>` : ''}
        <td>${formatTime(record.clock_in_time)}</td>
        <td>${formatTime(record.clock_out_time)}</td>
        <td class="${record.is_late ? 'late' : 'on-time'}">${record.is_late ? `Yes (${record.late_minutes}m)` : 'No'}</td>
        <td>${record.tod_submitted ? '✓' : '✗'}</td>
        <td>${record.eod_submitted ? '✓' : '✗'}</td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Attendance Report</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1a1a2e;
      background: #fff;
      padding: 20px;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 3px solid #4f46e5;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 28px;
      color: #4f46e5;
      margin-bottom: 5px;
    }
    
    .header .subtitle {
      font-size: 14px;
      color: #64748b;
    }
    
    .date-range {
      font-size: 16px;
      color: #334155;
      margin-top: 10px;
    }
    
    .summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .summary-card {
      background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
      border-radius: 10px;
      padding: 15px;
      text-align: center;
    }
    
    .summary-card.green {
      background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    }
    
    .summary-card.yellow {
      background: linear-gradient(135deg, #fef9c3 0%, #fef08a 100%);
    }
    
    .summary-card.blue {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    }
    
    .summary-card .value {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
    }
    
    .summary-card .label {
      font-size: 12px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      font-size: 13px;
    }
    
    th {
      background: #4f46e5;
      color: white;
      padding: 12px 10px;
      text-align: left;
      font-weight: 600;
    }
    
    th:first-child {
      border-radius: 8px 0 0 0;
    }
    
    th:last-child {
      border-radius: 0 8px 0 0;
    }
    
    td {
      padding: 10px;
      border-bottom: 1px solid #e2e8f0;
    }
    
    tr:nth-child(even) {
      background-color: #f8fafc;
    }
    
    tr:hover {
      background-color: #f1f5f9;
    }
    
    .late {
      color: #dc2626;
      font-weight: 500;
    }
    
    .on-time {
      color: #16a34a;
    }
    
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #94a3b8;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      .summary {
        break-inside: avoid;
      }
      
      table {
        page-break-inside: auto;
      }
      
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Attendance Report</h1>
      ${employeeName ? `<div class="subtitle">Employee: ${employeeName}</div>` : ''}
      <div class="date-range">${formatDate(startDate)} — ${formatDate(endDate)}</div>
    </div>
    
    <div class="summary">
      <div class="summary-card">
        <div class="value">${totalDays}</div>
        <div class="label">Total Days</div>
      </div>
      <div class="summary-card green">
        <div class="value">${onTimeDays}</div>
        <div class="label">On Time</div>
      </div>
      <div class="summary-card yellow">
        <div class="value">${lateDays}</div>
        <div class="label">Late Days</div>
      </div>
      <div class="summary-card blue">
        <div class="value">${avgLateMinutes}m</div>
        <div class="label">Avg Late Time</div>
      </div>
    </div>
    
    <table>
      <thead>
        <tr>
          <th>Date</th>
          ${isAdmin ? '<th>Employee</th>' : ''}
          <th>Clock In</th>
          <th>Clock Out</th>
          <th>Late</th>
          <th>TOD</th>
          <th>EOD</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    
    <div class="footer">
      Generated on ${new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}
    </div>
  </div>
</body>
</html>
    `;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error generating attendance PDF:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
