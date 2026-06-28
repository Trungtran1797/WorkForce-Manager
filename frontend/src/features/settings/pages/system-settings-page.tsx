import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FolderOpen, Save, CheckCircle2, AlertCircle, Info, RefreshCw, Sparkles, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { getSystemSettings, updateSystemSetting, SystemSettingDto } from '@/features/settings/api/system-settings-api'

const SETTING_LABELS: Record<string, { label: string; hint: string }> = {
  OneDriveProjectsBasePath: {
    label: 'Đường dẫn thư mục dự án',
    hint: 'Ví dụ: C:\\Users\\TenNguoiDung\\OneDrive\\TenCongTy\\07 - Du An',
  },
}

export function SystemSettingsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: settings, isLoading, isError } = useQuery({
    queryKey: ['system-settings'],
    queryFn: getSystemSettings,
  })

  const mutation = useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      updateSystemSetting(key, value),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
      toast({ title: 'Đã lưu', description: 'Cài đặt hệ thống đã được cập nhật.' })
    },
    onError: () => {
      toast({ title: 'Lỗi', description: 'Không thể lưu cài đặt. Vui lòng thử lại.', variant: 'destructive' })
    },
  })

  if (isLoading) return <SystemSettingsSkeleton />

  if (isError) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader />
        <Card>
          <CardContent className="flex items-center gap-3 py-8 text-destructive">
            <AlertCircle className="size-5" />
            <span>Không thể tải cài đặt hệ thống. Vui lòng thử lại.</span>
          </CardContent>
        </Card>
      </div>
    )
  }

  const oneDriveSetting = settings?.find((s) => s.key === 'OneDriveProjectsBasePath')

  return (
    <div className="flex flex-col gap-6">
      <PageHeader />

      {/* AI Configuration */}
      <AiSettingCard
        settings={settings}
        queryClient={queryClient}
      />

      {/* OneDrive Folder Settings */}
      <FolderSettingCard
        setting={oneDriveSetting}
        saving={mutation.isPending && mutation.variables?.key === 'OneDriveProjectsBasePath'}
        onSave={(value) => mutation.mutate({ key: 'OneDriveProjectsBasePath', value })}
      />

      {/* Other settings */}
      {settings
        ?.filter((s) => s.key !== 'OneDriveProjectsBasePath' && s.key !== 'AiProvider' && s.key !== 'AiModel' && s.key !== 'AiApiKey')
        .map((s) => (
          <GenericSettingCard
            key={s.key}
            setting={s}
            saving={mutation.isPending && mutation.variables?.key === s.key}
            onSave={(value) => mutation.mutate({ key: s.key, value })}
          />
        ))}
    </div>
  )
}

function PageHeader() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Cài đặt hệ thống</h1>
      <p className="text-muted-foreground text-sm mt-1">
        Cấu hình các thông số hoạt động của hệ thống. Thay đổi có hiệu lực ngay, không cần khởi động lại.
      </p>
    </div>
  )
}

interface FolderSettingCardProps {
  setting: { key: string; value: string; updatedDate: string; updatedBy: string | null } | undefined
  saving: boolean
  onSave: (value: string) => void
}

