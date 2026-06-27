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
  authorAvatarUrl?: string
  title?: string
  content: string
  createdDate: string
  likes: number[]
  attachments: WallAttachment[]
  comments: WallComment[]
  isApproved: boolean
  isRejected: boolean
  isCompanyPost: boolean
  groupName?: string
  scheduledPublishDate?: string
  poll?: WallPoll
}

export interface PollOptionVote {
  option: string
  votedUserIds: number[]
}

export interface WallPoll {
  options: string[]
  votes: PollOptionVote[]
  endDate?: string
  multipleChoice: boolean
  allowAddOptions: boolean
  anonymous: boolean
  hideResultsBeforeVoting: boolean
  pinToTop: boolean
}

export interface WallGroup {
  name: string
  description?: string
  createdBy?: string
  createdDate: string
  postCount: number
}
