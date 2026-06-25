import { useState } from 'react'
import {
  Building2,
  Clock,
  FileSpreadsheet,
  FileText,
  FolderKanban,
  ListChecks,
  Users,
  Loader2,
  type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCanEdit } from '@/features/permissions/lib/use-permission'
import { REPORT_CATALOG } from '@/features/reports/data/report-catalog'
import type { ReportItem } from '@/features/reports/types'
import { downloadReport } from '@/features/reports/api/reports-api'

const ICON_MAP: Record<ReportItem['icon'], LucideIcon> = {
  users: Users,
  'folder-kanban': FolderKanban,
  'list-checks': ListChecks,
  'building-2': Building2,
  clock: Clock,
}

export function ReportsPage() {
  const canEdit = useCanEdit('Reports')
  const [exporting, setExporting] = useState<{ id: string; format: 'excel' | 'pdf' } | null>(null)

  const handleExport = async (reportId: string, exportType: 'excel' | 'pdf'): Promise<void> => {
    setExporting({ id: reportId, format: exportType })
    try {
      await downloadReport(reportId, exportType)
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Xuất báo cáo thất bại. Vui lòng thử lại.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Báo cáo</h1>
        <p className="text-sm text-muted-foreground">Xuất báo cáo thống kê hệ thống</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_CATALOG.map((report) => {
          const Icon = ICON_MAP[report.icon]
          const isExcelLoading = exporting?.id === report.id && exporting?.format === 'excel'
          const isPdfLoading = exporting?.id === report.id && exporting?.format === 'pdf'
          const isAnyLoading = exporting !== null

          return (
            <Card key={report.id}>
              <CardHeader className="flex-row items-center gap-3 space-y-0">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle>{report.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground">{report.description}</p>
                {canEdit && (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isAnyLoading}
                      onClick={() => handleExport(report.id, 'excel')}
                    >
                      {isExcelLoading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <FileSpreadsheet className="size-3.5" />
                      )}
                      Excel
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isAnyLoading}
                      onClick={() => handleExport(report.id, 'pdf')}
                    >
                      {isPdfLoading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <FileText className="size-3.5" />
                      )}
                      PDF
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

