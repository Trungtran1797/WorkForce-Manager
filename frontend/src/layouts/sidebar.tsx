import { NavLink } from 'react-router-dom'
import {
  Award,
  Bell,
  Building2,
  CalendarClock,
  CalendarOff,
  Clock,
  Coins,
  FileBarChart,
  FileText,
  FolderKanban,
  GraduationCap,
  Leaf,
  LayoutDashboard,
  ListChecks,
  MapPin,
  Target,
  Timer,
  Users,
  Wallet,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/stores/ui-store'
import { useAuth } from '@/features/auth/context/auth-context'
import type { UserRole } from '@/features/auth/types'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  /** Nếu có, chỉ các role này thấy mục menu; ngược lại mọi role đều thấy. */
  roles?: UserRole[]
}

const MANAGE_ROLES: UserRole[] = ['SuperAdmin', 'Manager']
const ADMIN_ONLY: UserRole[] = ['SuperAdmin']

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/employees', label: 'Nhân viên', icon: Users, roles: MANAGE_ROLES },
  { to: '/departments', label: 'Phòng ban', icon: Building2, roles: MANAGE_ROLES },
  { to: '/projects', label: 'Dự án', icon: FolderKanban },
  { to: '/tasks', label: 'Công việc', icon: ListChecks },
  { to: '/attendance', label: 'Chấm công', icon: Clock },
  { to: '/shifts', label: 'Ca làm việc', icon: CalendarClock, roles: MANAGE_ROLES },
  { to: '/overtime', label: 'Tăng ca', icon: Timer },
  { to: '/leave', label: 'Nghỉ phép', icon: CalendarOff },
  { to: '/contracts', label: 'Hợp đồng', icon: FileText, roles: MANAGE_ROLES },
  { to: '/payroll', label: 'Tiền lương', icon: Wallet, roles: MANAGE_ROLES },
  { to: '/salary-configs', label: 'Cấu hình lương', icon: Coins, roles: MANAGE_ROLES },
  { to: '/my-payslips', label: 'Phiếu lương của tôi', icon: Wallet },
  { to: '/okrs', label: 'Mục tiêu (OKRs)', icon: Target },
  { to: '/performance', label: 'Đánh giá hiệu suất', icon: Award },
  { to: '/training', label: 'Đào tạo', icon: GraduationCap },
  { to: '/office-locations', label: 'Địa điểm chấm công', icon: MapPin, roles: ADMIN_ONLY },
  { to: '/reports', label: 'Báo cáo', icon: FileBarChart, roles: MANAGE_ROLES },
  { to: '/notifications', label: 'Thông báo', icon: Bell },
]

function useNavItems(): NavItem[] {
  const { user } = useAuth()
  return NAV_ITEMS.filter((item) => !item.roles || (user != null && item.roles.includes(user.role)))
}

function BrandLogo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success font-bold text-white">
        <Leaf className="size-4.5" />
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <div className="text-sm font-extrabold tracking-wide text-warning">SAIGON SPICES</div>
          <div className="text-[11px] text-muted-foreground">WorkForce Manager</div>
        </div>
      )}
    </div>
  )
}

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const navItems = useNavItems()
  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-5">
        <BrandLogo collapsed={collapsed} />
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent',
                isActive
                  ? 'bg-primary/10 font-semibold text-primary dark:bg-primary/20'
                  : 'text-muted-foreground hover:text-foreground',
                collapsed && 'justify-center px-2'
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="size-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>
      {!collapsed && (
        <div className="border-t border-sidebar-border p-3 text-xs text-muted-foreground">
          WorkForce Manager v1.0
        </div>
      )}
    </>
  )
}

export function Sidebar() {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed)

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 lg:flex',
        sidebarCollapsed ? 'w-[72px]' : 'w-64'
      )}
    >
      <SidebarContent collapsed={sidebarCollapsed} />
    </aside>
  )
}

export function MobileSidebar() {
  const mobileSidebarOpen = useUiStore((state) => state.mobileSidebarOpen)
  const setMobileSidebarOpen = useUiStore((state) => state.setMobileSidebarOpen)
  const navItems = useNavItems()

  if (!mobileSidebarOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setMobileSidebarOpen(false)}
        aria-hidden="true"
      />
      <aside className="absolute inset-y-0 left-0 flex w-64 flex-col bg-sidebar text-sidebar-foreground shadow-xl">
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-sidebar-border px-5">
          <BrandLogo />
          <Button variant="ghost" size="icon" onClick={() => setMobileSidebarOpen(false)}>
            <X className="size-5" />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-thin">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent',
                  isActive
                    ? 'bg-primary/10 font-semibold text-primary dark:bg-primary/20'
                    : 'text-muted-foreground hover:text-foreground'
                )
              }
            >
              <item.icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </div>
  )
}
