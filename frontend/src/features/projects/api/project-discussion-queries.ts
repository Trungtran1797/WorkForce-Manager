import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  addProjectComment,
  deleteProjectAttachment,
  deleteProjectComment,
  getProjectComments,
} from '@/features/projects/api/project-discussion-api'

const PROJECT_COMMENTS_KEY = ['project-comments'] as const

export function useProjectComments(projectId: number, pageNumber: number, pageSize: number) {
  return useQuery({
    queryKey: [...PROJECT_COMMENTS_KEY, projectId, pageNumber, pageSize],
    queryFn: () => getProjectComments(projectId, pageNumber, pageSize),
    enabled: Number.isFinite(projectId) && projectId > 0,
  })
}

export function useAddProjectComment(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ content, files }: { content: string; files: File[] }) =>
      addProjectComment(projectId, content, files),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...PROJECT_COMMENTS_KEY, projectId] }),
  })
}

export function useDeleteProjectComment(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: number) => deleteProjectComment(projectId, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...PROJECT_COMMENTS_KEY, projectId] }),
  })
}

export function useDeleteProjectAttachment(projectId: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (attachmentId: number) => deleteProjectAttachment(projectId, attachmentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...PROJECT_COMMENTS_KEY, projectId] }),
  })
}

export { downloadProjectAttachment } from '@/features/projects/api/project-discussion-api'
