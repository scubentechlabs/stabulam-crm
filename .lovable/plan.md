

# Digital Marketing Agency Operations Management Platform
## Complete Implementation Plan

---

## 🎯 Platform Overview

A production-ready, enterprise-grade internal operations system for digital marketing agencies to manage attendance, tasks, leaves, extra work, shoots, and automated salary calculations with full admin control and real-time synchronization.

**Target Users:** Medium-sized agency (20-100 employees)  
**Region:** India (INR currency, Indian date/time formats)  
**Design:** Dashboard-heavy with data visualization  

---

## 👥 User Experience Design

### **Admin Dashboard**
A command-center style interface with:
- **Overview Cards**: Total employees, today's attendance, pending approvals, upcoming shoots
- **Live Activity Feed**: Real-time clock-ins/outs, task submissions, requests
- **Quick Actions**: Approve requests, generate salary, view reports
- **Charts**: Attendance trends, late arrivals, productivity metrics
- **Calendar View**: Shoots, leaves, team availability at a glance

### **Employee Dashboard**
A streamlined, action-oriented interface:
- **Daily Status Bar**: Clock-in/out status, today's tasks, pending submissions
- **Quick Action Buttons**: Clock In, Add Task, Request Leave, Log Extra Work
- **Personal Stats**: Attendance streak, tasks completed, upcoming shoots
- **Notifications Panel**: Approval updates, reminders, announcements

### **Mobile-First Design**
- Optimized for field workers using phones
- Large touch targets for clock-in/out
- Camera integration for attendance photos
- Swipe actions for quick task updates

---

## 🔐 Authentication & Roles

### **Role-Based Access**
- **Admin**: Full platform access, user management, approvals, salary generation, rule configuration
- **Employee**: Personal attendance, task management, leave/extra work requests, shoot management

### **Login Flow**
- Email/password authentication
- Auto-generated secure passwords for new users
- Password reset via email
- Session management with secure tokens

---

## 📱 Core Modules

### **1. Attendance Engine**

**Clock-In Process:**
1. Employee opens app → Camera automatically activates
2. Mandatory selfie capture with timestamp overlay
3. Location capture (optional but recommended)
4. System records: exact time, photo, late status
5. Automatically redirects to TOD submission

**Clock-Out Process:**
1. Employee initiates clock-out
2. EOD panel opens showing all tasks
3. Must mark each task as Completed/Pending
4. Only after EOD completion can clock-out proceed
5. Extra Work option becomes available after clock-out

**Admin View:**
- Calendar view of all attendance
- Filter by date, employee, department
- View photos with timestamps
- Late arrival highlighting
- Export attendance reports

---

### **2. Task Management Engine (TOD/EOD/Urgent)**

**Task of the Day (TOD):**
- Opens automatically after clock-in
- User adds planned tasks for the day
- One-time edit allowed before final submission
- Mandatory - cannot proceed without submission
- Auto-timestamped

**Urgent TOD:**
- Available throughout the day
- Add unplanned/emergency tasks
- Multiple entries allowed
- Each entry timestamped separately
- Appears in EOD summary

**End of Day (EOD):**
- Shows complete task list (TOD + Urgent)
- Checkbox for each task: Completed / Pending
- Pending tasks require brief reason
- Must complete before clock-out

---

### **3. Leave Management Engine**

**Leave Types:**
- **Half Day**: Morning or afternoon
- **Full Day**: Single day off
- **Multiple Days**: Date range selection

**Request Process:**
1. Select leave type and dates
2. Dynamic time fields for half-day
3. Mandatory work delegation notes (who will cover tasks)
4. Auto-calculation of advance notice (48-hour rule check)
5. Submitted for admin approval

**Admin Approval Panel:**
- Queue of pending requests
- See employee's attendance history
- View delegation notes
- Approve/Reject with optional comments
- Penalty auto-calculated based on notice period

---

### **4. Extra Work Engine**

**Request Process (Available only after clock-out):**
1. Select hours worked (1-4 hours)
2. Describe exact tasks completed
3. Add notes/justification
4. Submit for admin approval
5. Must be submitted same day

**Compensation Tiers:**
- 1 hour: ₹150
- 2 hours: ₹250
- 3 hours: ₹350
- 4 hours: ₹450

**Admin View:**
- All extra work requests
- Approve/reject with comments
- Only approved requests reflect in salary

---

### **5. Shoot Management Engine**

**Create/Edit Shoots:**
- Date and time selection
- Location with map integration
- Brand name and event name
- Detailed shooting brief
- Assign team members
- Status: Pending / In Progress / Completed

**Views:**
- **Calendar View**: Visual timeline of all shoots
- **Card View**: Detailed shoot cards with quick actions
- **Filter**: By brand, date, status, assigned user

**Notifications:**
- Reminder 24 hours before shoot
- Real-time updates when shoot details change

---

### **6. User Management (Admin Only)**

**Create New User:**
- Full name
- Mobile number
- Email address
- Monthly salary (INR)
- Custom working hours (start/end time per employee)
- Department/role assignment
- Auto-generate secure password
- Send welcome email with credentials

**User Settings Sync:**
The following values propagate across all modules:
- Base salary → Salary calculation
- Start time → Late arrival calculation
- End time → Extra work validation

---

## ⚙️ Rules Engine (Admin Configurable)

### **Late Arrival Policy**
| Delay | Deduction |
|-------|-----------|
| Up to 30 min | ₹100 |
| 30 min - 1 hour | ₹200 |
| 1 - 1.5 hours | Half-day salary |
| 1.5+ hours | Full-day salary |

