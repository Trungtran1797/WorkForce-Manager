import type { ProjectStatus } from '@/types/common'

export interface ProjectMember {
  id: number
  employeeId: number
  name: string
  role: string
  avatarColor: 'primary' | 'success' | 'warning' | 'destructive' | 'gray'
}

export interface Project {
  id: number
  code: string
  name: string
  investor: string
  startDate: string
  endDate: string
  status: ProjectStatus
  budget: number
  description: string
  progress: number
  members: ProjectMember[]
  shippingDate?: string
  isTemplate?: boolean
}

export interface ProjectTemplate {
  id: number
  code: string
  name: string
  description: string
  durationDays: number
  taskCount: number
  departmentRoles: string[]
}

export interface ProjectFormValues {
  code?: string
  name: string
  investor: string
  startDate: string
  endDate: string
  status: ProjectStatus
  budget: number
  description: string
  progress: number
  shippingDate?: string
}

export interface ProjectAttachment {
  id: number
  fileName: string
  contentType: string
  fileSizeBytes: number
  uploadedByName: string
  createdDate: string
}

export interface ProjectComment {
  id: number
  projectId: number
  content: string
  authorId: number
  authorName: string
  createdDate: string
  attachments: ProjectAttachment[]
}
