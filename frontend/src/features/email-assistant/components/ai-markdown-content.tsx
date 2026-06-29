import ReactMarkdown from 'react-markdown'
import type { Components } from 'react-markdown'

const markdownComponents: Components = {
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2 hover:opacity-80 font-medium break-all"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-bold">{children}</strong>,
  em: ({ children }) => <em className="italic opacity-80">{children}</em>,
  p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="list-disc list-inside space-y-0.5 my-1">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal list-inside space-y-0.5 my-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  code: ({ children }) => (
    <code className="bg-muted px-1 py-0.5 rounded text-[0.9em] font-mono">{children}</code>
  ),
}

interface AiMarkdownContentProps {
  content: string
  className?: string
}

export function AiMarkdownContent({ content, className }: AiMarkdownContentProps) {
  return (
    <div className={className}>
      <ReactMarkdown components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
