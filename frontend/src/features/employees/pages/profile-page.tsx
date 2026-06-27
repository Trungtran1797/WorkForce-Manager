import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { Award, Briefcase, Calendar, CheckCircle2, User, Phone, MapPin, Mail, Home, Heart, Loader2 } from 'lucide-react'

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
import { useMyProfile, useUpdateMyProfile } from '@/features/employees/api/employee-queries'
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

export function ProfilePage() {
  const { toast } = useToast()
  const { data: profile, isLoading, isError, refetch } = useMyProfile()
  const updateProfileMutation = useUpdateMyProfile()

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

  // Đổ dữ liệu từ API vào Form khi tải thành công
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
      toast({
        title: 'Cập nhật thành công',
        description: 'Thông tin hồ sơ cá nhân của bạn đã được cập nhật.',
      })
      refetch()
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Cập nhật thất bại',
        description: err.message || 'Đã xảy ra lỗi trong quá trình lưu thông tin.',
      })
    }
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
        <AlertCircle className="size-10 text-destructive" />
        <h3 className="font-semibold text-lg">Không thể tải thông tin hồ sơ</h3>
        <p className="text-sm text-muted-foreground">Tài khoản này chưa được liên kết với hồ sơ nhân sự nào trên hệ thống.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
        <p className="text-sm text-muted-foreground">Xem chi tiết hồ sơ nhân sự và cập nhật thông tin liên hệ của bạn.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Cột 1: Thông tin hành chính (Read-only) */}
        <div className="md:col-span-1 space-y-6">
          <Card className="overflow-hidden">
            <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-end justify-center pb-4 relative">
              <div className="absolute -bottom-10 size-20 rounded-full border-4 border-background bg-secondary flex items-center justify-center text-secondary-foreground text-2xl font-bold shadow-md">
                {profile.fullName?.split(' ').pop()?.slice(0, 2).toUpperCase() || 'NV'}
              </div>
            </div>
            <CardHeader className="pt-12 text-center pb-4">
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
                    {/* Họ tên & Ngày sinh (Read-only để tránh sửa đổi hành chính trái phép) */}
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

function AlertCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}
