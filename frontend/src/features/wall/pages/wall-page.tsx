import { useState, useRef, useMemo } from 'react'
import {
  Heart,
  MessageSquare,
  Paperclip,
  Share2,
  Smile,
  Send,
  Download,
  Trash2,
  Cake,
  Users,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  FolderLock,
  Compass,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  CalendarClock,
  Plus,
  TrendingUp,
  Building2,
  History,
  BookOpen,
  RefreshCw,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/features/auth/context/auth-context'
import { useMyProfile, useEmployees } from '@/features/employees/api/employee-queries'
import { resolveMediaUrl } from '@/features/employees/api/employee-api'
import {
  useWallPosts,
  useCompanyWallPosts,
  usePendingWallPosts,
  useScheduledWallPosts,
  useGroupWallPosts,
  useWallGroups,
  useCreateWallPost,
  useToggleWallPostLike,
  useAddWallPostComment,
  useUpdateWallPost,
  useDeleteWallPost,
  useApproveWallPost,
  useRejectWallPost,
  usePublishNowWallPost,
  useCreateWallGroup,
  useDeleteWallGroup,
} from '@/features/wall/api/wall-queries'
import { downloadWallAttachment } from '@/features/wall/api/wall-api'
import { useToast } from '@/hooks/use-toast'
import type { WallPost } from '@/features/wall/types'
import { OrgChartSection } from '@/features/wall/components/org-chart-section'
import { CareerPathSection } from '@/features/wall/components/career-path-section'
import { WorkHistorySection } from '@/features/wall/components/work-history-section'

// ─── Menu types ──────────────────────────────────────────────────────────────

type MenuId = 'dashboard' | 'wall' | 'pending' | 'groups' | 'promotion' | 'org' | 'work-process' | 'scheduled'

// ─── Post Card ───────────────────────────────────────────────────────────────

interface PostCardProps {
  post: WallPost
  currentUserId?: number
  currentUserRole?: string
  currentUserInitials: string
  onLike: (id: number) => void
  onDelete: (id: number) => void
  onDownload: (postId: number, fileName: string) => void
  onApprove?: (id: number) => void
  onReject?: (id: number) => void
  onPublishNow?: (id: number) => void
  showActions?: boolean
  showApproveReject?: boolean
  showPublishNow?: boolean
}

function PostCard({
  post,
  currentUserId,
  currentUserRole,
  currentUserInitials,
  onLike,
  onDelete,
  onDownload,
  onApprove,
  onReject,
  onPublishNow,
  showActions = true,
  showApproveReject = false,
  showPublishNow = false,
}: PostCardProps) {
  const [expandedContent, setExpandedContent] = useState(false)
  const [editingMode, setEditingMode] = useState(false)
  const [editTitle, setEditTitle] = useState(post.title ?? '')
  const [editContent, setEditContent] = useState(post.content)
  const [editFiles, setEditFiles] = useState<File[]>([])
  const [editKeptAttachments, setEditKeptAttachments] = useState<string[]>(post.attachments.map((a) => a.fileName))
  const [commentInput, setCommentInput] = useState('')
  const editFileRef = useRef<HTMLInputElement>(null)

  const updatePost = useUpdateWallPost()
  const addComment = useAddWallPostComment()
  const { toast } = useToast()

  const isLiked = currentUserId ? post.likes.includes(currentUserId) : false
  const canEdit = post.authorId === currentUserId || currentUserRole === 'SuperAdmin'

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editContent.trim()) return
    try {
      await updatePost.mutateAsync({ postId: post.id, title: editTitle.trim() || null, content: editContent.trim(), files: editFiles, keptAttachments: editKeptAttachments })
      setEditingMode(false)
      toast({ title: 'Đã cập nhật bài viết' })
    } catch {
      toast({ title: 'Lỗi cập nhật', variant: 'destructive' })
    }
  }

  const handleCommentSubmit = async () => {
    if (!commentInput.trim()) return
    try {
      await addComment.mutateAsync({ postId: post.id, content: commentInput.trim() })
      setCommentInput('')
    } catch {
      toast({ title: 'Lỗi gửi bình luận', variant: 'destructive' })
    }
  }

  return (
    <Card className="border-border shadow-sm bg-card/40 overflow-hidden hover:border-border/80 transition-colors">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-10 shadow-sm border">
              {post.authorAvatarUrl && (
                <AvatarImage src={resolveMediaUrl(post.authorAvatarUrl)} alt={post.authorName} />
              )}
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                {post.authorName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">{post.authorName}</span>
                <span className="inline-block size-1 rounded-full bg-muted-foreground/40" />
                <span className="text-[10px] text-success bg-success/15 px-1.5 py-0.5 rounded font-medium">
                  {post.authorDepartment || 'Tường công ty'}
                </span>
                {post.isCompanyPost && (
                  <Badge className="text-[9px] h-4 px-1.5 bg-success/15 text-success border-success/30 border">
                    <Building2 className="size-2.5 mr-0.5" />Thông báo CT
                  </Badge>
                )}
                {post.groupName && (
                  <Badge variant="outline" className="text-[9px] h-4 px-1.5">{post.groupName}</Badge>
                )}
                {!post.isApproved && (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5 text-warning border-warning/30 bg-warning/10">Chờ duyệt</Badge>
                )}
                {post.scheduledPublishDate && (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5 text-primary border-primary/30 bg-primary/10">
                    <CalendarClock className="size-2.5 mr-0.5" />
                    Hẹn giờ
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground">
                {new Date(post.createdDate).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
              </p>
            </div>
          </div>

          {canEdit && !editingMode && (
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => setEditingMode(true)} className="text-[11px] font-semibold text-muted-foreground hover:text-success transition-colors">Sửa</button>
              <span className="text-[10px] text-muted-foreground/30">|</span>
              <button onClick={() => onDelete(post.id)} className="text-[11px] font-semibold text-muted-foreground hover:text-destructive transition-colors">Xóa</button>
            </div>
          )}
        </div>

        {/* Edit mode */}
        {editingMode ? (
          <form onSubmit={(e) => void handleEditSubmit(e)} className="space-y-3 pt-2">
            <input type="text" className="w-full bg-transparent border-b border-border/40 pb-1.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-success/60" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Tiêu đề (không bắt buộc)..." />
            <textarea rows={3} className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none" value={editContent} onChange={(e) => setEditContent(e.target.value)} />
            {post.attachments.length > 0 && (
              <div className="space-y-1 bg-muted/20 p-2 rounded-lg">
                <p className="text-[10px] font-semibold text-muted-foreground">Tài liệu cũ:</p>
                {post.attachments.map((file, i) => {
                  const kept = editKeptAttachments.includes(file.fileName)
                  return (
                    <div key={i} className="flex items-center justify-between text-xs py-1">
                      <span className={`truncate max-w-[200px] ${kept ? '' : 'line-through text-muted-foreground'}`}>{file.fileName}</span>
                      <button type="button" onClick={() => setEditKeptAttachments((prev) => kept ? prev.filter((x) => x !== file.fileName) : [...prev, file.fileName])} className="text-xs font-medium text-success hover:underline">{kept ? 'Gỡ bỏ' : 'Giữ lại'}</button>
                    </div>
                  )
                })}
              </div>
            )}
            <input type="file" multiple ref={editFileRef} onChange={(e) => e.target.files && setEditFiles(Array.from(e.target.files))} className="hidden" />
            <div className="flex items-center justify-between pt-1 border-t border-border/30">
              <Button type="button" variant="ghost" size="sm" onClick={() => editFileRef.current?.click()} className="text-xs h-8 gap-1.5">
                <Paperclip className="size-3.5 text-success" /> File mới
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditingMode(false)} className="text-xs h-8">Hủy</Button>
                <Button type="submit" size="sm" disabled={!editContent.trim() || updatePost.isPending} className="bg-success text-success-foreground h-8 text-xs font-semibold px-4">
                  {updatePost.isPending ? <Loader2 className="size-3 animate-spin mr-1" /> : null} Lưu
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <>
            {/* Content */}
            <div className="space-y-1.5">
              {post.title && <h3 className="text-sm font-bold text-success/90 uppercase">{post.title}</h3>}
              <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {expandedContent || post.content.length <= 350 ? post.content : `${post.content.slice(0, 350)}...`}
              </div>
              {post.content.length > 350 && (
                <button onClick={() => setExpandedContent(!expandedContent)} className="text-xs font-semibold text-success hover:underline flex items-center gap-1">
                  {expandedContent ? <><ChevronUp className="size-3" />Thu gọn</> : <><ChevronDown className="size-3" />Xem thêm</>}
                </button>
              )}
            </div>

            {/* Attachments */}
            {post.attachments.length > 0 && (() => {
              const API_BASE = ((import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5244/api/v1')
              const imageAttachments = post.attachments.filter((a) => a.contentType?.startsWith('image/'))
              const fileAttachments = post.attachments.filter((a) => !a.contentType?.startsWith('image/'))
              return (
                <div className="space-y-2 pt-1">
                  {/* Inline image grid */}
                  {imageAttachments.length > 0 && (
                    <div className={`grid gap-1 rounded-xl overflow-hidden ${imageAttachments.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                      {imageAttachments.map((img, i) => (
                        <img
                          key={i}
                          src={`${API_BASE}/wall/download/${post.id}/${img.storedPath}`}
                          alt={img.fileName}
                          className="w-full object-cover max-h-80 cursor-pointer hover:opacity-95 transition-opacity"
                          onClick={() => window.open(`${API_BASE}/wall/download/${post.id}/${img.storedPath}`, '_blank')}
                        />
                      ))}
                    </div>
                  )}
                  {/* Non-image files */}
                  {fileAttachments.map((file, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="size-4 text-destructive shrink-0" />
                        <span className="font-medium text-foreground truncate max-w-[280px]">{file.fileName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono shrink-0">({(file.fileSizeBytes / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => void onDownload(post.id, file.fileName)} className="size-7">
                        <Download className="size-4 text-success" />
                      </Button>
                    </div>
                  ))}
                </div>
              )
            })()}
          </>
        )}

        {/* Approve/Reject buttons for pending posts */}
        {showApproveReject && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={() => onApprove?.(post.id)} className="h-7 text-xs bg-success text-success-foreground hover:bg-success/90 flex-1">
              <CheckCircle2 className="size-3.5 mr-1" /> Duyệt
            </Button>
            <Button size="sm" variant="destructive" onClick={() => onReject?.(post.id)} className="h-7 text-xs flex-1">
              <XCircle className="size-3.5 mr-1" /> Từ chối
            </Button>
          </div>
        )}

        {/* Publish now button for scheduled posts */}
        {showPublishNow && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={() => onPublishNow?.(post.id)} className="h-7 text-xs bg-primary text-primary-foreground hover:bg-primary/90 flex-1">
              <RefreshCw className="size-3.5 mr-1" /> Đăng ngay
            </Button>
            {post.scheduledPublishDate && (
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-1 justify-end">
                <CalendarClock className="size-3" />
                {new Date(post.scheduledPublishDate).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
              </div>
            )}
          </div>
        )}

        {/* Stats + Actions + Comments */}
        {showActions && !editingMode && (
          <>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span>{post.likes.length} lượt thích</span>
              <span className="size-1 rounded-full bg-muted-foreground/30" />
              <span>{post.comments.length} bình luận</span>
            </div>

            <Separator className="bg-border/30" />

            <div className="grid grid-cols-3 gap-2 py-0.5">
              <Button type="button" variant="ghost" size="sm" onClick={() => onLike(post.id)} className={`text-xs h-8 gap-2 hover:bg-accent ${isLiked ? 'text-danger font-semibold' : 'text-muted-foreground'}`}>
                <Heart className={`size-3.5 ${isLiked ? 'fill-danger text-danger' : ''}`} /> Thích
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-xs h-8 gap-2 text-muted-foreground hover:bg-accent">
                <MessageSquare className="size-3.5" /> Bình luận
              </Button>
              <Button type="button" variant="ghost" size="sm" className="text-xs h-8 gap-2 text-muted-foreground hover:bg-accent">
                <Share2 className="size-3.5" /> Chia sẻ
              </Button>
            </div>

            <Separator className="bg-border/30" />

            {post.comments.length > 0 && (
              <div className="space-y-3 pt-2">
                {post.comments.map((comm) => (
                  <div key={comm.id} className="flex items-start gap-2.5">
                    <Avatar className="size-7">
                      <AvatarFallback className="bg-accent text-accent-foreground text-[10px] font-semibold">
                        {comm.authorName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 rounded-lg bg-muted/40 p-2 text-xs">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-semibold text-foreground">{comm.authorName}</span>
                        <span className="text-[9px] text-muted-foreground">{new Date(comm.createdDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-foreground/90">{comm.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <Avatar className="size-7">
                <AvatarFallback className="bg-success/10 text-success text-[10px] font-semibold">{currentUserInitials}</AvatarFallback>
              </Avatar>
              <div className="relative flex-1 flex items-center rounded-lg border bg-background/50 px-2.5 py-1">
                <input type="text" placeholder="Viết thảo luận..." className="flex-grow bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none" value={commentInput} onChange={(e) => setCommentInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') void handleCommentSubmit() }} />
                <button type="button" onClick={() => void handleCommentSubmit()} className="text-muted-foreground hover:text-success" disabled={!commentInput.trim()}>
                  <Send className="size-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ─── Post Creator ─────────────────────────────────────────────────────────────

interface PostCreatorProps {
  authorInitials: string
  groupName?: string | null
  onSubmit: (title: string | null, content: string, files: File[], scheduledDate?: string | null, isCompanyPost?: boolean) => Promise<void>
  isPending: boolean
  showSchedule?: boolean
  placeholder?: string
  isCompanyPost?: boolean
}

function PostCreator({ authorInitials, groupName, onSubmit, isPending, showSchedule = false, placeholder, isCompanyPost = false }: PostCreatorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [scheduledDate, setScheduledDate] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    await onSubmit(title.trim() || null, content.trim(), files, scheduledDate || null, isCompanyPost)
    setTitle('')
    setContent('')
    setFiles([])
    setScheduledDate('')
    setShowDatePicker(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <Card className="border-border shadow-sm p-4 bg-card/50">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="size-10 shadow-sm border border-border">
            <AvatarFallback className="bg-success text-success-foreground text-sm font-semibold">{authorInitials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-2">
            <input type="text" placeholder="Tiêu đề thông báo (không bắt buộc)..." className="w-full bg-transparent border-b border-border/40 pb-1.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-success/60" value={title} onChange={(e) => setTitle(e.target.value)} />
            <textarea placeholder={placeholder ?? 'Đăng bài viết mới, chia sẻ thông báo...'} rows={3} className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none" value={content} onChange={(e) => setContent(e.target.value)} />
            {groupName && <p className="text-[10px] text-success">Đăng vào nhóm: <strong>{groupName}</strong></p>}
          </div>
        </div>

        {files.length > 0 && (
          <div className="flex flex-wrap gap-2 rounded-lg bg-muted/40 p-2">
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1 text-xs text-foreground">
                <FileText className="size-3.5 text-success" />
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button type="button" onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))} className="text-muted-foreground hover:text-destructive">×</button>
              </div>
            ))}
          </div>
        )}

        {showSchedule && showDatePicker && (
          <div className="flex items-center gap-2">
            <CalendarClock className="size-4 text-primary" />
            <input type="datetime-local" className="text-xs bg-transparent border-b border-border/40 text-foreground focus:outline-none focus:border-primary/60 pb-1" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
            <button type="button" onClick={() => { setShowDatePicker(false); setScheduledDate('') }} className="text-[11px] text-muted-foreground hover:text-foreground">Hủy</button>
          </div>
        )}

        <Separator className="bg-border/30" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input type="file" multiple ref={fileRef} onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))} className="hidden" />
            <Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()} className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5">
              <Paperclip className="size-3.5 text-success" /> Ảnh/File
            </Button>
            <Button type="button" variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5">
              <Smile className="size-3.5 text-warning" /> Bình chọn
            </Button>
            {showSchedule && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowDatePicker(!showDatePicker)} className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5">
                <CalendarClock className="size-3.5 text-primary" />
                {scheduledDate ? 'Đổi lịch' : 'Hẹn giờ'}
              </Button>
            )}
          </div>
          <Button type="submit" size="sm" disabled={!content.trim() || isPending} className="bg-success text-success-foreground hover:bg-success/90 h-8 text-xs font-semibold px-4 rounded-md">
            {isPending ? <Loader2 className="size-3 animate-spin mr-1.5" /> : null}
            {scheduledDate ? 'Hẹn giờ' : 'Đăng tin'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

// ─── Wall Page ────────────────────────────────────────────────────────────────

export function WallPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { data: profile } = useMyProfile()
  const { data: employeesData } = useEmployees({ pageNumber: 1, pageSize: 1000 })
  const employees = employeesData?.items ?? []

  const [selectedMenu, setSelectedMenu] = useState<MenuId>('dashboard')
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [newGroupName, setNewGroupName] = useState('')
  const [newGroupDesc, setNewGroupDesc] = useState('')
  const [showCreateGroup, setShowCreateGroup] = useState(false)

  // Queries
  const { data: feedPosts = [], isLoading: feedLoading, isError: feedError, refetch: feedRefetch } = useWallPosts()
  const { data: companyPosts = [], isLoading: companyLoading, isError: companyError, refetch: companyRefetch } = useCompanyWallPosts()
  const { data: pendingPosts = [], isLoading: pendingLoading } = usePendingWallPosts()
  const { data: scheduledPosts = [], isLoading: scheduledLoading } = useScheduledWallPosts()
  const { data: groupFeedPosts = [], isLoading: groupFeedLoading } = useGroupWallPosts(selectedGroup ?? '')
  const { data: groups = [], isLoading: groupsLoading } = useWallGroups()

  // Mutations
  const createPost = useCreateWallPost()
  const toggleLike = useToggleWallPostLike()
  const deletePost = useDeleteWallPost()
  const approvePost = useApproveWallPost()
  const rejectPost = useRejectWallPost()
  const publishNow = usePublishNowWallPost()
  const createGroup = useCreateWallGroup()
  const deleteGroup = useDeleteWallGroup()

  const authorInitials = (profile?.fullName ?? user?.username ?? 'NN').slice(0, 2).toUpperCase()
  const isManagerOrAdmin = user?.role === 'SuperAdmin' || user?.role === 'Manager'

  // Birthdays
  const currentMonth = new Date().getMonth()
  const todayDay = new Date().getDate()

  const todayEmployees = useMemo(
    () => employees.filter((emp) => { if (!emp.dateOfBirth) return false; const d = new Date(emp.dateOfBirth); return d.getDate() === todayDay && d.getMonth() === currentMonth }),
    [employees, todayDay, currentMonth],
  )

  const currentMonthEmployees = useMemo(
    () => employees.filter((emp) => { if (!emp.dateOfBirth) return false; return new Date(emp.dateOfBirth).getMonth() === currentMonth }).sort((a, b) => new Date(a.dateOfBirth).getDate() - new Date(b.dateOfBirth).getDate()),
    [employees, currentMonth],
  )

  // Handlers
  const handleLike = async (postId: number) => {
    try { await toggleLike.mutateAsync(postId) } catch { /* ignored */ }
  }

  const handleDelete = async (postId: number) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return
    try {
      await deletePost.mutateAsync(postId)
      toast({ title: 'Đã xóa bài viết' })
    } catch {
      toast({ title: 'Lỗi xóa bài viết', variant: 'destructive' })
    }
  }

  const handleDownload = async (postId: number, fileName: string) => {
    try { await downloadWallAttachment(postId, fileName) } catch { toast({ title: 'Lỗi tải file', variant: 'destructive' }) }
  }

  const handleApprove = async (postId: number) => {
    try { await approvePost.mutateAsync(postId); toast({ title: 'Đã duyệt bài viết' }) } catch { toast({ title: 'Lỗi', variant: 'destructive' }) }
  }

  const handleReject = async (postId: number) => {
    try { await rejectPost.mutateAsync(postId); toast({ title: 'Đã từ chối bài viết' }) } catch { toast({ title: 'Lỗi', variant: 'destructive' }) }
  }

  const handlePublishNow = async (postId: number) => {
    try { await publishNow.mutateAsync(postId); toast({ title: 'Đã đăng ngay bài viết' }) } catch { toast({ title: 'Lỗi', variant: 'destructive' }) }
  }

  const handleCreatePost = async (title: string | null, content: string, files: File[], scheduledDate?: string | null, isCompanyPost?: boolean) => {
    try {
      await createPost.mutateAsync({ title, content, files, groupName: selectedGroup ?? undefined, scheduledPublishDate: scheduledDate, isCompanyPost })
      toast({ title: scheduledDate ? 'Đã lên lịch đăng bài' : 'Đăng bài thành công' })
    } catch (err) {
      toast({ title: 'Lỗi đăng bài', description: err instanceof Error ? err.message : undefined, variant: 'destructive' })
    }
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGroupName.trim()) return
    try {
      await createGroup.mutateAsync({ name: newGroupName.trim(), description: newGroupDesc.trim() || undefined })
      setNewGroupName('')
      setNewGroupDesc('')
      setShowCreateGroup(false)
      toast({ title: 'Đã tạo nhóm thảo luận' })
    } catch (err) {
      toast({ title: 'Lỗi', description: err instanceof Error ? err.message : 'Không thể tạo nhóm', variant: 'destructive' })
    }
  }

  const handleDeleteGroup = async (name: string) => {
    if (!window.confirm(`Xóa nhóm "${name}"?`)) return
    try { await deleteGroup.mutateAsync(name); toast({ title: 'Đã xóa nhóm' }) } catch { toast({ title: 'Lỗi xóa nhóm', variant: 'destructive' }) }
  }

  // ─── Post card common props ─────────────────────────────────────────────

  const commonPostProps = {
    currentUserId: user?.employeeId ?? 0,
    currentUserRole: user?.role,
    currentUserInitials: authorInitials,
    onLike: (id: number) => void handleLike(id),
    onDelete: (id: number) => void handleDelete(id),
    onDownload: (postId: number, fileName: string) => void handleDownload(postId, fileName),
  }

  // ─── Feed skeleton ──────────────────────────────────────────────────────

  const FeedSkeleton = () => (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
      <Loader2 className="size-8 animate-spin text-success" />
      <p className="text-sm">Đang tải...</p>
    </div>
  )

  // ─── Post feed renderer ─────────────────────────────────────────────────

  const renderPosts = (
    posts: WallPost[],
    loading: boolean,
    error?: boolean,
    refetch?: () => void,
    opts?: { showApproveReject?: boolean; showPublishNow?: boolean; showActions?: boolean; emptyText?: string },
  ) => {
    if (loading) return <FeedSkeleton />
    if (error) return (
      <Card className="p-6 text-center border-border/50">
        <AlertCircle className="size-10 text-destructive mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-3">Không thể tải dữ liệu.</p>
        {refetch && <Button size="sm" onClick={refetch}>Thử lại</Button>}
      </Card>
    )
    if (posts.length === 0) return (
      <div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg bg-card/20">
        <MessageSquare className="size-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium">{opts?.emptyText ?? 'Chưa có bài viết nào'}</p>
      </div>
    )
    return (
      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            {...commonPostProps}
            showApproveReject={opts?.showApproveReject && isManagerOrAdmin}
            showPublishNow={opts?.showPublishNow}
            showActions={opts?.showActions !== false}
            onApprove={opts?.showApproveReject ? (id) => void handleApprove(id) : undefined}
            onReject={opts?.showApproveReject ? (id) => void handleReject(id) : undefined}
            onPublishNow={opts?.showPublishNow ? (id) => void handlePublishNow(id) : undefined}
          />
        ))}
      </div>
    )
  }

  // ─── Center content per menu ────────────────────────────────────────────

  const renderCenterContent = () => {
    switch (selectedMenu) {
      // ─ Bảng tin (all posts from everyone) ─────────────────────────────
      case 'dashboard':
        return (
          <div className="space-y-4">
            <PostCreator authorInitials={authorInitials} onSubmit={handleCreatePost} isPending={createPost.isPending} placeholder="Đăng bài viết mới, chia sẻ thông tin..." />
            {renderPosts(feedPosts, feedLoading, feedError, feedRefetch, { emptyText: 'Bảng tin chưa có bài viết nào' })}
          </div>
        )

      // ─ Tường công ty (company announcements, admin/manager only post) ──
      case 'wall':
        return (
          <div className="space-y-4">
            <Card className="p-3 border-success/30 bg-success/5">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-success" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Tường công ty</p>
                  <p className="text-xs text-muted-foreground">Thông báo chính thức từ Ban Giám đốc và Quản lý</p>
                </div>
              </div>
            </Card>
            {isManagerOrAdmin && (
              <PostCreator
                authorInitials={authorInitials}
                onSubmit={handleCreatePost}
                isPending={createPost.isPending}
                isCompanyPost
                placeholder="Đăng thông báo chính thức của công ty..."
              />
            )}
            {renderPosts(companyPosts, companyLoading, companyError, companyRefetch, {
              emptyText: isManagerOrAdmin ? 'Chưa có thông báo nào. Hãy đăng thông báo đầu tiên!' : 'Chưa có thông báo công ty nào.',
            })}
          </div>
        )

      // ─ Bài viết chờ duyệt ──────────────────────────────────────────────
      case 'pending':
        return (
          <div className="space-y-4">
            <Card className="p-3 border-warning/30 bg-warning/5">
              <div className="flex items-center gap-2">
                <FolderLock className="size-4 text-warning" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Bài viết chờ duyệt</p>
                  <p className="text-xs text-muted-foreground">
                    {isManagerOrAdmin ? `Có ${pendingPosts.length} bài viết cần phê duyệt` : 'Các bài viết của bạn đang chờ được duyệt'}
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto text-warning border-warning/30 bg-warning/10 font-bold">
                  {pendingPosts.length}
                </Badge>
              </div>
            </Card>
            {renderPosts(pendingPosts, pendingLoading, false, undefined, {
              showApproveReject: true,
              showActions: false,
              emptyText: 'Không có bài viết nào chờ duyệt',
            })}
          </div>
        )

      // ─ Nhóm thảo luận ──────────────────────────────────────────────────
      case 'groups':
        if (selectedGroup) {
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <button onClick={() => setSelectedGroup(null)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  ← Nhóm
                </button>
                <Separator orientation="vertical" className="h-4" />
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Compass className="size-4 text-primary" /> {selectedGroup}
                </h2>
              </div>
              <PostCreator authorInitials={authorInitials} groupName={selectedGroup} onSubmit={handleCreatePost} isPending={createPost.isPending} placeholder={`Đăng vào nhóm ${selectedGroup}...`} />
              {renderPosts(groupFeedPosts, groupFeedLoading, false, undefined, { emptyText: 'Nhóm chưa có bài viết nào' })}
            </div>
          )
        }

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Compass className="size-4 text-primary" /> Nhóm thảo luận ({groups.length})
              </h2>
              {isManagerOrAdmin && (
                <Button size="sm" onClick={() => setShowCreateGroup(!showCreateGroup)} className="h-7 text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="size-3.5" /> Tạo nhóm
                </Button>
              )}
            </div>

            {showCreateGroup && (
              <Card className="p-4 border-primary/30 bg-primary/5">
                <form onSubmit={(e) => void handleCreateGroup(e)} className="space-y-3">
                  <p className="text-sm font-semibold text-foreground">Tạo nhóm thảo luận mới</p>
                  <Input placeholder="Tên nhóm *" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} className="h-8 text-sm" />
                  <Input placeholder="Mô tả nhóm (không bắt buộc)" value={newGroupDesc} onChange={(e) => setNewGroupDesc(e.target.value)} className="h-8 text-sm" />
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowCreateGroup(false)} className="h-7 text-xs">Hủy</Button>
                    <Button type="submit" size="sm" disabled={!newGroupName.trim() || createGroup.isPending} className="h-7 text-xs bg-primary text-primary-foreground">
                      {createGroup.isPending ? <Loader2 className="size-3 animate-spin mr-1" /> : null} Tạo nhóm
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {groupsLoading ? <FeedSkeleton /> : groups.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg bg-card/20">
                <Compass className="size-10 mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">Chưa có nhóm thảo luận nào</p>
                {isManagerOrAdmin && <p className="text-xs mt-1">Tạo nhóm đầu tiên để bắt đầu thảo luận</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {groups.map((group) => (
                  <Card
                    key={group.name}
                    className="p-4 border-border/60 bg-card/40 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all group"
                    onClick={() => setSelectedGroup(group.name)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <BookOpen className="size-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{group.name}</h3>
                          {group.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{group.description}</p>}
                          <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[10px] text-muted-foreground">{group.postCount} bài viết</span>
                            {group.createdBy && <span className="text-[10px] text-muted-foreground">Bởi {group.createdBy}</span>}
                          </div>
                        </div>
                      </div>
                      {isManagerOrAdmin && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); void handleDeleteGroup(group.name) }}
                          className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )

      // ─ Bài viết hẹn giờ ────────────────────────────────────────────────
      case 'scheduled':
        return (
          <div className="space-y-4">
            <Card className="p-3 border-primary/30 bg-primary/5">
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Bài viết hẹn giờ</p>
                  <p className="text-xs text-muted-foreground">Các bài viết sẽ được đăng theo lịch đã đặt</p>
                </div>
                <Badge variant="secondary" className="ml-auto text-primary border-primary/30 bg-primary/10 font-bold">
                  {scheduledPosts.length}
                </Badge>
              </div>
            </Card>
            <PostCreator authorInitials={authorInitials} onSubmit={handleCreatePost} isPending={createPost.isPending} showSchedule placeholder="Nội dung bài viết hẹn giờ..." />
            {renderPosts(scheduledPosts, scheduledLoading, false, undefined, {
              showPublishNow: true,
              showActions: false,
              emptyText: 'Không có bài viết hẹn giờ nào',
            })}
          </div>
        )

      // ─ Lộ trình thăng tiến ────────────────────────────────────────────
      case 'promotion':
        return <CareerPathSection />

      // ─ Sơ đồ tổ chức ─────────────────────────────────────────────────
      case 'org':
        return <OrgChartSection />

      // ─ Quá trình làm việc ────────────────────────────────────────────
      case 'work-process':
        return <WorkHistorySection />

      default:
        return null
    }
  }

  // ─── Menus ────────────────────────────────────────────────────────────────

  const mainMenus: { id: MenuId; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Bảng tin', icon: MessageSquare },
    { id: 'wall', label: 'Tường công ty', icon: Users },
    { id: 'pending', label: 'Bài viết chờ duyệt', icon: FolderLock, badge: pendingPosts.length },
    { id: 'groups', label: 'Nhóm, thảo luận', icon: Compass },
  ]

  const extraMenus: { id: MenuId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'promotion', label: 'Lộ trình thăng tiến', icon: TrendingUp },
    { id: 'org', label: 'Sơ đồ tổ chức', icon: Building2 },
    { id: 'work-process', label: 'Quá trình làm việc', icon: History },
    { id: 'scheduled', label: 'Bài viết hẹn giờ', icon: CalendarClock },
  ]

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="size-5 text-success" />
            Tường Công Ty
          </h1>
          <p className="text-xs text-muted-foreground">Chia sẻ thông tin, thông báo và hoạt động nội bộ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Left: Profile + Nav */}
        <div className="space-y-4 lg:col-span-1">
          {/* Profile card */}
          <Card className="overflow-hidden border-border bg-card/60 shadow-sm backdrop-blur-md">
            <div className="h-16 bg-gradient-to-r from-success/20 to-primary/20" />
            <CardContent className="relative flex flex-col items-center p-4 text-center">
              <Avatar className="absolute -top-10 size-20 border-4 border-card shadow-md">
                <AvatarImage src="" />
                <AvatarFallback className="bg-success text-success-foreground text-xl font-bold">
                  {authorInitials}
                </AvatarFallback>
              </Avatar>
              <div className="mt-12 space-y-1">
                <h3 className="font-semibold text-foreground text-base">{profile?.fullName ?? user?.fullName ?? user?.username}</h3>
                <p className="text-xs text-muted-foreground font-medium">{profile?.position ?? 'Nhân viên'}</p>
                <p className="text-[11px] rounded bg-muted px-2 py-0.5 text-muted-foreground font-mono">{profile?.departmentName ?? 'Công ty'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card className="p-2 border-border bg-card/60 shadow-sm">
            <div className="space-y-0.5">
              {mainMenus.map((m) => {
                const Icon = m.icon
                const isActive = selectedMenu === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => { setSelectedMenu(m.id); if (m.id !== 'groups') setSelectedGroup(null) }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${isActive ? 'bg-success/15 text-success hover:bg-success/20' : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="flex-1">{m.label}</span>
                    {m.badge !== undefined && m.badge > 0 && (
                      <Badge className="text-[9px] h-4 min-w-[16px] px-1 bg-warning text-white">{m.badge}</Badge>
                    )}
                  </button>
                )
              })}

              <div className="py-2"><Separator /></div>

              {extraMenus.map((em) => {
                const Icon = em.icon
                const isActive = selectedMenu === em.id
                return (
                  <button
                    key={em.id}
                    onClick={() => setSelectedMenu(em.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-xs font-normal transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground/80 hover:bg-accent hover:text-foreground'}`}
                  >
                    <Icon className="size-3.5 shrink-0" />
                    {em.label}
                  </button>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Center: Content */}
        <div className="space-y-4 lg:col-span-2">
          {renderCenterContent()}
        </div>

        {/* Right: Birthdays */}
        <div className="space-y-4 lg:col-span-1">
          <Card className="border-border bg-card/60 shadow-sm overflow-hidden">
            <div className="p-3 bg-gradient-to-r from-pink-500/10 to-orange-500/10 border-b border-border/40 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/80 flex items-center gap-1.5">
                <Cake className="size-3.5 text-pink-500" /> Sinh nhật
              </h4>
            </div>
            <CardContent className="p-3 space-y-4">
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold tracking-wide text-muted-foreground">Sinh nhật hôm nay</p>
                {todayEmployees.length === 0 ? (
                  <p className="text-muted-foreground text-xs italic py-1">Hôm nay không có sinh nhật ai.</p>
                ) : (
                  <div className="space-y-1.5">
                    {todayEmployees.map((emp) => (
                      <div key={emp.id} className="flex items-center gap-2 text-xs bg-success/10 p-2 rounded-lg border border-success/20 animate-pulse">
                        <Avatar className="size-6 border border-success">
                          <AvatarFallback className="bg-success text-success-foreground text-[9px] font-bold">{emp.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-success truncate">{emp.fullName}</p>
                          <p className="text-[10px] text-success/80">🎂 Hôm nay!</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-border/40">
                <p className="text-[10px] uppercase font-bold tracking-wide text-muted-foreground">Trong tháng {new Date().getMonth() + 1} ({currentMonthEmployees.length})</p>
                {currentMonthEmployees.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-1">Không có ai sinh nhật tháng này.</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {currentMonthEmployees.map((emp) => {
                      const dobDate = new Date(emp.dateOfBirth)
                      const isToday = dobDate.getDate() === todayDay && dobDate.getMonth() === currentMonth
                      return (
                        <div key={emp.id} className="flex items-center gap-2 text-xs hover:bg-accent/40 p-1 rounded-md transition-colors">
                          <Avatar className="size-6 border">
                            <AvatarFallback className="bg-primary/20 text-primary text-[9px] font-bold">{emp.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{emp.fullName}</p>
                            <p className="text-[9px] text-muted-foreground">Ngày {dobDate.getDate()}/{dobDate.getMonth() + 1}</p>
                          </div>
                          {isToday && <span className="text-[8px] font-bold text-success bg-success/15 px-1.5 py-0.5 rounded animate-pulse">Hôm nay</span>}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick stats for current menu */}
          {(selectedMenu === 'dashboard' || selectedMenu === 'wall') && (
            <Card className="border-border bg-card/60 shadow-sm p-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/80 mb-3">Thống kê nhanh</h4>
              <div className="space-y-2">
                {[
                  { label: 'Tổng bài viết', value: feedPosts.length, icon: MessageSquare, color: 'text-primary' },
                  { label: 'Chờ duyệt', value: pendingPosts.length, icon: Clock, color: 'text-warning' },
                  { label: 'Hẹn giờ', value: scheduledPosts.length, icon: CalendarClock, color: 'text-success' },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <s.icon className={`size-3.5 ${s.color}`} />
                      <span className="text-muted-foreground">{s.label}</span>
                    </div>
                    <span className="font-semibold text-foreground">{s.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