function FolderSettingCard({ setting, saving, onSave }: FolderSettingCardProps) {
  const [value, setValue] = useState(setting?.value ?? '')
  const hasValue = value.trim().length > 0
  const isDirty = value !== (setting?.value ?? '')

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <FolderOpen className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Thư mục OneDrive / Ổ đĩa chia sẻ</CardTitle>
            <CardDescription>
              Thư mục gốc để tự động tạo cấu trúc thư mục dự án và đồng bộ file đính kèm
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="onedrive-path">
            {SETTING_LABELS['OneDriveProjectsBasePath']?.label ?? 'Đường dẫn'}
          </Label>
          <div className="flex gap-2">
            <Input
              id="onedrive-path"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={SETTING_LABELS['OneDriveProjectsBasePath']?.hint}
              className="font-mono text-sm"
            />
            <Button
              onClick={() => onSave(value)}
              disabled={saving || !isDirty}
              className="shrink-0"
            >
              {saving ? (
                <RefreshCw className="size-4 animate-spin mr-2" />
              ) : (
                <Save className="size-4 mr-2" />
              )}
              Lưu
            </Button>
          </div>

          {/* Path status indicator */}
          {hasValue ? (
            <p className="flex items-center gap-1.5 text-xs text-success">
              <CheckCircle2 className="size-3.5" />
              Đường dẫn đã được cấu hình
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="size-3.5" />
              Để trống nếu không dùng tính năng đồng bộ thư mục
            </p>
          )}
        </div>

        <div className="rounded-lg border bg-muted/40 p-3 space-y-1.5 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Cách thức hoạt động</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Khi tạo dự án mới → tự động tạo cấu trúc 6 thư mục con theo chuẩn SAIGON SPICES</li>
            <li>Khi thêm thư mục <code className="bg-muted px-1 rounded">DA00X - Tên</code> vào đây → tự động tạo bản ghi dự án trong hệ thống</li>
            <li>File đính kèm dự án được lưu vào <code className="bg-muted px-1 rounded">03 - Tai Lieu Thuc Hien\Dinh Kem</code></li>
          </ul>
        </div>

        {setting?.updatedBy && (
          <p className="text-xs text-muted-foreground">
            Cập nhật lần cuối bởi <span className="font-medium">{setting.updatedBy}</span>{' '}
            vào {new Date(setting.updatedDate).toLocaleString('vi-VN')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

interface GenericSettingCardProps {
  setting: { key: string; value: string; description: string | null; updatedDate: string; updatedBy: string | null }
  saving: boolean
  onSave: (value: string) => void
}

function GenericSettingCard({ setting, saving, onSave }: GenericSettingCardProps) {
  const [value, setValue] = useState(setting.value)
  const isDirty = value !== setting.value

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-mono">{setting.key}</CardTitle>
          <Badge variant="outline" className="text-xs">Cài đặt hệ thống</Badge>
        </div>
        {setting.description && (
          <CardDescription>{setting.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="font-mono text-sm"
          />
          <Button
            onClick={() => onSave(value)}
            disabled={saving || !isDirty}
            className="shrink-0"
          >
            {saving ? <RefreshCw className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
            Lưu
          </Button>
        </div>
        {setting.updatedBy && (
          <p className="text-xs text-muted-foreground">
            Cập nhật bởi <span className="font-medium">{setting.updatedBy}</span>{' '}
            — {new Date(setting.updatedDate).toLocaleString('vi-VN')}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function SystemSettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96 mt-2" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-4 w-80" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

interface AiSettingCardProps {
  settings: SystemSettingDto[] | undefined
  queryClient: any
}

function AiSettingCard({ settings, queryClient }: AiSettingCardProps) {
  const { toast } = useToast()
  const dbProvider = settings?.find(s => s.key === 'AiProvider')?.value ?? 'Gemini'
  const dbModel = settings?.find(s => s.key === 'AiModel')?.value ?? 'gemini-2.5-flash'
  const dbApiKey = settings?.find(s => s.key === 'AiApiKey')?.value ?? ''

  const [provider, setProvider] = useState(dbProvider)
  const [model, setModel] = useState(dbModel)
  const [apiKey, setApiKey] = useState(dbApiKey)
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)

  // Sync state if db values change
  useEffect(() => {
    setProvider(dbProvider)
    setModel(dbModel)
    setApiKey(dbApiKey)
  }, [dbProvider, dbModel, dbApiKey])

  const hasApiKeySaved = dbApiKey === '••••••••••••'
  const isDirty = provider !== dbProvider || model !== dbModel || (apiKey !== dbApiKey && apiKey !== '')

  const handleSave = async () => {
    setSaving(true)
    try {
      await Promise.all([
        updateSystemSetting('AiProvider', provider),
        updateSystemSetting('AiModel', model),
        ...(apiKey && apiKey !== '••••••••••••' ? [updateSystemSetting('AiApiKey', apiKey)] : [])
      ])
      queryClient.invalidateQueries({ queryKey: ['system-settings'] })
      toast({ title: 'Đã lưu', description: 'Cấu hình AI hệ thống đã được cập nhật.' })
    } catch {
      toast({ title: 'Lỗi', description: 'Không thể lưu cấu hình AI. Vui lòng thử lại.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
            <Sparkles className="size-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Trí tuệ Nhân tạo (AI) Hệ thống</CardTitle>
            <CardDescription>
              Cấu hình nhà cung cấp dịch vụ AI dùng chung cho toàn bộ người dùng trong hệ thống.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="ai-provider" className="text-xs font-semibold">Nhà cung cấp (Provider)</Label>
            <select
              id="ai-provider"
              value={provider}
              onChange={(e) => {
                const prov = e.target.value
                setProvider(prov)
                setModel(prov === 'OpenAI' ? 'gpt-4o' : 'gemini-2.5-flash')
              }}
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="Gemini">Gemini (Google AI Studio)</option>
              <option value="OpenAI">OpenAI (ChatGPT)</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ai-model" className="text-xs font-semibold">Mẫu (Model)</Label>
            <Input
              id="ai-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder={provider === 'OpenAI' ? 'gpt-4o' : 'gemini-2.5-flash'}
              className="text-xs h-9"
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ai-apikey" className="text-xs font-semibold flex items-center gap-1.5">
            AI API Key {hasApiKeySaved && <span className="text-success text-[10px]">(Đã lưu)</span>}
          </Label>
          <div className="relative">
            <Input
              id="ai-apikey"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={hasApiKeySaved ? '••••••••••••' : 'Nhập API Key để kích hoạt AI hệ thống'}
              className="text-xs h-9 pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSave}
            disabled={saving || !isDirty}
            size="sm"
          >
            {saving ? <RefreshCw className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
            Lưu cấu hình AI
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
