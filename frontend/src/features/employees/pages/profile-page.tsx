import { useEffect, useRef } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Award, Briefcase, Calendar, Camera, User, Phone, MapPin, Mail, Home, Heart, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  useMyProfile,
  useUpdateMyProfile,
  useUploadMyAvatar,
  useUploadMyCoverPhoto,
} from '@/features/employees/api/employee-queries'
import { resolveMediaUrl } from '@/features/employees/api/employee-api'
import { useToast } from '@/hooks/use-toast'
import { EmployeeStatusBadge } from '@/components/common/status-badge'
import { TableSkeleton } from '@/components/common/data-state'

const profileFormSchema = z.object({
  phoneNumber: z
    .string()
    .min(9, 'Số điện thoại phải có ít nhất 9 chữ số')
    .regex(/^\d+$/, 'Số điện thoại chỉ bao gồm chữ số'),
  email: z.string().email('Định dạng email không hợp lệ'),
  address: z.string().min(1, 'Vui lòng nhập địa chỉ liên hệ'),
  placeOfOrigin: z.string().min(1, 'Vui lòng nhập nguyên quán'),
  maritalStatus: z.enum(['Độc thân', 'Đã kết hôn', 'Khác']),
})

type ProfileFormValues = z.infer<typeof profileFormSchema>

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export function ProfilePage() {
  const { toast } = useToast()
  const { data: profile, isLoading, isError, refetch } = useMyProfile()
  const updateProfileMutation = useUpdateMyProfile()
  const uploadAvatarMutation = useUploadMyAvatar()
  const uploadCoverMutation = useUploadMyCoverPhoto()

  const avatarInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      phoneNumber: '',
      email: '',
      address: '',
      placeOfOrigin: '',
      maritalStatus: 'Độc thân',
    },
  })

  useEffect(() => {
    if (profile) {
      form.reset({
        phoneNumber: profile.phoneNumber || '',
        email: profile.email || '',
        address: profile.address || '',
        placeOfOrigin: profile.placeOfOrigin || '',
        maritalStatus: (profile.maritalStatus === 'Đã kết hôn' || profile.maritalStatus === 'Khác'
          ? profile.maritalStatus
          : 'Độc thân') as any,
      })
    }
  }, [profile, form])

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      await updateProfileMutation.mutateAsync(values)
      toast({ title: 'Cập nhật thành công', description: 'Thông tin hồ sơ cá nhân đã được lưu.' })
      refetch()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Cập nhật thất bại', description: err.message || 'Đã xảy ra lỗi.' })
    }
  }

  function validateImageFile(file: File): string | null {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return 'Chỉ chấp nhận file ảnh JPG, PNG, GIF hoặc WEBP.'
    if (file.size > MAX_IMAGE_SIZE) return 'Kích thước ảnh tối đa là 5 MB.'
    return null
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const error = validateImageFile(file)
    if (error) { toast({ variant: 'destructive', title: 'File không hợp lệ', description: error }); return }
    try {
      await uploadAvatarMutation.mutateAsync(file)
      toast({ title: 'Cập nhật ảnh đại diện thành công', description: 'Bài viết đã được đăng lên Bảng tin.' })
      refetch()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload thất bại', description: err.message || 'Đã xảy ra lỗi.' })
    }
    e.target.value = ''
  }

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const error = validateImageFile(file)
    if (error) { toast({ variant: 'destructive', title: 'File không hợp lệ', description: error }); return }
    try {
      await uploadCoverMutation.mutateAsync(file)
      toast({ title: 'Cập nhật ảnh bìa thành công', description: 'Bài viết đã được đăng lên Bảng tin.' })
      refetch()
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Upload thất bại', description: err.message || 'Đã xảy ra lỗi.' })
    }
    e.target.value = ''
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Hồ sơ cá nhân</h1>
        <TableSkeleton columns={4} rows={4} />
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border rounded-xl bg-destructive/5 border-destructive/20 space-y-3">
        <User className="size-10 text-destructive" />
        <h3 className="font-semibold text-lg">Không thể tải thông tin hồ sơ</h3>
        <p className="text-sm text-muted-foreground">Tài khoản này chưa được liên kết với hồ sơ nhân sự nào trên hệ thống.</p>
      </div>
    )
  }

  const initials = profile.fullName?.split(' ').pop()?.slice(0, 2).toUpperCase() || 'NV'
  const avatarSrc = resolveMediaUrl(profile.avatarUrl)
  const coverSrc = resolveMediaUrl(profile.coverPhotoUrl)
  const isUploadingAvatar = uploadAvatarMutation.isPending
  const isUploadingCover = uploadCoverMutation.isPending

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-sm text-muted-foreground">Xem chi tiết hồ sơ nhân sự và cập nhật thông tin liên hệ của bạn.</p>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleAvatarChange}
      />
      <input
        ref={coverInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={handleCoverChange}
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Cột 1: Thông tin hành chính + Avatar/Cover */}
        <div className="md:col-span-1 space-y-6">
          <Card className="overflow-hidden">
            {/* Cover photo */}
            <button
              type="button"
              onClick={() => !isUploadingCover && coverInputRef.current?.click()}
              className="relative w-full h-28 group focus:outline-none"
              title="Nhấn để đổi ảnh bìa"
              disabled={isUploadingCover}
            >
              {coverSrc ? (
                <img src={coverSrc} alt="Ảnh bìa" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600" />
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                {isUploadingCover
                  ? <Loader2 className="size-6 text-white animate-spin" />
                  : <Camera className="size-6 text-white" />}
                <span className="text-[11px] text-white font-medium">
                  {isUploadingCover ? 'Đang tải...' : 'Đổi ảnh bìa'}
                </span>
              </div>
            </button>

            {/* Avatar */}
            <div className="flex justify-center -mt-10 relative z-10 pb-1">
              <button
                type="button"
                onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
                className="relative group size-20 rounded-full border-4 border-background shadow-md focus:outline-none"
                title="Nhấn để đổi ảnh đại diện"
                disabled={isUploadingAvatar}
              >
                {avatarSrc ? (
                  <img src={avatarSrc} alt={profile.fullName} className="size-full object-cover rounded-full" />
                ) : (
                  <div className="size-full rounded-full bg-secondary flex items-center justify-center text-secondary-foreground text-2xl font-bold">
                    {initials}
                  </div>
                )}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity flex items-center justify-center">
                  {isUploadingAvatar
                    ? <Loader2 className="size-5 text-white animate-spin" />
                    : <Camera className="size-5 text-white" />}
                </div>
              </button>
            </div>

            <CardHeader className="pt-2 text-center pb-4">
              <CardTitle className="text-lg font-bold">{profile.fullName}</CardTitle>
              <CardDescription className="text-sm">{profile.position}</CardDescription>
              <div className="mt-2 flex justify-center">
                <EmployeeStatusBadge status={profile.status as any} />
              </div>
            </CardHeader>

            <CardContent className="border-t pt-4 space-y-4 text-sm">
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Award className="size-4 text-blue-500 shrink-0" />
                <div>
                  <span className="font-medium text-foreground block">Mã nhân viên</span>
                  {profile.employeeCode}
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Briefcase className="size-4 text-blue-500 shrink-0" />
                <div>
                  <span className="font-medium text-foreground block">Phòng ban</span>
                  {profile.departmentName || 'Chưa phân phòng'}
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-muted-foreground">
                <Calendar className="size-4 text-blue-500 shrink-0" />
                <div>
                  <span className="font-medium text-foreground block">Ngày vào làm</span>
                  {profile.hireDate}
                </div>
              </div>
            </CardContent>

            {/* Upload hints */}
            <div className="px-4 pb-4 flex gap-2">
              <button
                type="button"
                onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="flex-1 text-[11px] py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
              >
                <Camera className="size-3" />
                {isUploadingAvatar ? 'Đang tải...' : 'Đổi ảnh đại diện'}
              </button>
              <button
                type="button"
                onClick={() => !isUploadingCover && coverInputRef.current?.click()}
                disabled={isUploadingCover}
                className="flex-1 text-[11px] py-1.5 rounded-md bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
              >
                <Camera className="size-3" />
                {isUploadingCover ? 'Đang tải...' : 'Đổi ảnh bìa'}
              </button>
            </div>
          </Card>
        </div>

        {/* Cột 2 & 3: Cập nhật thông tin cá nhân */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-bold">Thông tin cá nhân & Liên hệ</CardTitle>
              <CardDescription>Các thông tin dưới đây sẽ được sử dụng cho mục đích liên hệ và quản lý nội bộ.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Giới tính</label>
                      <Input value={profile.gender === 'Male' ? 'Nam' : profile.gender === 'Female' ? 'Nữ' : 'Khác'} disabled className="bg-secondary/40" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Ngày sinh</label>
                      <Input value={profile.dateOfBirth} disabled className="bg-secondary/40" />
                    </div>

                    <FormField
                      control={form.control}
                      name="phoneNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-muted-foreground">Số điện thoại *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                              <Input {...field} className="pl-9" placeholder="Nhập số điện thoại" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-muted-foreground">Địa chỉ Email *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                              <Input {...field} className="pl-9" placeholder="Nhập email" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="placeOfOrigin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-muted-foreground">Nguyên quán *</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                              <Input {...field} className="pl-9" placeholder="Tỉnh/Thành phố quê quán" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maritalStatus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs font-semibold text-muted-foreground">Tình trạng hôn nhân *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="relative pl-9">
                                <Heart className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                                <SelectValue placeholder="Chọn tình trạng" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Độc thân">Độc thân</SelectItem>
                              <SelectItem value="Đã kết hôn">Đã kết hôn</SelectItem>
                              <SelectItem value="Khác">Khác</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs font-semibold text-muted-foreground">Địa chỉ liên hệ *</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Home className="absolute left-3 top-2.5 size-4 text-muted-foreground pointer-events-none" />
                            <Input {...field} className="pl-9" placeholder="Địa chỉ thường trú / tạm trú hiện tại" />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {profile.oneOfficeAccount && (
                    <div className="pt-2">
                      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Tài khoản liên kết 1Office</label>
                      <Input value={profile.oneOfficeAccount} disabled className="bg-secondary/40 w-full sm:w-1/2" />
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t">
                    <Button type="submit" size="sm" disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                      Lưu thay đổi
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
