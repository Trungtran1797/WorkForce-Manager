import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getWallPosts,
  createWallPost,
  toggleWallPostLike,
  addWallPostComment,
  updateWallPost,
  deleteWallPost,
  approveWallPost,
} from '@/features/wall/api/wall-api'

const WALL_KEYS = {
  posts: ['wall-posts'] as const,
}

export function useWallPosts() {
  return useQuery({
    queryKey: WALL_KEYS.posts,
    queryFn: getWallPosts,
  })
}

export function useCreateWallPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      title,
      content,
      files,
      groupName,
      scheduledPublishDate,
    }: {
      title: string | null
      content: string
      files?: File[]
      groupName?: string | null
      scheduledPublishDate?: string | null
    }) => createWallPost(title, content, files, groupName, scheduledPublishDate),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WALL_KEYS.posts })
    },
  })
}

export function useToggleWallPostLike() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: toggleWallPostLike,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WALL_KEYS.posts })
    },
  })
}

export function useAddWallPostComment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ postId, content }: { postId: number; content: string }) =>
      addWallPostComment(postId, content),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WALL_KEYS.posts })
    },
  })
}

export function useUpdateWallPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      postId,
      title,
      content,
      files,
      keptAttachments,
    }: {
      postId: number
      title: string | null
      content: string
      files?: File[]
      keptAttachments?: string[]
    }) => updateWallPost(postId, title, content, files, keptAttachments),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WALL_KEYS.posts })
    },
  })
}

export function useDeleteWallPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteWallPost,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WALL_KEYS.posts })
    },
  })
}

export function useApproveWallPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: approveWallPost,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: WALL_KEYS.posts })
    },
  })
}
