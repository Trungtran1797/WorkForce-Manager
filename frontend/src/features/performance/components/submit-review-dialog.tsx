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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { PerformanceReview, SubmitReviewFormValues } from '@/features/performance/types'

const schema = z.object({
  criteria: z.array(
    z.object({
      criterionId: z.number(),
      score: z.number().min(1, 'Chọn điểm').max(5),
      note: z.string(),
    }),
  ),
  comment: z.string(),
})

interface SubmitReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  review: PerformanceReview | null
  onSubmit: (reviewId: number, values: SubmitReviewFormValues) => Promise<void>
}

const SCORE_LABELS: Record<number, string> = {
  1: '1 - Yếu',
  2: '2 - Cần cải thiện',
  3: '3 - Trung bình',
  4: '4 - Tốt',
  5: '5 - Xuất sắc',
}

export function SubmitReviewDialog({ open, onOpenChange, review, onSubmit }: SubmitReviewDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const form = useForm<SubmitReviewFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { criteria: [], comment: '' },
  })

  useEffect(() => {
    if (open && review) {
      form.reset({
        criteria: review.criteria.map((c) => ({
          criterionId: c.id,
          score: c.score > 0 ? c.score : 3,
          note: c.note ?? '',
        })),
        comment: review.comment ?? '',
      })
    }
  }, [open, review, form])

  if (!review) return null

  const handleSubmit = async (values: SubmitReviewFormValues): Promise<void> => {
    setIsSubmitting(true)
    try {
      await onSubmit(review.id, values)
      onOpenChange(false)
    } catch {
      // Lỗi xử lý ở component cha
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đánh giá hiệu suất - {review.employeeName}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Kỳ {review.period} · Cho điểm từ 1 (Yếu) đến 5 (Xuất sắc) theo từng tiêu chí.
            </p>

            {review.criteria.map((criterion, index) => (
              <div key={criterion.id} className="space-y-2 rounded-lg border border-border p-3">
                <p className="text-sm font-medium">
                  {criterion.criterion} <span className="text-xs text-muted-foreground">(trọng số {criterion.weight})</span>
                </p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <FormField
                    control={form.control}
                    name={`criteria.${index}.score`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Điểm</FormLabel>
                        <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map((score) => (
                              <SelectItem key={score} value={String(score)}>
                                {SCORE_LABELS[score]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`criteria.${index}.note`}
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel className="text-xs">Ghi chú</FormLabel>
                        <FormControl>
                          <Input placeholder="Nhận xét (không bắt buộc)" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nhận xét chung</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Nhận xét tổng quát về kỳ đánh giá..." {...field} />
                  </FormControl>
                  <FormMessage />
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
                    Đang nộp...
                  </>
                ) : (
                  'Nộp đánh giá'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
