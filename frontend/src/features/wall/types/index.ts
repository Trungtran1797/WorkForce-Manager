export interface WallAttachment {
  fileName: string
  storedPath: string
  fileSizeBytes: number
  contentType: string
}

export interface WallComment {
  id: number
  authorId: number
  authorName: string
  authorPosition?: string
  content: string
  createdDate: string
}

export interface WallPost {
  id: number
  authorId: number
  authorName: string
  authorPosition?: string
  authorDepartment?: string
  title?: string
  content: string
  createdDate: string
  likes: number[]
  attachments: WallAttachment[]
  comments: WallComment[]
}
