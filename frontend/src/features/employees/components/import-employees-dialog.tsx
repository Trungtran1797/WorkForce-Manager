import { useState, useRef } from 'react'
import { AlertCircle, CheckCircle2, Download, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useImportEmployees, useExportEmployees } from '@/features/employees/api/employee-queries'
import type { ImportEmployeesResult } from '@/features/employees/api/employee-api'

interface ImportEmployeesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ImportEmployeesDialog({ open, onOpenChange, onSuccess }: ImportEmployeesDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [result, setResult] = useState<ImportEmployeesResult | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const importMutation = useImportEmployees()
  const exportMutation = useExportEmployees()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.name.endsWith('.csv') || droppedFile.name.endsWith('.xlsx')) {
        setFile(droppedFile)
        setErrorMsg(null)
      } else {
        setErrorMsg('Vui lòng chọn file định dạng CSV hoặc Excel (.csv, .xlsx)')
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)
      setErrorMsg(null)
    }
  }

  const onButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleDownloadTemplate = async () => {
    try {
      await exportMutation.mutateAsync(true)
    } catch (err: any) {
      alert(err.message || 'Tải file mẫu thất bại.')
    }
  }

  const handleImport = async () => {
    if (!file) return
    setErrorMsg(null)
    setResult(null)

    try {
      const data = await importMutation.mutateAsync(file)
      setResult(data)
      if (data.failedCount === 0 && onSuccess) {
        onSuccess()
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Đã có lỗi xảy ra trong quá trình nhập file.')
    }
  }

  const handleClose = () => {
    setFile(null)
    setResult(null)
    setErrorMsg(null)
    onOpenChange(false)
  }

  const handleReset = () => {
    setFile(null)
    setResult(null)
    setErrorMsg(null)
  }

  return (
    <Dialog open={open} onOpenChange={(val) => { if (!val) handleClose(); else onOpenChange(true); }}>
      <DialogContent className="max-w-xl sm:max-w-2xl max-h-[85vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-blue-500" />
            Nhập danh sách nhân viên từ Excel
          </DialogTitle>
          <DialogDescription>
            Nhập hoặc cập nhật hàng loạt thông tin nhân sự sử dụng tệp tin Excel/CSV theo đúng biểu mẫu.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {/* Hướng dẫn và tải mẫu */}
          {!result && (
            <div className="rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-950/50 p-4 space-y-3">
              <h3 className="font-semibold text-sm text-blue-800 dark:text-blue-400">Hướng dẫn thực hiện:</h3>
              <ul className="text-xs text-muted-foreground list-disc pl-5 space-y-1">
                <li>Tải xuống file mẫu bên dưới để điền thông tin đúng định dạng.</li>
                <li>Các cột có dấu (*) là thông tin bắt buộc (Mã NV, Họ tên, Ngày sinh, Giới tính, Phòng ban, v.v.).</li>
                <li>Nếu <strong>Mã nhân viên</strong> đã tồn tại trong hệ thống, hệ thống sẽ thực hiện cập nhật (update) thông tin của nhân viên đó.</li>
                <li>Tên Phòng ban phải khớp chính xác với danh sách phòng ban đang hoạt động trên hệ thống.</li>
                <li>Định dạng ngày sinh & ngày vào làm: <code>yyyy-MM-dd</code> hoặc <code>dd/MM/yyyy</code>.</li>
              </ul>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-xs h-8"
                onClick={handleDownloadTemplate}
                disabled={exportMutation.isPending}
              >
                {exportMutation.isPending ? (
                  <Loader2 className="mr-1.5 size-3 animate-spin" />
                ) : (
                  <Download className="mr-1.5 size-3" />
                )}
                Tải file mẫu Excel (.csv)
              </Button>
            </div>
          )}

          {/* Form chọn file và kéo thả */}
          {!result && (
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/10'
                  : 'border-muted-foreground/20 hover:border-blue-400 hover:bg-secondary/20'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                onChange={handleFileChange}
              />

              <div className="flex size-12 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground mb-4">
                {file ? <FileSpreadsheet className="size-6 text-green-500 animate-bounce" /> : <Upload className="size-6 text-muted-foreground" />}
              </div>

              {file ? (
                <div className="text-center space-y-2">
                  <p className="font-semibold text-sm max-w-sm truncate text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive" onClick={handleReset}>
                    <X className="mr-1 size-3.5" /> Chọn file khác
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-2">
                  <p className="text-sm font-medium">Kéo thả file vào đây hoặc bấm để chọn</p>
                  <p className="text-xs text-muted-foreground">Hỗ trợ định dạng Excel (.xlsx) hoặc CSV (.csv) tối đa 10MB</p>
                  <Button variant="outline" size="sm" className="mt-2 text-xs" onClick={onButtonClick}>
                    Chọn tệp tin
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Trạng thái Loading */}
          {importMutation.isPending && (
            <div className="flex flex-col items-center justify-center p-8 space-y-3">
              <Loader2 className="size-8 text-blue-500 animate-spin" />
              <p className="text-sm font-medium">Đang xử lý dữ liệu file Excel...</p>
              <p className="text-xs text-muted-foreground">Đang kiểm tra định dạng và cập nhật cơ sở dữ liệu.</p>
            </div>
          )}

          {/* Thông báo lỗi chung */}
          {errorMsg && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 flex items-start gap-3">
              <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-semibold text-sm text-destructive">Lỗi xử lý file</h4>
                <p className="text-xs text-muted-foreground">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* Kết quả Import */}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border bg-green-50/20 dark:bg-green-950/10 p-4 border-green-500/20 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Thành công</span>
                    <CheckCircle2 className="size-4 text-green-500" />
                  </div>
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">{result.successCount} dòng</span>
                </div>

                <div className="rounded-xl border bg-red-50/20 dark:bg-red-950/10 p-4 border-red-500/20 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-medium">Lỗi dữ liệu</span>
                    <AlertCircle className="size-4 text-red-500" />
                  </div>
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">{result.failedCount} dòng</span>
                </div>
              </div>

              {/* Chi tiết lỗi */}
              {result.errors.length > 0 && (
                <div className="rounded-xl border border-muted p-4 space-y-2 bg-secondary/20">
                  <h4 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Chi tiết lỗi dòng dữ liệu:</h4>
                  <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-2">
                    {result.errors.map((err, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground bg-background p-2 rounded border">
                        <span className="size-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        <p>{err}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.failedCount === 0 && (
                <div className="rounded-xl border border-green-200/50 bg-green-500/5 p-4 text-center space-y-2">
                  <CheckCircle2 className="size-10 text-green-500 mx-auto" />
                  <h4 className="font-semibold text-sm text-green-600">Import thành công tuyệt đối!</h4>
                  <p className="text-xs text-muted-foreground">Tất cả thông tin nhân viên đã được cập nhật vào cơ sở dữ liệu hệ thống.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t gap-2 sm:gap-0">
          {result ? (
            <>
              {result.failedCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Thử lại với file khác
                </Button>
              )}
              <Button size="sm" onClick={handleClose}>
                Hoàn thành & Đóng
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleClose} disabled={importMutation.isPending}>
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={handleImport}
                disabled={!file || importMutation.isPending}
              >
                {importMutation.isPending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
                Bắt đầu nhập
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
