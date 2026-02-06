import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";
import { forwardRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  prefetchDashboardData,
  prefetchAttendancePage,
  prefetchLeavesPage,
  prefetchShootsPage,
  prefetchTasksPage,
  prefetchUsersPage,
  prefetchHolidays,
} from "@/lib/prefetch";

interface NavLinkCompatProps extends Omit<NavLinkProps, "className"> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
}

// Map routes to prefetch functions
const prefetchMap: Record<string, (userId: string, isAdmin: boolean) => Promise<void>> = {
  '/dashboard': (userId) => prefetchDashboardData(userId),
  '/attendance': (userId) => prefetchAttendancePage(userId),
  '/leaves': (userId, isAdmin) => prefetchLeavesPage(userId, isAdmin),
  '/shoots': () => prefetchShootsPage(),
  '/tasks': (userId) => prefetchTasksPage(userId),
  '/admin/users': () => prefetchUsersPage(),
  '/admin/holidays': () => prefetchHolidays(),
};

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  ({ className, activeClassName, pendingClassName, to, onMouseEnter, onFocus, ...props }, ref) => {
    const { user, isAdmin } = useAuth();

    const handlePrefetch = useCallback(() => {
      if (!user) return;
      
      const path = typeof to === 'string' ? to : to.pathname || '';
      const prefetchFn = prefetchMap[path];
      
      if (prefetchFn) {
        prefetchFn(user.id, isAdmin);
      }
    }, [to, user, isAdmin]);

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLAnchorElement>) => {
        handlePrefetch();
        onMouseEnter?.(e);
      },
      [handlePrefetch, onMouseEnter]
    );

    const handleFocus = useCallback(
      (e: React.FocusEvent<HTMLAnchorElement>) => {
        handlePrefetch();
        onFocus?.(e);
      },
      [handlePrefetch, onFocus]
    );

    return (
      <RouterNavLink
        ref={ref}
        to={to}
        className={({ isActive, isPending }) =>
          cn(className, isActive && activeClassName, isPending && pendingClassName)
        }
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
