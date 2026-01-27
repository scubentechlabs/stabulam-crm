import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Clock,
  ClipboardList,
  Calendar,
  Briefcase,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Camera,
  DollarSign,
  BarChart3,
  CheckSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/notifications/NotificationBell';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const employeeNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { title: 'Attendance', href: '/attendance', icon: Clock },
  { title: 'Tasks', href: '/tasks', icon: ClipboardList },
  { title: 'Leave Requests', href: '/leaves', icon: Calendar },
  { title: 'Extra Work', href: '/extra-work', icon: Briefcase },
  { title: 'Shoots', href: '/shoots', icon: Camera },
];

const adminNavItems: NavItem[] = [
  { title: 'Admin Dashboard', href: '/admin', icon: LayoutDashboard, adminOnly: true },
  { title: 'User Management', href: '/admin/users', icon: Users, adminOnly: true },
  { title: 'Attendance Monitor', href: '/admin/attendance', icon: Clock, adminOnly: true },
  { title: 'Approvals', href: '/admin/approvals', icon: CheckSquare, adminOnly: true },
  { title: 'Shoots Management', href: '/admin/shoots', icon: Camera, adminOnly: true },
  { title: 'Salary Generator', href: '/admin/salary', icon: DollarSign, adminOnly: true },
  { title: 'Reports', href: '/admin/reports', icon: BarChart3, adminOnly: true },
  { title: 'Rules Config', href: '/admin/rules', icon: Settings, adminOnly: true },
];

export function DashboardLayout() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = isAdmin ? [...adminNavItems, ...employeeNavItems] : employeeNavItems;

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.href;
    
    return (
      <Link
        to={item.href}
        onClick={() => setIsSidebarOpen(false)}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground'
            : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
        )}
      >
        <item.icon className="h-5 w-5" />
        <span>{item.title}</span>
        {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar transition-transform duration-300 lg:translate-x-0',
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-sidebar-border">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-sidebar-foreground">AgencyOps</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden text-sidebar-foreground"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-1">
              {isAdmin && (
                <>
                  <p className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                    Admin
                  </p>
                  {adminNavItems.map((item) => (
                    <NavLink key={item.href} item={item} />
                  ))}
                  <div className="my-4 border-t border-sidebar-border" />
                  <p className="px-3 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
                    Employee View
                  </p>
                </>
              )}
              {employeeNavItems.map((item) => (
                <NavLink key={item.href} item={item} />
              ))}
            </nav>
          </ScrollArea>

          {/* User Section */}
          <div className="p-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground">
                  {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-sidebar-foreground/60 truncate">
                  {isAdmin ? 'Administrator' : 'Employee'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-sidebar-foreground/70 hover:text-sidebar-foreground"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur border-b flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-lg font-semibold">
                {navItems.find((item) => item.href === location.pathname)?.title || 'Dashboard'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="ghost" size="icon" asChild>
              <Link to="/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
