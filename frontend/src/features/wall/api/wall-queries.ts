import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getWallPosts,
  createWallPost,
  toggleWallPostLike,
  addWallPostComment,
  updateWallPost,
  deleteWallPost,
  approveWallPost,
  rejectWallPost,
  publishNowWallPost,
  getWallGroups,
  createWallGroup,
  deleteWallGroup,
  voteWallPoll,
  addWallPollOption,
} from '@/features/wall/api/wall-api'

const WALL_KEYS = {
  posts: ['wall-posts'] as const,
  companyPosts: ['wall-posts-company'] as const,
  pending: ['wall-posts-pending'] as const,
  scheduled: ['wall-posts-scheduled'] as const,
  group: (name: string) => ['wall-posts-group', name] as const,
  groups: ['wall-groups'] as const,
}

// ── Post queries ─────────────────────────────────────────────────────────

export function useWallPosts() {
  return useQuery({
    queryKey: WALL_KEYS.posts,
    queryFn: () => getWallPosts(),
  })
}

export function usePendingWallPosts() {
  return useQuery({
    queryKey: WALL_KEYS.pending,
    queryFn: () => getWallPosts({ pending: true }),
  })
}

export function useScheduledWallPosts() {
  return useQuery({
    queryKey: WALL_KEYS.scheduled,
    queryFn: () => getWallPosts({ scheduled: true }),
  })
}

export function useCompanyWallPosts() {
  return useQuery({
    queryKey: WALL_KEYS.companyPosts,
    queryFn: () => getWallPosts({ companyOnly: true }),
  })
}

export function useGroupWallPosts(groupName: string) {
  return useQuery({
    queryKey: WALL_KEYS.group(groupName),
    queryFn: () => getWallPosts({ groupName }),
    enabled: !!groupName,
  })
}

// ── Group queries ─────────────────────────────────────────────────────────

export function useWallGroups() {
  return useQuery({
    queryKey: WALL_KEYS.groups,
    queryFn: getWallGroups,
  })
}

// ── Invalidate helper ────────────────────────────────────────────────────

function useInvalidateAll() {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: WALL_KEYS.posts })
    void qc.invalidateQueries({ queryKey: WALL_KEYS.companyPosts })
    void qc.invalidateQueries({ queryKey: WALL_KEYS.pending })
    void qc.invalidateQueries({ queryKey: WALL_KEYS.scheduled })
    void qc.invalidateQueries({ queryKey: WALL_KEYS.groups })
    void qc.invalidateQueries({ queryKey: ['wall-posts-group'] })
  }
}

// ── Post mutations ────────────────────────────────────────────────────────

export function useCreateWallPost() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({
      title,
      content,
      files,
      groupName,
      scheduledPublishDate,
      isCompanyPost,
      pollOptions,
      pollEndDate,
      pollMultipleChoice,
      pollAllowAddOptions,
      pollAnonymous,
      pollHideResultsBeforeVoting,
      pollPinToTop,
    }: {
      title: string | null
      content: string
      files?: File[]
      groupName?: string | null
      scheduledPublishDate?: string | null
      isCompanyPost?: boolean
      pollOptions?: string[]
      pollEndDate?: string | null
      pollMultipleChoice?: boolean
      pollAllowAddOptions?: boolean
      pollAnonymous?: boolean
      pollHideResultsBeforeVoting?: boolean
      pollPinToTop?: boolean
    }) =>
      createWallPost(
        title,
        content,
        files,
        groupName,
        scheduledPublishDate,
        isCompanyPost,
        pollOptions,
        pollEndDate,
        pollMultipleChoice,
        pollAllowAddOptions,
        pollAnonymous,
        pollHideResultsBeforeVoting,
        pollPinToTop,
      ),
    onSuccess: invalidate,
  })
}

export function useToggleWallPostLike() {
  const invalidate = useInvalidateAll()
  return useMutation({ mutationFn: toggleWallPostLike, onSuccess: invalidate })
}

export function useAddWallPostComment() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ postId, content }: { postId: number; content: string }) =>
      addWallPostComment(postId, content),
    onSuccess: invalidate,
  })
}

export function useUpdateWallPost() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({
      postId,
      title,
      content,
      files,
      keptAttachments,
      scheduledPublishDate,
      pollOptions,
      pollEndDate,
      pollMultipleChoice,
      pollAllowAddOptions,
      pollAnonymous,
      pollHideResultsBeforeVoting,
      pollPinToTop,
    }: {
      postId: number
      title: string | null
      content: string
      files?: File[]
      keptAttachments?: string[]
      scheduledPublishDate?: string | null
      pollOptions?: string[]
      pollEndDate?: string | null
      pollMultipleChoice?: boolean
      pollAllowAddOptions?: boolean
      pollAnonymous?: boolean
      pollHideResultsBeforeVoting?: boolean
      pollPinToTop?: boolean
    }) =>
      updateWallPost(
        postId,
        title,
        content,
        files,
        keptAttachments,
        scheduledPublishDate,
        pollOptions,
        pollEndDate,
        pollMultipleChoice,
        pollAllowAddOptions,
        pollAnonymous,
        pollHideResultsBeforeVoting,
        pollPinToTop,
      ),
    onSuccess: invalidate,
  })
}

export function useDeleteWallPost() {
  const invalidate = useInvalidateAll()
  return useMutation({ mutationFn: deleteWallPost, onSuccess: invalidate })
}

export function useApproveWallPost() {
  const invalidate = useInvalidateAll()
  return useMutation({ mutationFn: approveWallPost, onSuccess: invalidate })
}

export function useRejectWallPost() {
  const invalidate = useInvalidateAll()
  return useMutation({ mutationFn: rejectWallPost, onSuccess: invalidate })
}

export function usePublishNowWallPost() {
  const invalidate = useInvalidateAll()
  return useMutation({ mutationFn: publishNowWallPost, onSuccess: invalidate })
}

// ── Group mutations ───────────────────────────────────────────────────────

export function useCreateWallGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ name, description }: { name: string; description?: string }) =>
      createWallGroup(name, description),
    onSuccess: () => void qc.invalidateQueries({ queryKey: WALL_KEYS.groups }),
  })
}

export function useDeleteWallGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteWallGroup,
    onSuccess: () => void qc.invalidateQueries({ queryKey: WALL_KEYS.groups }),
  })
}

export function useVoteWallPoll() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ postId, options }: { postId: number; options: string[] }) =>
      voteWallPoll(postId, options),
    onSuccess: invalidate,
  })
}

export function useAddWallPollOption() {
  const invalidate = useInvalidateAll()
  return useMutation({
    mutationFn: ({ postId, option }: { postId: number; option: string }) =>
      addWallPollOption(postId, option),
    onSuccess: invalidate,
  })
}