### **Leave Policy**
| Scenario | Deduction |
|----------|-----------|
| Without 48-hour notice | 1 day salary + ₹250 penalty |
| With advance notice | Normal daily salary only |
| Half-day without notice | Full-day salary |
| Half-day with notice | ₹250 |

### **Reporting Policy**
| Missing Item | Penalty |
|--------------|---------|
| No TOD submission | ₹100/day |
| No EOD submission | ₹100/day |

### **Extra Work Policy**
Only approved requests count. Same-day reporting mandatory.

**Admin Configuration Panel:**
- Adjust all monetary values
- Enable/disable specific rules
- Set grace periods
- Configure working days

---

## 💰 Salary Calculation Engine

### **Generation Process:**
1. Admin selects employee(s) and month
2. System auto-calculates all components:

**Breakdown Display:**
```
Base Salary:             ₹50,000
─────────────────────────────────
DEDUCTIONS:
├─ Late Arrivals (5x)    -₹800
├─ Leaves (2 days)       -₹3,333
├─ Missing TOD (1x)      -₹100
├─ Missing EOD (0x)      ₹0
└─ Leave Penalties       -₹250
─────────────────────────────────
ADDITIONS:
└─ Extra Work (6 hrs)    +₹650
─────────────────────────────────
NET SALARY:              ₹46,167
```

3. Admin toggles to include/exclude items via checkboxes
4. Preview before finalizing
5. Generate salary slip (PDF)
6. Mark as processed

### **Salary Cycle Configuration:**
- Monthly (1st to end of month)
- Bi-weekly (1st-15th, 16th-end)
- Custom date ranges

---

## 📊 Reports & Analytics

### **Dashboard Analytics:**
- Attendance rate trends (weekly/monthly)
- Late arrival patterns by employee
- Task completion rates
- Leave utilization
- Extra work distribution

### **Exportable Reports:**
- Attendance report (PDF/Excel)
- Salary summary (PDF)
- Leave balance report
- Shoot schedule
- Individual employee performance

### **Charts & Visualizations:**
- Line charts for attendance trends
- Bar charts for departmental comparisons
- Pie charts for leave type distribution
- Heat maps for punctuality patterns

---

## 🔔 Notifications System

### **Real-Time Alerts:**
- Push notifications (in-app)
- Email notifications for important events

### **Notification Triggers:**
| Event | Recipient |
|-------|-----------|
| New leave request | Admin |
| New extra work request | Admin |
| Request approved/rejected | Employee |
| Shoot reminder (24h before) | Assigned team |
| Missing TOD/EOD reminder | Employee |
| Salary generated | Employee |

---

## 🔗 System Architecture

### **Data Synchronization Flow:**
```
User Settings
     ↓
Attendance Engine ←→ Photo Storage
     ↓
Task Engine (TOD/Urgent/EOD)
     ↓
Leave Engine ←→ Extra Work Engine
     ↓
Rules Engine (Policy Application)
     ↓
Salary Calculation Engine
     ↓
Reports & Analytics
```

### **Database Structure:**
- **Users & Roles**: Authentication, permissions, settings
- **Attendance**: Clock records, photos, timestamps
- **Tasks**: TOD, Urgent TOD, EOD submissions
- **Leaves**: Requests, approvals, history
- **Extra Work**: Requests, approvals, hours
- **Shoots**: Events, assignments, statuses
- **Salary**: Calculations, history, components
- **Rules**: Configurable policies
- **Notifications**: Alerts and delivery status

### **Backend Services (Supabase):**
- Authentication with role-based access
- Real-time database for live updates
- Storage for high-quality attendance photos
- Edge functions for salary calculations
- Row-level security for data protection

---

## 📱 Page Structure

### **Public Pages:**
- Login

### **Employee Pages:**
- Dashboard (Home)
- Attendance (Clock In/Out + History)
- Tasks (TOD/EOD Management)
- Leave Requests
- Extra Work Log
- Shoots (View & Manage)
- Profile Settings
- Notifications

### **Admin Pages:**
- Admin Dashboard (Overview)
- User Management (CRUD)
- Attendance Monitor
- Approval Center (Leaves + Extra Work)
- Salary Generator
- Shoot Management
- Rules Configuration
- Reports & Analytics
- System Settings

---

## 🚀 Implementation Phases

### **Phase 1: Foundation**
- Authentication system with roles
- Database schema setup
- User management module
- Basic UI layout and navigation

### **Phase 2: Attendance & Tasks**
- Clock-in/out with camera integration
- TOD/Urgent TOD/EOD workflow
- Attendance history and calendar
- Photo storage system

### **Phase 3: Requests & Approvals**
- Leave request system
- Extra work logging
- Admin approval workflows
- Notification system

### **Phase 4: Salary Engine**
- Rules configuration
- Automatic calculations
- Salary generation with itemized breakdown
- PDF slip generation

### **Phase 5: Shoots & Polish**
- Shoot management module
- Calendar integrations
- Reports and analytics
- Mobile optimization
- Final testing and edge cases

---

## ✅ Edge Cases Handled

- Employee forgets to clock out → Admin can manually adjust
- Photo capture fails → Retry mechanism with error handling
- Leave request spans weekends → Only working days counted
- Multiple clock-in attempts → Only first valid entry accepted
- Salary calculation mid-month → Pro-rata calculations
- Internet connectivity issues → Offline-capable with sync
- Admin creates user mid-month → Salary pro-rated
- Extra work claimed but not approved → Shows in pending, excluded from salary
- Rule changes mid-month → Apply from change date only

---

This platform will be fully functional, production-ready, and designed for real-world agency operations with complete automation and zero manual calculations.

