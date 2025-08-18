import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CardContent } from '@/components/ui/card'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  History,
  Maximize2,
  Mic,
  Minimize2,
  Plus,
  Trash2
} from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

interface ResponsePanelProps {
  response: string
  isLoading: boolean
  onClear: () => void
  onNewSession: () => void
  onToggleHistory: () => void
  isHistoryVisible: boolean
  className?: string
  // Interview mode props
  interviewModeStatus?: string
  interviewModeResponse?: string
  isInterviewModeEnabled?: boolean
}

export const ResponsePanel: React.FC<ResponsePanelProps> = ({
  response,
  isLoading,
  onClear,
  onNewSession,
  onToggleHistory,
  isHistoryVisible,
  className,
  interviewModeStatus,
  interviewModeResponse,
  isInterviewModeEnabled
}) => {
  const [isMinimized, setIsMinimized] = useState(false)
  const [page, setPage] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { effectiveTheme } = useTheme()

  // Scroll handler for keyboard shortcuts
  const handleScroll = (direction: 'up' | 'down') => {
    if (!scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const scrollAmount = 200 // Scroll by 200px each time
    
    if (direction === 'up') {
      container.scrollTop -= scrollAmount
    } else {
      container.scrollTop += scrollAmount
    }
  }

  // Listen for scroll chat events from main process
  useEffect(() => {
    const handleScrollChat = (_: any, direction: string) => {
      handleScroll(direction as 'up' | 'down')
    }

    window.electronAPI.onScrollChat(handleScrollChat)

    return () => {
      window.electronAPI.removeAllListeners('scroll-chat')
    }
  }, [])

  // Improved pagination logic for interviewModeResponse
  // Paginate by splitting at the nearest newline before the character limit to preserve bullet points and sentence boundaries
  const PAGE_CHAR_LIMIT = 1200
  let paginatedInterviewModeResponses: string[] = []
  if (isInterviewModeEnabled && interviewModeResponse) {
    const text = interviewModeResponse.trim()
    let start = 0
    while (start < text.length) {
      let end = Math.min(start + PAGE_CHAR_LIMIT, text.length)
      if (end < text.length) {
        // Try to find the last newline before the limit
        const lastNewline = text.lastIndexOf('\n', end)
        if (lastNewline > start) {
          end = lastNewline + 1 // include the newline
        }
      }
      paginatedInterviewModeResponses.push(text.slice(start, end))
      start = end
    }
  }

  // Always keep user on the last page if the number of pages increases
  const prevNumPagesRef = React.useRef(0)
  React.useEffect(() => {
    if (isInterviewModeEnabled && interviewModeResponse) {
      const text = interviewModeResponse.trim()
      const numPages = Math.ceil(text.length / PAGE_CHAR_LIMIT)
      if (numPages > prevNumPagesRef.current) {
        setPage(numPages - 1)
      }
      prevNumPagesRef.current = numPages
    }
  }, [interviewModeResponse, isInterviewModeEnabled])

  const handleCopy = async () => {
    const textToCopy =
      isInterviewModeEnabled && interviewModeResponse ? interviewModeResponse : response
    if (textToCopy) {
      try {
        await navigator.clipboard.writeText(textToCopy)
      } catch (error) {
        console.error('Failed to copy text:', error)
      }
    }
  }

  const hasContent = (isInterviewModeEnabled && interviewModeResponse) || response

  return (
    <div
      className={cn(
        'acrylic-panel',
        'flex flex-col',
        'rounded-lg panel-transition relative z-10',
        isLoading && 'streaming',
        className
      )}
      style={{
        height: isMinimized ? '60px' : undefined,
        minHeight: isMinimized ? '60px' : '120px',
        maxHeight: isMinimized ? undefined : '600px',
        overflow: isMinimized ? undefined : 'hidden',
        transition: 'height 0.3s ease-in-out, backdrop-filter 0.6s ease-out'
      }}
      onMouseEnter={() => window.electronAPI.setClickThrough(false)}
      onMouseLeave={() => window.electronAPI.setClickThrough(true)}
    >
      {/* Header */}
      <div
        className={cn('flex items-center justify-between py-1 px-2 bottom-border relative z-20 ')}
      >
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(
              'border-0 text-sm',
              effectiveTheme === 'dark' ? ' text-white/90' : ' text-zinc-700'
              // isLoading && 'analyzing-shimmer'
            )}
          >
            {isLoading
              ? 'Analyzing...'
              : isInterviewModeEnabled
                ? interviewModeStatus || 'Interview Mode'
                : 'AI Response'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Pagination widget in header, only for interview mode with multiple pages */}
          {isInterviewModeEnabled && paginatedInterviewModeResponses.length > 1 && (
            <div className="flex items-center gap-1 ml-2">
              <button
                className={cn(
                  'px-2 py-1 rounded text-xs',
                  effectiveTheme === 'dark'
                    ? 'bg-white/15 text-white/80'
                    : 'bg-zinc-500/10 text-zinc-500',
                  'disabled:opacity-50'
                )}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {page + 1}/{paginatedInterviewModeResponses.length}
              </span>
              <button
                className={cn(
                  'px-2 py-1 rounded text-xs',
                  effectiveTheme === 'dark'
                    ? 'bg-white/15 text-white/80'
                    : 'bg-zinc-500/10 text-zinc-500',
                  'disabled:opacity-50'
                )}
                onClick={() =>
                  setPage((p) => Math.min(paginatedInterviewModeResponses.length - 1, p + 1))
                }
                disabled={page === paginatedInterviewModeResponses.length - 1}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewSession}
            className={cn(
              'h-8 w-8 relative z-20',
              effectiveTheme === 'dark'
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-zinc-600 hover:text-zinc-800 hover:bg-white/30'
            )}
            title="Start new conversation"
          >
            <Plus size={14} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleHistory}
            className={cn(
              'h-8 w-8 relative z-20',
              isHistoryVisible
                ? effectiveTheme === 'dark'
                  ? 'text-blue-400 bg-blue-500/20'
                  : 'text-blue-600 bg-blue-100/60'
                : effectiveTheme === 'dark'
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-zinc-600 hover:text-zinc-800 hover:bg-white/30'
            )}
            title="Toggle conversation history"
          >
            <History size={14} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleCopy}
            className={cn(
              'h-8 w-8 relative z-20',
              effectiveTheme === 'dark'
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-zinc-600 hover:text-zinc-800 hover:bg-white/30'
            )}
            disabled={!hasContent}
          >
            <Copy size={14} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className={cn(
              'h-8 w-8 relative z-20',
              effectiveTheme === 'dark'
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-zinc-600 hover:text-zinc-800 hover:bg-white/30'
            )}
            disabled={!hasContent}
          >
            <Trash2 size={14} />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(!isMinimized)}
            className={cn(
              'h-8 w-8 relative z-20',
              effectiveTheme === 'dark'
                ? 'text-white/70 hover:text-white hover:bg-white/10'
                : 'text-zinc-600 hover:text-zinc-800 hover:bg-white/30'
            )}
          >
            {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </Button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <CardContent ref={scrollContainerRef} className="p-4 flex-1 overflow-y-auto relative z-20">
          <div
            ref={contentRef}
            className={cn(
              'streaming-container prose prose-sm max-w-none',
              effectiveTheme === 'dark' ? 'prose-invert' : 'prose-gray',
              'response-scroll-area'
            )}
          >
            {isLoading && !response && !interviewModeResponse ? (
              <div className="text-center py-4 text-sm">
                <p className={cn(effectiveTheme === 'dark' ? 'text-white/50' : 'text-zinc-500')}>
                  {isInterviewModeEnabled ? (
                    <>{interviewModeStatus || 'Interview mode ready'}</>
                  ) : (
                    <>
                      Turn on the{' '}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'h-6 w-6 rounded-full transition-all duration-200 relative z-20',
                          effectiveTheme === 'dark'
                            ? 'bg-white/10 text-white/80'
                            : 'bg-zinc-500/10 text-zinc-500'
                        )}
                      >
                        <Mic size={14} className="inline-block" />{' '}
                      </Button>{' '}
                      mode or press{' '}
                      <div className="inline-block">
                        <kbd
                          className={cn(
                            'px-2 py-1 rounded text-xs mr-1',
                            effectiveTheme === 'dark'
                              ? 'bg-white/15 text-white/80'
                              : 'bg-zinc-500/10 text-zinc-500'
                          )}
                        >
                          Ctrl
                        </kbd>
                        <kbd
                          className={cn(
                            'px-2 py-1 rounded text-xs',
                            effectiveTheme === 'dark'
                              ? 'bg-white/15 text-white/80'
                              : 'bg-zinc-500/10 text-zinc-500'
                          )}
                        >
                          ↵
                        </kbd>
                      </div>{' '}
                      to go manual
                    </>
                  )}
                </p>
              </div>
            ) : interviewModeResponse && isInterviewModeEnabled ? (
              <div className="streaming-text">
                <div
                  ref={contentRef}
                  className={cn(
                    'prose prose-sm max-w-none response-content',
                    effectiveTheme === 'dark' ? 'prose-invert' : 'prose-gray',
                    interviewModeResponse && !isLoading && 'appearing'
                  )}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      code: ({ className, children, ...props }) => {
                        return (
                          <code
                            className={cn(
                              className,
                              effectiveTheme === 'dark'
                                ? 'bg-white/15 text-blue-200 px-1 rounded'
                                : 'bg-white/50 text-blue-700 px-1 rounded'
                            )}
                            {...props}
                          >
                            {children}
                          </code>
                        )
                      },
                      pre: ({ children }) => (
                        <pre
                          className={cn(
                            'p-4 rounded-lg overflow-x-auto',
                            effectiveTheme === 'dark'
                              ? 'bg-gray-800/50 border border-gray-700'
                              : 'bg-white/40 border border-white/50'
                          )}
                        >
                          {children}
                        </pre>
                      ),
                      h1: ({ children }) => (
                        <h1
                          className={cn(
                            'text-xl font-bold mb-4',
                            effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
                          )}
                        >
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2
                          className={cn(
                            'text-lg font-semibold mb-3',
                            effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
                          )}
                        >
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3
                          className={cn(
                            'text-md font-medium mb-2',
                            effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
                          )}
                        >
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p
                          className={cn(
                            'mb-3',
                            effectiveTheme === 'dark' ? 'text-white/90' : 'text-zinc-700'
                          )}
                        >
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul
                          className={cn(
                            'list-disc pl-6 mb-3',
                            effectiveTheme === 'dark' ? 'text-white/90' : 'text-zinc-700'
                          )}
                        >
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol
                          className={cn(
                            'list-decimal pl-6 mb-3',
                            effectiveTheme === 'dark' ? 'text-white/90' : 'text-zinc-700'
                          )}
                        >
                          {children}
                        </ol>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote
                          className={cn(
                            'border-l-4 pl-4 py-2 mb-3 italic',
                            effectiveTheme === 'dark'
                              ? 'border-blue-400 bg-blue-500/10 text-blue-100'
                              : 'border-blue-500 bg-blue-100/40 text-blue-800'
                          )}
                        >
                          {children}
                        </blockquote>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto mb-3">
                          <table
                            className={cn(
                              'min-w-full border-collapse',
                              effectiveTheme === 'dark'
                                ? 'border border-gray-600'
                                : 'border border-white/50'
                            )}
                          >
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th
                          className={cn(
                            'border px-4 py-2 text-left font-semibold',
                            effectiveTheme === 'dark'
                              ? 'border-gray-600 bg-gray-700 text-white'
                              : 'border-white/50 bg-white/30 text-zinc-800'
                          )}
                        >
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td
                          className={cn(
                            'border px-4 py-2',
                            effectiveTheme === 'dark'
                              ? 'border-gray-600 text-white/90'
                              : 'border-white/50 text-zinc-700'
                          )}
                        >
                          {children}
                        </td>
                      )
                    }}
                  >
                    {paginatedInterviewModeResponses[page]}
                  </ReactMarkdown>
                </div>
              </div>
            ) : response ? (
              <div className="streaming-text">
                <div
                  ref={contentRef}
                  className={cn(
                    'prose prose-sm max-w-none response-content',
                    effectiveTheme === 'dark' ? 'prose-invert' : 'prose-gray',
                    response && !isLoading && 'appearing'
                  )}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeHighlight]}
                    components={{
                      code: ({ className, children, ...props }) => {
                        return (
                          <code
                            className={cn(
                              className,
                              effectiveTheme === 'dark'
                                ? 'bg-white/15 text-blue-200 px-1 rounded'
                                : 'bg-white/50 text-blue-700 px-1 rounded'
                            )}
                            {...props}
                          >
                            {children}
                          </code>
                        )
                      },
                      pre: ({ children }) => (
                        <pre
                          className={cn(
                            'p-4 rounded-lg overflow-x-auto',
                            effectiveTheme === 'dark'
                              ? 'bg-gray-800/50 border border-gray-700'
                              : 'bg-white/40 border border-white/50'
                          )}
                        >
                          {children}
                        </pre>
                      ),
                      h1: ({ children }) => (
                        <h1
                          className={cn(
                            'text-xl font-bold mb-4',
                            effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
                          )}
                        >
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2
                          className={cn(
                            'text-lg font-semibold mb-3',
                            effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
                          )}
                        >
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3
                          className={cn(
                            'text-md font-medium mb-2',
                            effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
                          )}
                        >
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p
                          className={cn(
                            'mb-3',
                            effectiveTheme === 'dark' ? 'text-white/90' : 'text-zinc-700'
                          )}
                        >
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul
                          className={cn(
                            'list-disc pl-6 mb-3',
                            effectiveTheme === 'dark' ? 'text-white/90' : 'text-zinc-700'
                          )}
                        >
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol
                          className={cn(
                            'list-decimal pl-6 mb-3',
                            effectiveTheme === 'dark' ? 'text-white/90' : 'text-zinc-700'
                          )}
                        >
                          {children}
                        </ol>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote
                          className={cn(
                            'border-l-4 pl-4 py-2 mb-3 italic',
                            effectiveTheme === 'dark'
                              ? 'border-blue-400 bg-blue-500/10 text-blue-100'
                              : 'border-blue-500 bg-blue-100/40 text-blue-800'
                          )}
                        >
                          {children}
                        </blockquote>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto mb-3">
                          <table
                            className={cn(
                              'min-w-full border-collapse',
                              effectiveTheme === 'dark'
                                ? 'border border-gray-600'
                                : 'border border-white/50'
                            )}
                          >
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th
                          className={cn(
                            'border px-4 py-2 text-left font-semibold',
                            effectiveTheme === 'dark'
                              ? 'border-gray-600 bg-gray-700 text-white'
                              : 'border-white/50 bg-white/30 text-zinc-800'
                          )}
                        >
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td
                          className={cn(
                            'border px-4 py-2',
                            effectiveTheme === 'dark'
                              ? 'border-gray-600 text-white/90'
                              : 'border-white/50 text-zinc-700'
                          )}
                        >
                          {children}
                        </td>
                      )
                    }}
                  >
                    {response}
                  </ReactMarkdown>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-sm">
                <p className={cn(effectiveTheme === 'dark' ? 'text-white/50' : 'text-zinc-500')}>
                  Turn on the{' '}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-6 w-6 rounded-full transition-all duration-200 relative z-20',
                      effectiveTheme === 'dark'
                        ? 'bg-white/10 text-white/80'
                        : 'bg-zinc-500/10 text-zinc-500'
                    )}
                  >
                    <Mic size={14} className="inline-block" />{' '}
                  </Button>{' '}
                  mode or press{' '}
                  <div className="inline-block">
                    <kbd
                      className={cn(
                        'px-2 py-1 rounded text-xs mr-1',
                        effectiveTheme === 'dark'
                          ? 'bg-white/15 text-white/80'
                          : 'bg-zinc-500/10 text-zinc-500'
                      )}
                    >
                      Ctrl
                    </kbd>
                    <kbd
                      className={cn(
                        'px-2 py-1 rounded text-xs',
                        effectiveTheme === 'dark'
                          ? 'bg-white/15 text-white/80'
                          : 'bg-zinc-500/10 text-zinc-500'
                      )}
                    >
                      ↵
                    </kbd>
                  </div>{' '}
                  to go manual
                </p>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </div>
  )
}
