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
  Settings2,
  ShieldCheck,
  Target,
  Timer,
  UserCog,
  Users,
  Wallet,
  X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useUiStore } from '@/stores/ui-store'
import { useAuth } from '@/features/auth/context/auth-context'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  /** Nếu có, mục menu chỉ hiển thị khi quyền hiệu lực của module này khác 'None'. */
  module?: string
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard, module: 'Dashboard' },
  { to: '/wall', label: 'Tường công ty', icon: Leaf, module: 'Dashboard' },
  { to: '/employees', label: 'Nhân viên', icon: Users, module: 'Employees' },
  { to: '/departments', label: 'Phòng ban', icon: Building2, module: 'Departments' },
  { to: '/projects', label: 'Dự án', icon: FolderKanban, module: 'Projects' },
  { to: '/tasks', label: 'Công việc', icon: ListChecks, module: 'Tasks' },
  { to: '/attendance', label: 'Chấm công', icon: Clock, module: 'Attendance' },
  { to: '/shifts', label: 'Ca làm việc', icon: CalendarClock, module: 'Shifts' },
  { to: '/overtime', label: 'Tăng ca', icon: Timer, module: 'Overtime' },
  { to: '/leave', label: 'Nghỉ phép', icon: CalendarOff, module: 'Leave' },
  { to: '/contracts', label: 'Hợp đồng', icon: FileText, module: 'Contracts' },
  { to: '/payroll', label: 'Tiền lương', icon: Wallet, module: 'Payroll' },
  { to: '/salary-configs', label: 'Cấu hình lương', icon: Coins, module: 'SalaryConfigs' },
  { to: '/my-payslips', label: 'Phiếu lương của tôi', icon: Wallet, module: 'Payslips' },
  { to: '/okrs', label: 'Mục tiêu (OKRs)', icon: Target, module: 'Okrs' },
  { to: '/performance', label: 'Đánh giá hiệu suất', icon: Award, module: 'Performance' },
  { to: '/training', label: 'Đào tạo', icon: GraduationCap, module: 'Training' },
  { to: '/office-locations', label: 'Địa điểm chấm công', icon: MapPin, module: 'OfficeLocations' },
  { to: '/reports', label: 'Báo cáo', icon: FileBarChart, module: 'Reports' },
  { to: '/notifications', label: 'Thông báo', icon: Bell, module: 'Notifications' },
  { to: '/settings/permissions', label: 'Phân quyền', icon: ShieldCheck, module: 'PermissionMatrix' },
  { to: '/settings/users', label: 'Quản lý tài khoản', icon: UserCog, module: 'Users' },
  { to: '/settings/system', label: 'Cài đặt hệ thống', icon: Settings2, module: 'PermissionMatrix' },
]

function useNavItems(): NavItem[] {
  const { user } = useAuth()
  const permissions = user?.permissions

  return NAV_ITEMS.filter((item) => {
    if (!item.module) return true
    return (permissions?.[item.module] ?? 'None') !== 'None'
  })
}

function BrandLogo({ collapsed, onClick }: { collapsed?: boolean; onClick?: () => void }) {
  return (
    <NavLink
      to="/wall"
      onClick={onClick}
      className="flex items-center gap-2 hover:opacity-85 transition-opacity"
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-success font-bold text-white">
        <Leaf className="size-4.5" />
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <div className="text-sm font-extrabold tracking-wide text-warning">SAIGON SPICES</div>
          <div className="text-[11px] text-muted-foreground">WorkForce Manager</div>
        </div>
      )}
    </NavLink>
  )
}

function SidebarContent({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const navItems = useNavItems()
  return (
    <>
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-sidebar-border px-5">
        <BrandLogo collapsed={collapsed} onClick={onNavigate} />
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
          <BrandLogo onClick={() => setMobileSidebarOpen(false)} />
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
