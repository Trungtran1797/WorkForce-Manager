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
  Settings,
  Calendar,
  Circle,
  CheckSquare,
  Square,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { HelpCircle, Lock } from 'lucide-react'
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
  useVoteWallPoll,
  useAddWallPollOption,
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
  employees?: any[]
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
  employees,
}: PostCardProps) {
  const [expandedContent, setExpandedContent] = useState(false)
  const [editingMode, setEditingMode] = useState(false)
  const [editTitle, setEditTitle] = useState(post.title ?? '')
  const [editContent, setEditContent] = useState(post.content)
  const [editFiles, setEditFiles] = useState<File[]>([])
  const [editKeptAttachments, setEditKeptAttachments] = useState<string[]>(post.attachments.map((a) => a.fileName))
  const [commentInput, setCommentInput] = useState('')
  const editFileRef = useRef<HTMLInputElement>(null)

  const [customOptionInput, setCustomOptionInput] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const voteMutation = useVoteWallPoll()
  const addOptionMutation = useAddWallPollOption()

  const updatePost = useUpdateWallPost()
  const addComment = useAddWallPostComment()
  const { toast } = useToast()

  const initialDate = post.poll?.endDate ? post.poll.endDate.split('T')[0] : ''
  const initialTime = post.poll?.endDate ? post.poll.endDate.split('T')[1]?.substring(0, 5) ?? '' : ''

  const [editShowPoll, setEditShowPoll] = useState(!!post.poll)
  const [editPollOptions, setEditPollOptions] = useState<string[]>(post.poll?.options ?? ['', ''])
  const [editPollEndTime, setEditPollEndTime] = useState(initialTime)
  const [editPollEndDatePicker, setEditPollEndDatePicker] = useState(initialDate)
  const [editPollMultipleChoice, setEditPollMultipleChoice] = useState(post.poll?.multipleChoice ?? false)
  const [editPollAllowAddOptions, setEditPollAllowAddOptions] = useState(post.poll?.allowAddOptions ?? false)
  const [editPollAnonymous, setEditPollAnonymous] = useState(post.poll?.anonymous ?? false)
  const [editPollHideResultsBeforeVoting, setEditPollHideResultsBeforeVoting] = useState(post.poll?.hideResultsBeforeVoting ?? false)
  const [editPollPinToTop, setEditPollPinToTop] = useState(post.poll?.pinToTop ?? false)
  const [showEditSettings, setShowEditSettings] = useState(false)

  const isLiked = currentUserId ? post.likes.includes(currentUserId) : false
  const canEdit = post.authorId === currentUserId || currentUserRole === 'SuperAdmin'

  const poll = post.poll
  const isEnded = poll?.endDate ? new Date(poll.endDate) < new Date() : false

  const hasVotedAny = useMemo(() => {
    if (!poll || !currentUserId) return false
    return poll.votes.some((v) => v.votedUserIds.includes(currentUserId))
  }, [poll, currentUserId])

  const shouldHideResults = useMemo(() => {
    if (!poll) return false
    return poll.hideResultsBeforeVoting && !hasVotedAny && !isEnded
  }, [poll, hasVotedAny, isEnded])

  const totalUniqueVoters = useMemo(() => {
    if (!poll?.votes) return 0
    const allVotedUserIds = poll.votes.flatMap((v) => v.votedUserIds)
    return new Set(allVotedUserIds).size
  }, [poll])

  const handleVoteClick = async (optionText: string) => {
    if (isEnded) return
    if (!currentUserId) {
      toast({ title: 'Bạn cần đăng nhập để bình chọn', variant: 'destructive' })
      return
    }

    const currentVotes = poll?.votes ?? []
    let newSelected: string[] = []

    if (poll?.multipleChoice) {
      const userVotedOptions = currentVotes
        .filter((v) => v.votedUserIds.includes(currentUserId))
        .map((v) => v.option)

      if (userVotedOptions.includes(optionText)) {
        newSelected = userVotedOptions.filter((o) => o !== optionText)
      } else {
        newSelected = [...userVotedOptions, optionText]
      }
    } else {
      const userVotedOption = currentVotes.find((v) => v.votedUserIds.includes(currentUserId))?.option
      if (userVotedOption === optionText) {
        newSelected = []
      } else {
        newSelected = [optionText]
      }
    }

    try {
      await voteMutation.mutateAsync({ postId: post.id, options: newSelected })
    } catch (err: any) {
      toast({ title: err.message || 'Lỗi bình chọn', variant: 'destructive' })
    }
  }

  const handleAddCustomOption = async () => {
    const cleaned = customOptionInput.trim()
    if (!cleaned) return
    if (poll?.options.some((o) => o.toLowerCase() === cleaned.toLowerCase())) {
      toast({ title: 'Lựa chọn này đã tồn tại', variant: 'destructive' })
      return
    }

    try {
      await addOptionMutation.mutateAsync({ postId: post.id, option: cleaned })
      setCustomOptionInput('')
      setShowCustomInput(false)
      toast({ title: 'Đã thêm lựa chọn mới' })
    } catch (err: any) {
      toast({ title: err.message || 'Lỗi thêm lựa chọn', variant: 'destructive' })
    }
  }

  const formatEndDate = (dateStr?: string) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    return date.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editContent.trim()) return

    let finalPollEndDate: string | null = null
    const validPollOptions = editPollOptions.filter((o) => o.trim())

    if (editShowPoll) {
      if (validPollOptions.length < 2) {
        alert('Vui lòng nhập ít nhất 2 lựa chọn bình chọn.')
        return
      }
      if (editPollEndDatePicker) {
        finalPollEndDate = editPollEndTime
          ? `${editPollEndDatePicker}T${editPollEndTime}:00`
          : `${editPollEndDatePicker}T23:59:59`
      }
    }

    try {
      await updatePost.mutateAsync({
        postId: post.id,
        title: editTitle.trim() || null,
        content: editContent.trim(),
        files: editFiles,
        keptAttachments: editKeptAttachments,
        pollOptions: editShowPoll ? validPollOptions : undefined,
        pollEndDate: editShowPoll ? finalPollEndDate : undefined,
        pollMultipleChoice: editShowPoll ? editPollMultipleChoice : undefined,
        pollAllowAddOptions: editShowPoll ? editPollAllowAddOptions : undefined,
        pollAnonymous: editShowPoll ? editPollAnonymous : undefined,
        pollHideResultsBeforeVoting: editShowPoll ? editPollHideResultsBeforeVoting : undefined,
        pollPinToTop: editShowPoll ? editPollPinToTop : undefined,
      })
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

            {/* Edit Poll configurations */}
            {editShowPoll && (
              <div className="space-y-3 border border-border/60 rounded-xl p-3 bg-muted/5 my-2">
                <p className="text-[10px] uppercase font-bold tracking-wider text-[#9c96f8]">Thiết lập bình chọn</p>
                {/* Options list */}
                <div className="space-y-2">
                  {editPollOptions.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder={`Lựa chọn ${idx + 1}`}
                        value={opt}
                        onChange={(e) => {
                          const updated = [...editPollOptions]
                          updated[idx] = e.target.value
                          setEditPollOptions(updated)
                        }}
                        className="w-full bg-transparent border border-border/80 rounded-md px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#9c96f8]"
                      />
                      {editPollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setEditPollOptions(editPollOptions.filter((_, i) => i !== idx))}
                          className="text-muted-foreground hover:text-destructive shrink-0 p-1"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add option + gear settings */}
                <div className="flex gap-2 items-stretch">
                  <button
                    type="button"
                    onClick={() => setEditPollOptions([...editPollOptions, ''])}
                    className="flex-grow border-dashed border border-blue-500/60 rounded-md py-1.5 flex items-center justify-center text-blue-600 text-xs font-semibold hover:bg-blue-50/50 transition-colors"
                  >
                    <Plus className="size-3.5 mr-1" /> THÊM LỰA CHỌN
                  </button>
                  
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowEditSettings(!showEditSettings)}
                      className="h-full px-3 border border-border/80 rounded-md bg-muted/20 hover:bg-muted/40 transition-colors flex items-center gap-1 text-muted-foreground"
                    >
                      <Settings className="size-4" /> <ChevronDown className="size-3" />
                    </button>
                    {showEditSettings && (
                      <div className="absolute right-0 bottom-full mb-2 z-50 w-56 rounded-md border bg-card p-3 shadow-md text-xs space-y-2">
                        <p className="font-semibold text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Cấu hình bình chọn</p>
                        <label className="flex items-center gap-2 cursor-pointer py-0.5">
                          <input
                            type="checkbox"
                            checked={editPollMultipleChoice}
                            onChange={(e) => setEditPollMultipleChoice(e.target.checked)}
                            className="rounded border-border text-[#9c96f8] focus:ring-[#9c96f8] size-3.5"
                          />
                          <span>Chọn nhiều phương án</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer py-0.5">
                          <input
                            type="checkbox"
                            checked={editPollAllowAddOptions}
                            onChange={(e) => setEditPollAllowAddOptions(e.target.checked)}
                            className="rounded border-border text-[#9c96f8] focus:ring-[#9c96f8] size-3.5"
                          />
                          <span>Cho phép thêm lựa chọn</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer py-0.5">
                          <input
                            type="checkbox"
                            checked={editPollAnonymous}
                            onChange={(e) => setEditPollAnonymous(e.target.checked)}
                            className="rounded border-border text-[#9c96f8] focus:ring-[#9c96f8] size-3.5"
                          />
                          <span>Ẩn người bình chọn</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer py-0.5">
                          <input
                            type="checkbox"
                            checked={editPollHideResultsBeforeVoting}
                            onChange={(e) => setEditPollHideResultsBeforeVoting(e.target.checked)}
                            className="rounded border-border text-[#9c96f8] focus:ring-[#9c96f8] size-3.5"
                          />
                          <span>Ẩn kết quả khi chưa bình chọn</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer py-0.5">
                          <input
                            type="checkbox"
                            checked={editPollPinToTop}
                            onChange={(e) => setEditPollPinToTop(e.target.checked)}
                            className="rounded border-border text-[#9c96f8] focus:ring-[#9c96f8] size-3.5"
                          />
                          <span>Ghim lên đầu bảng tin</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                {/* End date pickers */}
                <div className="space-y-1">
                  <div className="text-right text-[10px] text-muted-foreground font-medium pr-1">Thời gian kết thúc bình chọn</div>
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-4 relative flex items-center">
                      <input
                        type="time"
                        value={editPollEndTime}
                        onChange={(e) => setEditPollEndTime(e.target.value)}
                        className="w-full bg-transparent border border-border/80 rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#9c96f8] pr-8"
                      />
                      <Clock className="absolute right-2.5 size-3.5 text-muted-foreground/60 pointer-events-none" />
                    </div>
                    <div className="col-span-8 relative flex items-center">
                      <input
                        type="date"
                        value={editPollEndDatePicker}
                        onChange={(e) => setEditPollEndDatePicker(e.target.value)}
                        className="w-full bg-transparent border border-border/80 rounded-md px-2 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#9c96f8] pr-8"
                      />
                      <Calendar className="absolute right-2.5 size-3.5 text-muted-foreground/60 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <input type="file" multiple ref={editFileRef} onChange={(e) => e.target.files && setEditFiles(Array.from(e.target.files))} className="hidden" />
            <div className="flex items-center justify-between pt-1 border-t border-border/30">
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => editFileRef.current?.click()} className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground">
                  <Paperclip className="size-3.5 text-success" /> File mới
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => setEditShowPoll(!editShowPoll)} className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5">
                  <Smile className="size-3.5 text-warning" /> Bình chọn
                </Button>
              </div>
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

            {/* Poll Box */}
            {poll && (
              <div className="border border-border/80 rounded-xl p-4 bg-muted/5 dark:bg-card/25 space-y-3 my-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#9c96f8] bg-[#9c96f8]/10 px-2 py-0.5 rounded">BÌNH CHỌN</span>
                    {poll.multipleChoice && (
                      <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">Chọn nhiều</span>
                    )}
                  </div>
                  {poll.endDate && (
                    <span className={`text-[10px] font-medium ${isEnded ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {isEnded ? 'Đã kết thúc' : `Hết hạn: ${formatEndDate(poll.endDate)}`}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {poll.options.map((opt, idx) => {
                    const voteData = poll.votes.find((v) => v.option === opt)
                    const votedUserIds = voteData?.votedUserIds ?? []
                    const voteCount = votedUserIds.length
                    const percentage = totalUniqueVoters > 0 ? Math.round((voteCount / totalUniqueVoters) * 100) : 0
                    const hasVoted = currentUserId ? votedUserIds.includes(currentUserId) : false

                    return (
                      <div
                        key={idx}
                        onClick={() => !isEnded && void handleVoteClick(opt)}
                        className={`relative overflow-hidden border rounded-xl p-3 flex items-center justify-between transition-all select-none ${
                          isEnded ? 'cursor-not-allowed opacity-85' : 'cursor-pointer hover:bg-muted/10'
                        } ${hasVoted ? 'border-[#9c96f8] bg-[#9c96f8]/5' : 'border-border/60 bg-transparent'}`}
                      >
                        {/* Background Progress bar */}
                        <div
                          className="absolute inset-y-0 left-0 bg-[#9c96f8]/10 dark:bg-[#9c96f8]/15 transition-all duration-500 z-0"
                          style={{ width: `${shouldHideResults ? 0 : percentage}%` }}
                        />

                        {/* Left Side: checkbox + option text */}
                        <div className="flex items-center gap-2.5 relative z-10 min-w-0">
                          {poll.multipleChoice ? (
                            hasVoted ? (
                              <CheckSquare className="size-4 text-[#9c96f8] shrink-0" />
                            ) : (
                              <Square className="size-4 text-muted-foreground/60 shrink-0" />
                            )
                          ) : hasVoted ? (
                            <CheckCircle2 className="size-4 text-[#9c96f8] shrink-0" />
                          ) : (
                            <Circle className="size-4 text-muted-foreground/60 shrink-0" />
                          )}
                          <span className="text-xs font-semibold text-foreground truncate pr-2">{opt}</span>
                        </div>

                        {/* Right Side: avatar stack + count */}
                        <div className="flex items-center gap-2 relative z-10 shrink-0">
                          {!shouldHideResults && !poll.anonymous && votedUserIds.length > 0 && employees && (
                            <div className="flex -space-x-1.5 items-center mr-1">
                              {votedUserIds.slice(0, 3).map((vUserId) => {
                                const emp = employees.find((e) => e.id === vUserId)
                                return (
                                  <Avatar key={vUserId} className="size-5 border border-background shadow-sm" title={emp?.fullName}>
                                    {emp?.avatarUrl && (
                                      <AvatarImage src={resolveMediaUrl(emp.avatarUrl)} alt={emp?.fullName} />
                                    )}
                                    <AvatarFallback className="bg-primary/20 text-primary text-[8px] font-bold">
                                      {(emp?.fullName ?? 'NN').slice(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                )
                              })}
                              {votedUserIds.length > 3 && (
                                <span className="text-[9px] font-semibold text-muted-foreground bg-muted border rounded-full size-5 flex items-center justify-center border-background shadow-sm">
                                  +{votedUserIds.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                          
                          <span className="text-xs font-bold font-mono text-foreground/80 flex items-center">
                            {shouldHideResults ? (
                            <span title="Bình chọn để xem kết quả"><Lock className="size-3.5 text-muted-foreground/50" /></span>
                            ) : (
                              `${voteCount} (${percentage}%)`
                            )}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Add Custom Option input */}
                {poll.allowAddOptions && !isEnded && (
                  showCustomInput ? (
                    <div className="flex gap-2 items-center pt-1 relative">
                      <input
                        type="text"
                        placeholder="Nhập lựa chọn khác..."
                        value={customOptionInput}
                        onChange={(e) => setCustomOptionInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') void handleAddCustomOption()
                        }}
                        className="flex-grow bg-transparent border border-border/80 rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-[#9c96f8]"
                        autoFocus
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={!customOptionInput.trim() || addOptionMutation.isPending}
                        onClick={() => void handleAddCustomOption()}
                        className="h-8 text-xs bg-[#9c96f8] text-white hover:bg-[#8982f6] px-3.5 rounded-lg"
                      >
                        {addOptionMutation.isPending ? <Loader2 className="size-3 animate-spin mr-1" /> : null} Thêm
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setShowCustomInput(false)
                          setCustomOptionInput('')
                        }}
                        className="h-8 text-xs text-muted-foreground hover:text-foreground px-3 rounded-lg"
                      >
                        Hủy
                      </Button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(true)}
                      className="w-full border border-dashed border-border hover:border-[#9c96f8] rounded-xl py-2 flex items-center justify-center text-xs font-semibold text-muted-foreground hover:text-[#9c96f8] hover:bg-muted/5 transition-colors gap-1"
                    >
                      <Plus className="size-3.5" /> Thêm lựa chọn khác
                    </button>
                  )
                )}

                <div className="text-[10px] text-[#9c96f8] flex items-center justify-between pt-1 font-semibold">
                  <span>Tổng số: {totalUniqueVoters} người đã bình chọn</span>
                  {poll.anonymous && <span className="bg-muted px-2 py-0.5 rounded text-muted-foreground font-medium">Bình chọn ẩn danh</span>}
                </div>
              </div>
            )}

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
  onSubmit: (
    title: string | null,
    content: string,
    files: File[],
    scheduledDate?: string | null,
    isCompanyPost?: boolean,
    pollOptions?: string[],
    pollEndDate?: string | null,
    pollMultipleChoice?: boolean,
    pollAllowAddOptions?: boolean,
    pollAnonymous?: boolean,
    pollHideResultsBeforeVoting?: boolean,
    pollPinToTop?: boolean,
  ) => Promise<void>
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

  // Poll states
  const [showPoll, setShowPoll] = useState(false)
  const [showPollDialog, setShowPollDialog] = useState(false)
  const [pollOptions, setPollOptions] = useState<string[]>(['', ''])
  const [pollEndTime, setPollEndTime] = useState('')
  const [pollEndDatePicker, setPollEndDatePicker] = useState('')
  const [pollMultipleChoice, setPollMultipleChoice] = useState(false)
  const [pollAllowAddOptions, setPollAllowAddOptions] = useState(false)
  const [pollAnonymous, setPollAnonymous] = useState(false)
  const [pollHideResultsBeforeVoting, setPollHideResultsBeforeVoting] = useState(false)
  const [pollPinToTop, setPollPinToTop] = useState(false)

  const handleAddOption = () => {
    setPollOptions([...pollOptions, ''])
  }

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...pollOptions]
    updated[idx] = val
    setPollOptions(updated)
  }

  const handleRemoveOption = (idx: number) => {
    if (pollOptions.length <= 2) return
    setPollOptions(pollOptions.filter((_, i) => i !== idx))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    let finalPollEndDate: string | null = null
    const validPollOptions = pollOptions.filter((o) => o.trim())

    if (showPoll) {
      if (validPollOptions.length < 2) {
        alert('Vui lòng nhập ít nhất 2 lựa chọn bình chọn.')
        return
      }
      if (pollEndDatePicker) {
        finalPollEndDate = pollEndTime
          ? `${pollEndDatePicker}T${pollEndTime}:00`
          : `${pollEndDatePicker}T23:59:59`
      }
    }

    await onSubmit(
      title.trim() || null,
      content.trim(),
      files,
      scheduledDate || null,
      isCompanyPost,
      showPoll ? validPollOptions : undefined,
      showPoll ? finalPollEndDate : undefined,
      showPoll ? pollMultipleChoice : undefined,
      showPoll ? pollAllowAddOptions : undefined,
      showPoll ? pollAnonymous : undefined,
      showPoll ? pollHideResultsBeforeVoting : undefined,
      showPoll ? pollPinToTop : undefined,
    )

    setTitle('')
    setContent('')
    setFiles([])
    setScheduledDate('')
    setShowDatePicker(false)

    // Reset poll states
    setShowPoll(false)
    setShowPollDialog(false)
    setPollOptions(['', ''])
    setPollEndTime('')
    setPollEndDatePicker('')
    setPollMultipleChoice(false)
    setPollAllowAddOptions(false)
    setPollAnonymous(false)
    setPollHideResultsBeforeVoting(false)
    setPollPinToTop(false)

    if (fileRef.current) fileRef.current.value = ''
  }

  const handleSavePoll = () => {
    const validPollOptions = pollOptions.filter((o) => o.trim())
    if (validPollOptions.length < 2) {
      alert('Vui lòng nhập ít nhất 2 lựa chọn bình chọn.')
      return
    }
    setShowPoll(true)
    setShowPollDialog(false)
  }

  return (
    <Card className="border-border shadow-sm p-4 bg-card/50">
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
        <input type="file" multiple ref={fileRef} onChange={(e) => e.target.files && setFiles(Array.from(e.target.files))} className="hidden" />
        
        {/* Regular post form fields */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Avatar className="size-10 shadow-sm border border-border">
              <AvatarFallback className="bg-success/15 text-success text-sm font-semibold">{authorInitials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <input
                type="text"
                placeholder="Tiêu đề thông báo (không bắt buộc)..."
                className="w-full bg-transparent border-b border-border/40 pb-1.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-success/60"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                placeholder={placeholder ?? 'Đăng bài viết mới, chia sẻ thông báo...'}
                rows={3}
                className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              {groupName && <p className="text-[10px] text-success">Đăng vào nhóm: <strong>{groupName}</strong></p>}
            </div>
          </div>

          {showPoll && (
            <div className="border border-border/60 rounded-xl p-3 bg-[#9c96f8]/5 dark:bg-[#9c96f8]/10 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="size-4 text-[#9c96f8] shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">Bình chọn: {content || 'Chủ đề chưa nhập'}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {pollOptions.filter(o => o.trim()).length} lựa chọn • {pollMultipleChoice ? 'Chọn nhiều' : 'Chọn một'} • {pollAnonymous ? 'Ẩn danh' : 'Công khai'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowPollDialog(true)} className="h-7 text-[10px] text-[#9c96f8] hover:text-[#8982f6] font-semibold gap-1">
                  <Settings className="size-3.5" /> Thiết lập
                </Button>
                <button type="button" onClick={() => { setShowPoll(false); setPollOptions(['', '']) }} className="text-muted-foreground hover:text-destructive p-1">
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          )}

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
              <Button type="button" variant="ghost" size="sm" onClick={() => fileRef.current?.click()} className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5">
                <Paperclip className="size-3.5 text-success" /> Ảnh/File
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowPollDialog(true)} className={`text-xs h-8 gap-1.5 ${showPoll ? 'text-[#9c96f8] bg-[#9c96f8]/10' : 'text-muted-foreground hover:text-foreground'}`}>
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
        </div>

        {/* Tạo bình chọn Modal (Styled exactly like the screenshot mockup) */}
        <Dialog open={showPollDialog} onOpenChange={setShowPollDialog}>
          <DialogContent className="max-w-2xl bg-white text-slate-800 p-0 overflow-hidden rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
              <span className="text-sm font-bold text-slate-800">Tạo bình chọn</span>
              <button type="button" onClick={() => setShowPollDialog(false)} className="text-slate-400 hover:text-slate-600 font-medium text-lg">×</button>
            </div>

            <div className="grid grid-cols-12 gap-6 p-5">
              {/* Left Column: Subject & Options */}
              <div className="col-span-7 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Chủ đề bình chọn</label>
                  <div className="relative">
                    <textarea
                      placeholder="Đặt câu hỏi bình chọn"
                      maxLength={200}
                      rows={4}
                      value={content}
                      onChange={(e) => setContent(e.target.value.slice(0, 200))}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg p-3 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400 focus:bg-white resize-none"
                    />
                    <div className="absolute bottom-2.5 right-3 text-[10px] text-slate-400 font-medium">{content.length}/200</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Các lựa chọn</label>
                  <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder={`Lựa chọn ${idx + 1}`}
                          value={opt}
                          onChange={(e) => handleOptionChange(idx, e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-400"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveOption(idx)}
                            className="text-slate-400 hover:text-destructive shrink-0 p-1"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-blue-500 hover:text-blue-600 text-xs font-bold flex items-center gap-1 pt-1.5 transition-colors"
                  >
                    <Plus className="size-4" /> Thêm lựa chọn
                  </button>
                </div>
              </div>

              {/* Right Column: settings */}
              <div className="col-span-5 space-y-4 border-l border-slate-100 pl-6">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Thời hạn bình chọn</label>
                  <div className="relative flex items-center">
                    <input
                      type={pollEndDatePicker ? 'datetime-local' : 'text'}
                      value={pollEndDatePicker && pollEndTime ? `${pollEndDatePicker}T${pollEndTime}` : 'Không thời hạn'}
                      onFocus={(e) => {
                        e.target.type = 'datetime-local'
                      }}
                      onBlur={(e) => {
                        if (!e.target.value) {
                          e.target.type = 'text'
                        }
                      }}
                      onChange={(e) => {
                        if (e.target.value && e.target.value !== 'Không thời hạn') {
                          const parts = e.target.value.split('T')
                          setPollEndDatePicker(parts[0] || '')
                          setPollEndTime(parts[1] || '')
                        } else {
                          setPollEndDatePicker('')
                          setPollEndTime('')
                        }
                      }}
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-400 cursor-pointer pr-8"
                    />
                    <Calendar className="absolute right-3 size-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block border-b border-slate-100 pb-1">Thiết lập nâng cao</label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-slate-700 font-medium">Ghim lên đầu bảng tin</span>
                      <Switch checked={pollPinToTop} onCheckedChange={setPollPinToTop} />
                    </div>
                    <div className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-slate-700 font-medium flex items-center gap-1">
                        Chọn nhiều phương án <span title="Cho phép người dùng bầu chọn nhiều hơn một phương án"><HelpCircle className="size-3.5 text-slate-400" /></span>
                      </span>
                      <Switch checked={pollMultipleChoice} onCheckedChange={setPollMultipleChoice} />
                    </div>
                    <div className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-slate-700 font-medium flex items-center gap-1">
                        Có thể thêm phương án <span title="Cho phép người dùng tự nhập thêm phương án bình chọn của họ"><HelpCircle className="size-3.5 text-slate-400" /></span>
                      </span>
                      <Switch checked={pollAllowAddOptions} onCheckedChange={setPollAllowAddOptions} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block border-b border-slate-100 pb-1">Bình chọn ẩn danh</label>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-slate-700 font-medium flex items-center gap-1">
                        Ẩn kết quả khi chưa bình chọn <span title="Chỉ hiển thị kết quả sau khi người dùng đã bầu chọn hoặc khi kết thúc"><HelpCircle className="size-3.5 text-slate-400" /></span>
                      </span>
                      <Switch checked={pollHideResultsBeforeVoting} onCheckedChange={setPollHideResultsBeforeVoting} />
                    </div>
                    <div className="flex items-center justify-between text-xs py-0.5">
                      <span className="text-slate-700 font-medium flex items-center gap-1">
                        Ẩn người bình chọn <span title="Không hiển thị danh tính (avatar, họ tên) của người bình chọn"><HelpCircle className="size-3.5 text-slate-400" /></span>
                      </span>
                      <Switch checked={pollAnonymous} onCheckedChange={setPollAnonymous} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                className="border-blue-100 bg-blue-50/20 text-blue-600 hover:bg-blue-50 size-9 p-0 flex items-center justify-center rounded-lg"
              >
                <Settings className="size-4" />
              </Button>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowPollDialog(false)
                    if (!showPoll) setPollOptions(['', ''])
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-4 h-9 rounded-lg"
                >
                  Hủy
                </Button>
                <Button
                  type="button"
                  onClick={handleSavePoll}
                  className="bg-[#a0c4ff] hover:bg-[#85b3ff] text-white text-xs font-semibold px-5 h-9 rounded-lg transition-colors shadow-sm"
                >
                  Tạo bình chọn
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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

  const handleCreatePost = async (
    title: string | null,
    content: string,
    files: File[],
    scheduledDate?: string | null,
    isCompanyPost?: boolean,
    pollOptions?: string[],
    pollEndDate?: string | null,
    pollMultipleChoice?: boolean,
    pollAllowAddOptions?: boolean,
    pollAnonymous?: boolean,
  ) => {
    try {
      await createPost.mutateAsync({
        title,
        content,
        files,
        groupName: selectedGroup ?? undefined,
        scheduledPublishDate: scheduledDate,
        isCompanyPost,
        pollOptions,
        pollEndDate,
        pollMultipleChoice,
        pollAllowAddOptions,
        pollAnonymous,
      })
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
    employees: employees,
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
