import { useRef, useState } from 'react'
import { Loader2, Paperclip, Send, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { ApiError } from '@/lib/api-client'
import { formatFileSize } from '@/lib/formatters'
import { useAddProjectComment } from '@/features/projects/api/project-discussion-queries'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'zip']

interface CommentFormProps {
  projectId: number
}

export function CommentForm({ projectId }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addComment = useAddProjectComment(projectId)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const selected = Array.from(event.target.files ?? [])
    const validFiles: File[] = []

    for (const file of selected) {
      const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
      if (!ALLOWED_EXTENSIONS.includes(extension)) {
        toast({
          title: 'File không hợp lệ',
          description: `"${file.name}" có định dạng không được hỗ trợ.`,
          variant: 'destructive',
        })
        continue
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          title: 'File quá lớn',
          description: `"${file.name}" vượt quá giới hạn 10MB.`,
          variant: 'destructive',
        })
        continue
      }
      validFiles.push(file)
    }

    setFiles((prev) => [...prev, ...validFiles])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleRemoveFile = (index: number): void => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) {
      toast({
        title: 'Vui lòng nhập nội dung',
        description: 'Bình luận không được để trống.',
        variant: 'destructive',
      })
      return
    }

    try {
      await addComment.mutateAsync({ content: trimmed, files })
      setContent('')
      setFiles([])
      toast({ title: 'Đã gửi bình luận' })
    } catch (error) {
      const message =
        error instanceof ApiError ? error.message : 'Gửi bình luận thất bại, vui lòng thử lại.'
      toast({ title: 'Gửi thất bại', description: message, variant: 'destructive' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        placeholder="Viết bình luận, cập nhật tiến độ hoặc đính kèm tài liệu..."
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={3}
        disabled={addComment.isPending}
      />

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-2 py-1 text-xs"
            >
              <span className="max-w-[160px] truncate">{file.name}</span>
              <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
              <button
                type="button"
                onClick={() => handleRemoveFile(index)}
                aria-label={`Xóa file ${file.name}`}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            id="comment-file-input"
            onChange={handleFileSelect}
            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={addComment.isPending}
          >
            <Paperclip className="size-4" />
            Đính kèm file
          </Button>
        </div>
        <Button type="submit" size="sm" disabled={addComment.isPending}>
          {addComment.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
          Gửi
        </Button>
      </div>
    </form>
  )
}
