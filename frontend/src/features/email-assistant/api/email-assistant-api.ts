import { apiClient } from '@/lib/api-client'
import type { UserEmailConfig, EmailMessage, ChatMessage } from '../types'

const BASE = '/email-assistant'

export const emailAssistantApi = {
  getConfig: async (): Promise<UserEmailConfig | null> => {
    return apiClient.get<UserEmailConfig | null>(`${BASE}/config`)
  },

  saveConfig: async (config: Partial<UserEmailConfig>): Promise<boolean> => {
    return apiClient.post<boolean>(`${BASE}/config`, config)
  },

  getEmails: async (query?: string, limit: number = 10): Promise<EmailMessage[]> => {
    const qs = `limit=${limit}${query ? `&query=${encodeURIComponent(query)}` : ''}`
    return apiClient.get<EmailMessage[]>(`${BASE}/emails?${qs}`)
  },

  getEmailDetail: async (id: string): Promise<EmailMessage> => {
    return apiClient.get<EmailMessage>(`${BASE}/emails/${id}`)
  },

  chat: async (messages: ChatMessage[]): Promise<string> => {
    return apiClient.post<string>(`${BASE}/chat`, { messages })
  },

  disconnectConfig: async (): Promise<boolean> => {
    return apiClient.delete<boolean>(`${BASE}/config`)
  }
}
