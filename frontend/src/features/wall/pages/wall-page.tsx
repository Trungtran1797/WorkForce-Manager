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
  Volume2,
  Users,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  FolderLock,
  Plus,
  Compass,
  AlertCircle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/features/auth/context/auth-context'
import { useMyProfile, useEmployees } from '@/features/employees/api/employee-queries'
import {
  useWallPosts,
  useCreateWallPost,
  useToggleWallPostLike,
  useAddWallPostComment,
  useUpdateWallPost,
  useDeleteWallPost,
} from '@/features/wall/api/wall-queries'
import { downloadWallAttachment } from '@/features/wall/api/wall-api'
import { useToast } from '@/hooks/use-toast'

export function WallPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const { data: profile } = useMyProfile()
  const { data: employeesData } = useEmployees({ pageNumber: 1, pageSize: 1000 })
  const employees = employeesData?.items ?? []
  const { data: posts = [], isLoading, isError, refetch } = useWallPosts()
  const createPost = useCreateWallPost()
  const toggleLike = useToggleWallPostLike()
  const addComment = useAddWallPostComment()
  const updatePostMutation = useUpdateWallPost()
  const deletePostMutation = useDeleteWallPost()

  // State
  const [selectedMenu, setSelectedMenu] = useState<
    'wall' | 'dashboard' | 'pending' | 'groups' | 'promotion' | 'org' | 'work-process' | 'scheduled'
  >('wall')
  const [activeGroupName, setActiveGroupName] = useState<string | null>(null)
  const [isScheduling, setIsScheduling] = useState(false)
  const [scheduledDate, setScheduledDate] = useState('')
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({})
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({})

  const [editingPostId, setEditingPostId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editFiles, setEditFiles] = useState<File[]>([])
  const [editKeptAttachments, setEditKeptAttachments] = useState<string[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const editFileInputRef = useRef<HTMLInputElement>(null)


  // Birthdays Data
  // Birthdays calculation
  const currentMonthEmployees = useMemo(() => {
    const currentMonth = new Date().getMonth()
    return employees
      .filter((emp) => {
        if (!emp.dateOfBirth) return false
        const dob = new Date(emp.dateOfBirth)
        return dob.getMonth() === currentMonth
      })
      .sort((a, b) => {
        const aDay = new Date(a.dateOfBirth).getDate()
        const bDay = new Date(b.dateOfBirth).getDate()
        return aDay - bDay
      })
  }, [employees])

  const todayEmployees = useMemo(() => {
    const today = new Date()
    const todayDay = today.getDate()
    const todayMonth = today.getMonth()
    return employees.filter((emp) => {
      if (!emp.dateOfBirth) return false
      const dob = new Date(emp.dateOfBirth)
      return dob.getDate() === todayDay && dob.getMonth() === todayMonth
    })
  }, [employees])

  // Menu list
  const menus = [
    { id: 'dashboard', label: 'Bảng tin', icon: MessageSquare },
    { id: 'wall', label: 'Tường công ty', icon: Users },
    { id: 'pending', label: 'Bài viết chờ duyệt', icon: FolderLock },
    { id: 'groups', label: 'Nhóm, thảo luận', icon: Compass },
  ]

  const extraMenus = [
    { id: 'promotion', label: 'Lộ trình thăng tiến' },
    { id: 'org', label: 'Sơ đồ tổ chức' },
    { id: 'work-process', label: 'Quá trình làm việc' },
    { id: 'scheduled', label: 'Bài viết hẹn giờ' },
  ]

  // File Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  // Handle Post Submit
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!postContent.trim()) return

    try {
      await createPost.mutateAsync({
        title: postTitle.trim() || null,
        content: postContent.trim(),
        files: selectedFiles,
      })
      setPostTitle('')
      setPostContent('')
      setSelectedFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      toast({
        title: 'Đăng bài thành công',
        description: 'Bài viết của bạn đã được đăng lên Tường công ty.',
      })
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? err.message : 'Không thể đăng bài viết.',
        variant: 'destructive',
      })
    }
  }

  // Handle Like Post
  const handleLikeToggle = async (postId: number) => {
    try {
      await toggleLike.mutateAsync(postId)
    } catch (err) {
      console.error(err)
    }
  }

  // Handle Comment Submit
  const handleCommentSubmit = async (postId: number) => {
    const content = commentInputs[postId]?.trim()
    if (!content) return

    try {
      await addComment.mutateAsync({ postId, content })
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }))
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? err.message : 'Không thể gửi bình luận.',
        variant: 'destructive',
      })
    }
  }

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setEditFiles(Array.from(e.target.files))
    }
  }

  const handleStartEdit = (post: any) => {
    setEditingPostId(post.id)
    setEditTitle(post.title || '')
    setEditContent(post.content)
    setEditKeptAttachments(post.attachments.map((a: any) => a.fileName))
    setEditFiles([])
  }

  const handleEditSubmit = async (e: React.FormEvent, postId: number) => {
    e.preventDefault()
    if (!editContent.trim()) return

    try {
      await updatePostMutation.mutateAsync({
        postId,
        title: editTitle.trim() || null,
        content: editContent.trim(),
        files: editFiles,
        keptAttachments: editKeptAttachments,
      })
      setEditingPostId(null)
      toast({
        title: 'Cập nhật thành công',
        description: 'Bài viết đã được chỉnh sửa.',
      })
    } catch (err) {
      toast({
        title: 'Lỗi',
        description: err instanceof Error ? err.message : 'Không thể cập nhật bài viết.',
        variant: 'destructive',
      })
    }
  }

  const handleDeletePost = async (postId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        await deletePostMutation.mutateAsync(postId)
        toast({
          title: 'Đã xóa',
          description: 'Bài viết đã được xóa thành công.',
        })
      } catch (err) {
        toast({
          title: 'Lỗi',
          description: err instanceof Error ? err.message : 'Không thể xóa bài viết.',
          variant: 'destructive',
        })
      }
    }
  }

  const handleDownload = async (postId: number, fileName: string) => {
    try {
      await downloadWallAttachment(postId, fileName)
    } catch (err) {
      toast({
        title: 'Lỗi tải tệp',
        description: 'Không thể tải xuống tệp đính kèm.',
        variant: 'destructive',
      })
    }
  }

  const handleCommentChange = (postId: number, val: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: val }))
  }

  const toggleExpand = (postId: number) => {
    setExpandedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }))
  }

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      {/* Upper header segment resembling 1Office mockup style */}
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
        {/* Left Column - User Info & Navigation */}
        <div className="space-y-4 lg:col-span-1">
          {/* Profile Card */}
          <Card className="overflow-hidden border-border bg-card/60 shadow-sm backdrop-blur-md">
            <div className="h-16 bg-gradient-to-r from-success/20 to-primary/20" />
            <CardContent className="relative flex flex-col items-center p-4 text-center">
              <Avatar className="absolute -top-10 size-20 border-4 border-card shadow-md">
                <AvatarImage src="" />
                <AvatarFallback className="bg-success text-success-foreground text-xl font-bold">
                  {profile?.fullName?.slice(0, 2).toUpperCase() ?? user?.username.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="mt-12 space-y-1">
                <h3 className="font-semibold text-foreground text-base">
                  {profile?.fullName ?? user?.employeeFullName ?? user?.username}
                </h3>
                <p className="text-xs text-muted-foreground font-medium">{profile?.position ?? 'Nhân viên'}</p>
                <p className="text-[11px] rounded bg-muted px-2 py-0.5 text-muted-foreground font-mono">
                  {profile?.department?.name ?? user?.departmentName ?? 'Công ty'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Menu */}
          <Card className="p-2 border-border bg-card/60 shadow-sm">
            <div className="space-y-0.5">
              {menus.map((m) => {
                const Icon = m.icon
                const isActive = selectedMenu === m.id
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMenu(m.id as any)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-success/15 text-success hover:bg-success/20'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  >
                    <Icon className="size-4" />
                    {m.label}
                  </button>
                )
              })}
              <div className="py-2">
                <Separator />
              </div>
              {extraMenus.map((em, idx) => (
                <button
                  key={idx}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-left text-xs font-normal text-muted-foreground/80 hover:bg-accent hover:text-foreground"
                >
                  <span className="size-1.5 rounded-full bg-muted-foreground/45" />
                  {em.label}
                </button>
              ))}
            </div>
          </Card>

        </div>

        {/* Center Column - Create Post & Feed */}
        <div className="space-y-4 lg:col-span-2">
          {/* Post Creator Box */}
          <Card className="border-border shadow-sm p-4 bg-card/50">
            <form onSubmit={handlePostSubmit} className="space-y-3">
              <div className="flex items-start gap-3">
                <Avatar className="size-10 shadow-sm border border-border">
                  <AvatarFallback className="bg-success text-success-foreground text-sm font-semibold">
                    {profile?.fullName?.slice(0, 2).toUpperCase() ?? user?.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <input
                    type="text"
                    placeholder="Tiêu đề thông báo (không bắt buộc)..."
                    className="w-full bg-transparent border-b border-border/40 pb-1.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-success/60"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                  />
                  <textarea
                    placeholder="Đăng bài viết mới, chia sẻ thông báo..."
                    rows={3}
                    className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                  />
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 rounded-lg bg-muted/40 p-2">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1 text-xs text-foreground">
                      <FileText className="size-3.5 text-success" />
                      <span className="truncate max-w-[150px]">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))}
                        className="text-muted-foreground hover:text-destructive text-sm"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Separator className="bg-border/30" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5"
                  >
                    <Paperclip className="size-3.5 text-success" />
                    Ảnh/File
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5"
                  >
                    <Smile className="size-3.5 text-warning" />
                    Bình chọn
                  </Button>
                </div>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!postContent.trim() || createPost.isPending}
                  className="bg-success text-success-foreground hover:bg-success/90 h-8 text-xs font-semibold px-4 rounded-md"
                >
                  {createPost.isPending ? <Loader2 className="size-3 animate-spin mr-1.5" /> : null}
                  Đăng tin
                </Button>
              </div>
            </form>
          </Card>

          {/* Loader and Error States */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
              <Loader2 className="size-8 animate-spin text-success" />
              <p className="text-sm">Đang tải bảng tin công ty...</p>
            </div>
          )}

          {isError && (
            <Card className="p-6 text-center border-border/50">
              <AlertCircle className="size-10 text-destructive mx-auto mb-3" />
              <h4 className="text-sm font-semibold mb-1">Không thể tải dữ liệu</h4>
              <p className="text-xs text-muted-foreground mb-4">Đã xảy ra lỗi kết nối với máy chủ.</p>
              <Button size="sm" onClick={() => void refetch()}>Thử lại</Button>
            </Card>
          )}

          {/* Posts Feed */}
          {!isLoading && !isError && posts.length === 0 && (
            <div className="text-center py-16 text-muted-foreground border border-dashed rounded-lg bg-card/20">
              <MessageSquare className="size-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="text-sm font-medium">Bảng tin chưa có bài viết nào</p>
              <p className="text-xs">Hãy là người đầu tiên chia sẻ thông tin hôm nay!</p>
            </div>
          )}

          {!isLoading && !isError && posts.map((post) => {
            const isLiked = user ? post.likes.includes(user.employeeId ?? 0) : false
            const isExpanded = expandedPosts[post.id] ?? false
            const commentsCount = post.comments.length

            return (
              <Card key={post.id} className="border-border shadow-sm bg-card/40 overflow-hidden hover:border-border/80 transition-colors">
                <CardContent className="p-4 space-y-3">
                  {/* Post Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-10 shadow-sm border">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {post.authorName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-foreground hover:underline cursor-pointer">
                            {post.authorName}
                          </span>
                          <span className="inline-block size-1 rounded-full bg-muted-foreground/40" />
                          <span className="text-[10px] text-success bg-success/15 px-1.5 py-0.5 rounded font-medium">
                            {post.authorDepartment || 'Tường công ty'}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {new Date(post.createdDate).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Top right edit/delete buttons */}
                    {(post.authorId === user?.employeeId || user?.role === 'SuperAdmin') && editingPostId !== post.id && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleStartEdit(post)}
                          className="text-[11px] font-semibold text-muted-foreground hover:text-success transition-colors"
                        >
                          Sửa
                        </button>
                        <span className="text-[10px] text-muted-foreground/30">|</span>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="text-[11px] font-semibold text-muted-foreground hover:text-destructive transition-colors"
                        >
                          Xóa
                        </button>
                      </div>
                    )}
                  </div>

                  {editingPostId === post.id ? (
                    <form onSubmit={(e) => handleEditSubmit(e, post.id)} className="space-y-3 pt-2">
                      <input
                        type="text"
                        className="w-full bg-transparent border-b border-border/40 pb-1.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-success/60"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Tiêu đề thông báo (không bắt buộc)..."
                      />
                      <textarea
                        rows={3}
                        className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                      />

                      {/* Existing attachments */}
                      {post.attachments && post.attachments.length > 0 && (
                        <div className="space-y-1 bg-muted/20 p-2 rounded-lg">
                          <p className="text-[10px] font-semibold text-muted-foreground">Tài liệu cũ:</p>
                          {post.attachments.map((file, fIdx) => {
                            const isKept = editKeptAttachments.includes(file.fileName)
                            return (
                              <div key={fIdx} className="flex items-center justify-between text-xs py-1">
                                <span className={`truncate max-w-[200px] ${isKept ? '' : 'line-through text-muted-foreground'}`}>{file.fileName}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (isKept) {
                                      setEditKeptAttachments(prev => prev.filter(x => x !== file.fileName))
                                    } else {
                                      setEditKeptAttachments(prev => [...prev, file.fileName])
                                    }
                                  }}
                                  className="text-xs font-medium text-success hover:underline"
                                >
                                  {isKept ? 'Gỡ bỏ' : 'Giữ lại'}
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {/* New attachments */}
                      {editFiles.length > 0 && (
                        <div className="flex flex-wrap gap-2 rounded-lg bg-muted/40 p-2">
                          {editFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 rounded-md border bg-card px-2.5 py-1 text-xs text-foreground">
                              <FileText className="size-3.5 text-success" />
                              <span className="truncate max-w-[150px]">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => setEditFiles((prev) => prev.filter((_, i) => i !== idx))}
                                className="text-muted-foreground hover:text-destructive text-sm"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1 border-t border-border/30">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            multiple
                            ref={editFileInputRef}
                            onChange={handleEditFileChange}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => editFileInputRef.current?.click()}
                            className="text-xs text-muted-foreground hover:text-foreground h-8 gap-1.5"
                          >
                            <Paperclip className="size-3.5 text-success" />
                            Ảnh/File mới
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingPostId(null)}
                            className="text-xs h-8 px-3 rounded-md"
                          >
                            Hủy
                          </Button>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={!editContent.trim() || updatePostMutation.isPending}
                            className="bg-success text-success-foreground hover:bg-success/90 h-8 text-xs font-semibold px-4 rounded-md"
                          >
                            Lưu
                          </Button>
                        </div>
                      </div>
                    </form>
                  ) : (
                    <>
                      {/* Post Content */}
                      <div className="space-y-1.5">
                        {post.title && (
                          <h3 className="text-sm font-bold text-foreground leading-snug uppercase text-success/90">
                            {post.title}
                          </h3>
                        )}
                        <div className="text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                          {isExpanded || post.content.length <= 350
                            ? post.content
                            : `${post.content.slice(0, 350)}...`}
                        </div>
                        {post.content.length > 350 && (
                          <button
                            onClick={() => toggleExpand(post.id)}
                            className="text-xs font-semibold text-success hover:underline flex items-center gap-1"
                          >
                            {isExpanded ? (
                              <>Thu gọn <ChevronUp className="size-3" /></>
                            ) : (
                              <>Xem thêm <ChevronDown className="size-3" /></>
                            )}
                          </button>
                        )}
                      </div>

                      {/* Attachments */}
                      {post.attachments && post.attachments.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          {post.attachments.map((file, fIdx) => (
                            <div key={fIdx} className="flex items-center justify-between gap-3 rounded-lg border bg-muted/30 p-2 text-xs">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="size-4 text-destructive shrink-0" />
                                <span className="font-medium text-foreground truncate max-w-[280px]">
                                  {file.fileName}
                                </span>
                                <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                                  ({(file.fileSizeBytes / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => void handleDownload(post.id, file.fileName)}
                                className="size-7 text-muted-foreground hover:text-foreground"
                              >
                                <Download className="size-4 text-success" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span>{post.likes.length} lượt thích</span>
                    <span className="size-1 rounded-full bg-muted-foreground/30" />
                    <span>{commentsCount} bình luận</span>
                  </div>

                  <Separator className="bg-border/30" />

                  {/* Post Actions */}
                  <div className="grid grid-cols-3 gap-2 py-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLikeToggle(post.id)}
                      className={`text-xs h-8 gap-2 hover:bg-accent ${isLiked ? 'text-danger font-semibold' : 'text-muted-foreground'}`}
                    >
                      <Heart className={`size-3.5 ${isLiked ? 'fill-danger text-danger' : ''}`} />
                      Thích
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 gap-2 text-muted-foreground hover:bg-accent"
                    >
                      <MessageSquare className="size-3.5" />
                      Bình luận
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8 gap-2 text-muted-foreground hover:bg-accent"
                    >
                      <Share2 className="size-3.5" />
                      Chia sẻ
                    </Button>
                  </div>

                  <Separator className="bg-border/30" />

                  {/* Comments list */}
                  {commentsCount > 0 && (
                    <div className="space-y-3 pt-2">
                      {post.comments.map((comm) => (
                        <div key={comm.id} className="flex items-start gap-2.5">
                          <Avatar className="size-7 shadow-xs">
                            <AvatarFallback className="bg-accent text-accent-foreground text-[10px] font-semibold">
                              {comm.authorName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 rounded-lg bg-muted/40 p-2 text-xs">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-semibold text-foreground">{comm.authorName}</span>
                              <span className="text-[9px] text-muted-foreground">
                                {new Date(comm.createdDate).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-foreground/90">{comm.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment Input Box */}
                  <div className="flex items-center gap-2 pt-2">
                    <Avatar className="size-7 shadow-xs">
                      <AvatarFallback className="bg-success/10 text-success text-[10px] font-semibold">
                        {profile?.fullName?.slice(0, 2).toUpperCase() ?? user?.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="relative flex-1 flex items-center rounded-lg border bg-background/50 px-2.5 py-1">
                      <input
                        type="text"
                        placeholder="Viết thảo luận..."
                        className="flex-grow bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                        value={commentInputs[post.id] ?? ''}
                        onChange={(e) => handleCommentChange(post.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCommentSubmit(post.id)
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleCommentSubmit(post.id)}
                        className="text-muted-foreground hover:text-success"
                        disabled={!commentInputs[post.id]?.trim()}
                      >
                        <Send className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Right Column - Birthdays & Company Announcements */}
        <div className="space-y-4 lg:col-span-1">
          {/* Birthdays Card */}
          <Card className="border-border bg-card/60 shadow-sm overflow-hidden">
            <div className="p-3 bg-gradient-to-r from-pink-500/10 to-orange-500/10 border-b border-border/40 flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground/80 flex items-center gap-1.5">
                <Cake className="size-3.5 text-pink-500" />
                Sinh nhật
              </h4>
            </div>
            <CardContent className="p-3 space-y-4">
              {/* Sinh nhật hôm nay */}
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold tracking-wide text-muted-foreground">Sinh nhật hôm nay</p>
                {todayEmployees.length === 0 ? (
                  <div className="text-muted-foreground text-xs italic py-1">
                    Hôm nay không có sinh nhật ai.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {todayEmployees.map((emp) => (
                      <div key={emp.id} className="flex items-center gap-2 text-xs bg-success/10 p-2 rounded-lg border border-success/20 animate-pulse">
                        <Avatar className="size-6 shadow-xs border border-success">
                          <AvatarFallback className="bg-success text-success-foreground text-[9px] font-bold">
                            {emp.fullName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
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

              {/* Sinh nhật trong tháng */}
              <div className="space-y-2 pt-2 border-t border-border/40">
                <p className="text-[10px] uppercase font-bold tracking-wide text-muted-foreground">
                  Trong tháng {new Date().getMonth() + 1} ({currentMonthEmployees.length})
                </p>
                {currentMonthEmployees.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-1">
                    Không có ai sinh nhật tháng này.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                    {currentMonthEmployees.map((emp) => {
                      const dobDate = new Date(emp.dateOfBirth)
                      const isTodayBday = dobDate.getDate() === new Date().getDate() && dobDate.getMonth() === new Date().getMonth()
                      return (
                        <div key={emp.id} className="flex items-center gap-2 text-xs hover:bg-accent/40 p-1 rounded-md transition-colors">
                          <Avatar className="size-6.5 shadow-xs border">
                            <AvatarFallback className="bg-primary/20 text-primary text-[9px] font-bold">
                              {emp.fullName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{emp.fullName}</p>
                            <p className="text-[9px] text-muted-foreground">
                              Ngày {dobDate.getDate()}/{dobDate.getMonth() + 1}
                            </p>
                          </div>
                          {isTodayBday && (
                            <span className="text-[8px] font-bold text-success animate-pulse bg-success/15 px-1.5 py-0.5 rounded">
                              Hôm nay
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
