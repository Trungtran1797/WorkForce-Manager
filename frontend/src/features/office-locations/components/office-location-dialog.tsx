import { useEffect, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { OfficeLocation, OfficeLocationFormValues } from '@/features/office-locations/types'

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên địa điểm'),
  allowedIpRanges: z.string(),
  latitude: z.string(),
  longitude: z.string(),
  radiusMeters: z.number().min(0).max(100000),
  isActive: z.boolean(),
})

const DEFAULT_VALUES: OfficeLocationFormValues = {
  name: '',
  allowedIpRanges: '',
  latitude: '',
  longitude: '',
  radiusMeters: 200,
  isActive: true,
}

interface OfficeLocationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  location?: OfficeLocation | null
  onSubmit: (values: OfficeLocationFormValues) => Promise<void>
}

export function OfficeLocationDialog({ open, onOpenChange, location, onSubmit }: OfficeLocationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<OfficeLocationFormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULT_VALUES,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        location
          ? {
              name: location.name,
              allowedIpRanges: location.allowedIpRanges ?? '',
              latitude: location.latitude?.toString() ?? '',
              longitude: location.longitude?.toString() ?? '',
              radiusMeters: location.radiusMeters,
              isActive: location.isActive,
            }
          : DEFAULT_VALUES,
      )
    }
  }, [open, location, form])

  const handleSubmit = async (values: OfficeLocationFormValues): Promise<void> => {
    setIsSubmitting(true)
    try {
      await onSubmit(values)
      onOpenChange(false)
    } catch {
      // Lỗi xử lý ở component cha
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{location ? 'Cập nhật địa điểm' : 'Thêm địa điểm check-in'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên địa điểm *</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Trụ sở chính" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowedIpRanges"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dải IP cho phép</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: 192.168.0.0/16, 10.0.0.0/8" {...field} />
                  </FormControl>
                  <FormDescription>Phân tách nhiều dải bằng dấu phẩy. Hỗ trợ CIDR hoặc IP đơn.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="latitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vĩ độ (lat)</FormLabel>
                    <FormControl>
                      <Input placeholder="21.0285" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="longitude"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kinh độ (lng)</FormLabel>
                    <FormControl>
                      <Input placeholder="105.8048" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="radiusMeters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bán kính (m)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Bật ràng buộc</FormLabel>
                    <FormDescription>Khi bật, check-in phải nằm trong dải IP hoặc bán kính GPS.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Lưu'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
