// Centralized query key factory for type safety and consistency
// This enables efficient cache invalidation and prefetching

export const queryKeys = {
  // Users & Profiles
  users: {
    all: ['users'] as const,
    list: () => [...queryKeys.users.all, 'list'] as const,
    detail: (userId: string) => [...queryKeys.users.all, 'detail', userId] as const,
  },
  
  teamMembers: {
    all: ['teamMembers'] as const,
    list: () => [...queryKeys.teamMembers.all, 'list'] as const,
  },
  
  profiles: {
    all: ['profiles'] as const,
    current: () => [...queryKeys.profiles.all, 'current'] as const,
  },
  
  // Attendance
  attendance: {
    all: ['attendance'] as const,
    today: (userId: string) => [...queryKeys.attendance.all, 'today', userId] as const,
    history: (userId: string, filters?: object) => 
      [...queryKeys.attendance.all, 'history', userId, filters] as const,
    stats: (userId: string, period?: string) => 
      [...queryKeys.attendance.all, 'stats', userId, period] as const,
  },
  
  // Tasks
  tasks: {
    all: ['tasks'] as const,
    list: (userId: string, attendanceId?: string) => 
      [...queryKeys.tasks.all, 'list', userId, attendanceId] as const,
    forDate: (userId: string, date: string) => 
      [...queryKeys.tasks.all, 'date', userId, date] as const,
  },
  
  // Leaves
  leaves: {
    all: ['leaves'] as const,
    list: (userId?: string) => [...queryKeys.leaves.all, 'list', userId] as const,
    pending: () => [...queryKeys.leaves.all, 'pending'] as const,
  },
  
  leaveBalances: {
    all: ['leave-balances'] as const,
    byYear: (year: number) => [...queryKeys.leaveBalances.all, year] as const,
    forUser: (userId: string, year: number) => 
      [...queryKeys.leaveBalances.all, userId, year] as const,
  },
  
  // Extra Work
  extraWork: {
    all: ['extra-work'] as const,
    list: (userId?: string) => [...queryKeys.extraWork.all, 'list', userId] as const,
    pending: () => [...queryKeys.extraWork.all, 'pending'] as const,
  },
  
  // Shoots
  shoots: {
    all: ['shoots'] as const,
    list: () => [...queryKeys.shoots.all, 'list'] as const,
    detail: (shootId: string) => [...queryKeys.shoots.all, 'detail', shootId] as const,
    today: () => [...queryKeys.shoots.all, 'today'] as const,
  },
  
  // Notifications
  notifications: {
    all: ['notifications'] as const,
    list: (userId: string) => [...queryKeys.notifications.all, 'list', userId] as const,
    unread: (userId: string) => [...queryKeys.notifications.all, 'unread', userId] as const,
  },
  
  // Holidays
  holidays: {
    all: ['holidays'] as const,
    list: () => [...queryKeys.holidays.all, 'list'] as const,
    byMonth: (year: number, month: number) => 
      [...queryKeys.holidays.all, 'month', year, month] as const,
  },
  
  // Rules
  rules: {
    all: ['rules'] as const,
    config: () => [...queryKeys.rules.all, 'config'] as const,
    late: () => [...queryKeys.rules.all, 'late'] as const,
    leave: () => [...queryKeys.rules.all, 'leave'] as const,
    extraWork: () => [...queryKeys.rules.all, 'extraWork'] as const,
    reporting: () => [...queryKeys.rules.all, 'reporting'] as const,
  },
  
  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: (userId: string) => [...queryKeys.dashboard.all, 'stats', userId] as const,
    adminStats: () => [...queryKeys.dashboard.all, 'admin-stats'] as const,
  },
  
  // Flags
  flags: {
    all: ['flags'] as const,
    list: (userId?: string) => [...queryKeys.flags.all, 'list', userId] as const,
    detail: (flagId: string) => [...queryKeys.flags.all, 'detail', flagId] as const,
  },
  
  // Salary
  salary: {
    all: ['salary'] as const,
    records: (userId?: string) => [...queryKeys.salary.all, 'records', userId] as const,
    settings: () => [...queryKeys.salary.all, 'settings'] as const,
  },
  
  // Regularizations
  regularizations: {
    all: ['regularizations'] as const,
    list: (userId?: string) => [...queryKeys.regularizations.all, 'list', userId] as const,
    pending: () => [...queryKeys.regularizations.all, 'pending'] as const,
  },
} as const;
