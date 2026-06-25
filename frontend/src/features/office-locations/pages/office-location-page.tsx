import { useState } from 'react'
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EmptyState, ErrorState, TableSkeleton } from '@/components/common/data-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ApiError } from '@/lib/api-client'
import { OfficeLocationDialog } from '@/features/office-locations/components/office-location-dialog'
import { useCanEdit } from '@/features/permissions/lib/use-permission'
import {
  useDeleteOfficeLocation,
  useOfficeLocations,
  useSaveOfficeLocation,
} from '@/features/office-locations/api/office-location-queries'
import type { OfficeLocation, OfficeLocationFormValues } from '@/features/office-locations/types'

export function OfficeLocationPage() {
  const canEdit = useCanEdit('OfficeLocations')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<OfficeLocation | null>(null)

  const { data: locations = [], isLoading, isError, refetch } = useOfficeLocations()
  const saveMutation = useSaveOfficeLocation()
  const deleteMutation = useDeleteOfficeLocation()

  const handleSave = async (values: OfficeLocationFormValues): Promise<void> => {
    try {
      await saveMutation.mutateAsync({ id: editing?.id ?? 0, values })
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Lưu địa điểm thất bại.')
      throw err
    }
  }

  const handleDelete = async (location: OfficeLocation): Promise<void> => {
    if (!window.confirm(`Xóa địa điểm "${location.name}"?`)) return
    try {
      await deleteMutation.mutateAsync(location.id)
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Xóa địa điểm thất bại.')
    }
  }

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (location: OfficeLocation) => {
    setEditing(location)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Địa điểm chấm công</h1>
          <p className="text-sm text-muted-foreground">
            Cấu hình dải IP văn phòng và tọa độ GPS công trường để ràng buộc check-in.
          </p>
        </div>
        {canEdit && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4" />
            Thêm địa điểm
          </Button>
        )}
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading && <TableSkeleton rows={4} columns={6} />}
        {isError && <ErrorState onRetry={() => void refetch()} />}
        {!isLoading && !isError && locations.length === 0 && (
          <EmptyState
            icon={MapPin}
            title="Chưa có địa điểm"
            description="Thêm địa điểm để ràng buộc vị trí check-in."
            actionLabel={canEdit ? 'Thêm địa điểm' : undefined}
            onAction={canEdit ? openCreate : undefined}
          />
        )}
        {!isLoading && !isError && locations.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên</TableHead>
                <TableHead>Dải IP</TableHead>
                <TableHead>Tọa độ GPS</TableHead>
                <TableHead>Bán kính</TableHead>
                <TableHead>Trạng thái</TableHead>
                {canEdit && <TableHead className="text-right">Hành động</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">{location.name}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-muted-foreground" title={location.allowedIpRanges ?? ''}>
                    {location.allowedIpRanges ?? '—'}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {location.latitude != null && location.longitude != null
                      ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
                      : '—'}
                  </TableCell>
                  <TableCell>{location.radiusMeters > 0 ? `${location.radiusMeters}m` : '—'}</TableCell>
                  <TableCell>
                    <Badge variant={location.isActive ? 'success' : 'gray'}>
                      {location.isActive ? 'Đang ràng buộc' : 'Tắt'}
                    </Badge>
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(location)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(location)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <OfficeLocationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        location={editing}
        onSubmit={handleSave}
      />
    </div>
  )
}
