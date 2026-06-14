import { tokenStore } from '@/lib/api-client'

const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5244/api/v1'

export async function downloadReport(reportId: string, format: 'excel' | 'pdf'): Promise<void> {
  const token = tokenStore.getAccess()
  const headers: Record<string, string> = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}/reports/${reportId}/export?format=${format}`, {
    method: 'GET',
    headers,
  })

  if (!response.ok) {
    throw new Error(`Tải báo cáo thất bại (${response.status})`)
  }

  // Get filename from Content-Disposition header
  const disposition = response.headers.get('content-disposition')
  let fileName = `baocao_${reportId}.${format === 'excel' ? 'csv' : 'html'}`
  if (disposition) {
    const filenameRegex = /filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i
    const matches = filenameRegex.exec(disposition)
    if (matches && matches[1]) {
      fileName = decodeURIComponent(matches[1])
    }
  }

  const blob = await response.blob()
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}
