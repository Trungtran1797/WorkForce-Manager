import { useState, useMemo } from 'react'
import { Building2, Users, ChevronDown, ChevronRight, Search, User } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useDepartments } from '@/features/departments/api/department-queries'
import { useEmployees } from '@/features/employees/api/employee-queries'
import type { Department } from '@/features/departments/types'

interface OrgNode {
  dept: Department
  children: OrgNode[]
}

function buildTree(departments: Department[]): OrgNode[] {
  const map = new Map<number, OrgNode>()
  departments.forEach((d) => map.set(d.id, { dept: d, children: [] }))

  const roots: OrgNode[] = []
  departments.forEach((d) => {
    const node = map.get(d.id)!
    if (d.parentDepartmentId && map.has(d.parentDepartmentId)) {
      map.get(d.parentDepartmentId)!.children.push(node)
    } else {
      roots.push(node)
    }
  })
  return roots
}

const colorMap: Record<string, string> = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
}

interface DeptNodeProps {
  node: OrgNode
  employeesByDept: Map<number, { id: number; fullName: string; position: string }[]>
  depth: number
  searchQuery: string
}

function DeptNode({ node, employeesByDept, depth, searchQuery }: DeptNodeProps) {
  const [expanded, setExpanded] = useState(depth === 0)
  const [showEmployees, setShowEmployees] = useState(false)

  const { dept, children } = node
  const employees = employeesByDept.get(dept.id) ?? []
  const colorClass = colorMap[dept.colorVariant] ?? colorMap['primary']

  const matchesSearch = !searchQuery ||
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.managerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employees.some(
      (e) =>
        e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.position.toLowerCase().includes(searchQuery.toLowerCase()),
    )

  if (!matchesSearch) return null

  const hasChildren = children.length > 0

  return (
    <div className={`${depth > 0 ? 'ml-5 pl-3 border-l border-border/40' : ''}`}>
      <div
        className={`group relative flex items-start gap-2 rounded-lg border p-2.5 mb-2 cursor-pointer transition-all hover:shadow-sm ${colorClass}`}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {/* Expand/Collapse icon */}
        {hasChildren ? (
          <button className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        ) : (
          <span className="size-4 shrink-0" />
        )}

        {/* Dept icon */}
        <Building2 className="size-4 shrink-0 mt-0.5" />

        {/* Dept info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold">{dept.name}</span>
            {dept.parentDepartmentName && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5 font-normal">
                {dept.parentDepartmentName}
              </Badge>
            )}
          </div>
          {dept.managerName && (
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Trưởng phòng: <span className="font-medium">{dept.managerName}</span>
            </p>
          )}
          <div className="flex items-center gap-3 mt-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setShowEmployees(!showEmployees) }}
              className="flex items-center gap-1 text-[10px] font-medium hover:underline"
            >
              <Users className="size-3" />
              {dept.employeeCount} nhân viên
            </button>
          </div>
        </div>
      </div>

      {/* Employee list */}
      {showEmployees && employees.length > 0 && (
        <div className="ml-10 mb-2 rounded-lg border bg-card/60 p-2 space-y-1">
          {employees.map((emp) => (
            <div key={emp.id} className="flex items-center gap-2 py-1 px-2 rounded-md hover:bg-accent/40 transition-colors">
              <Avatar className="size-6">
                <AvatarFallback className="text-[9px] font-bold bg-muted">
                  {emp.fullName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-medium text-foreground">{emp.fullName}</p>
                <p className="text-[10px] text-muted-foreground">{emp.position}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Children */}
      {expanded && children.map((child) => (
        <DeptNode
          key={child.dept.id}
          node={child}
          employeesByDept={employeesByDept}
          depth={depth + 1}
          searchQuery={searchQuery}
        />
      ))}
    </div>
  )
}

export function OrgChartSection() {
  const [search, setSearch] = useState('')
  const { data: departments = [], isLoading: deptLoading } = useDepartments()
  const { data: employeesData } = useEmployees({ pageNumber: 1, pageSize: 1000 })
  const employees = employeesData?.items ?? []

  const tree = useMemo(() => buildTree(departments), [departments])

  const employeesByDept = useMemo(() => {
    const map = new Map<number, { id: number; fullName: string; position: string }[]>()
    employees.forEach((emp) => {
      const deptId = emp.departmentId
      if (!deptId) return
      if (!map.has(deptId)) map.set(deptId, [])
      map.get(deptId)!.push({ id: emp.id, fullName: emp.fullName, position: emp.position })
    })
    return map
  }, [employees])

  const totalDepts = departments.length
  const totalEmployees = employees.length

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-border bg-card/50 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              Sơ đồ tổ chức
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalDepts} phòng ban · {totalEmployees} nhân viên
            </p>
          </div>
          <div className="relative w-60">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Tìm phòng ban, nhân viên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Tổng phòng ban', value: totalDepts, icon: Building2, color: 'text-primary' },
            { label: 'Tổng nhân viên', value: totalEmployees, icon: Users, color: 'text-success' },
            { label: 'Khối làm việc', value: tree.length, icon: User, color: 'text-warning' },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center justify-center p-3 rounded-lg bg-muted/30 border border-border/40 text-center">
              <stat.icon className={`size-4 mb-1 ${stat.color}`} />
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Org Tree */}
      <Card className="border-border bg-card/50 p-4">
        {deptLoading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
            <div className="animate-pulse">Đang tải sơ đồ tổ chức...</div>
          </div>
        ) : tree.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Building2 className="size-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Chưa có dữ liệu phòng ban.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {tree.map((node) => (
              <DeptNode
                key={node.dept.id}
                node={node}
                employeesByDept={employeesByDept}
                depth={0}
                searchQuery={search}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
