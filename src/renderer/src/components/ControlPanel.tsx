import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/contexts/ThemeContext'
import { cn } from '@/lib/utils'
import { Mic, MicOff, Settings, X } from 'lucide-react'
import React, { useEffect, useState } from 'react'

interface ControlPanelProps {
  onAskQuestion: (question: string) => void
  isRecording: boolean
  onToggleRecording: () => void
  onOpenSettings: () => void
  isSettingsOpen?: boolean
  className?: string
  attachedScreenshotsCount?: number
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  // @ts-ignore - keeping for future use when input form is re-enabled
  onAskQuestion,
  isRecording,
  onToggleRecording,
  onOpenSettings,
  isSettingsOpen = false,
  className,
  attachedScreenshotsCount = 0
}) => {
  const [recordingTime, setRecordingTime] = useState(0)
  const { effectiveTheme } = useTheme()

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } else {
      setRecordingTime(0)
    }
    return () => clearInterval(interval)
  }, [isRecording])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div
      className={cn(
        'acrylic-panel',
        'rounded-lg py-3 px-4 panel-transition',
        'relative z-10',
        isRecording && 'streaming',
        className
      )}
      onMouseEnter={() => window.electronAPI.setClickThrough(false)}
      onMouseLeave={() => window.electronAPI.setClickThrough(true)}
    >
      <div className="flex items-center justify-between relative z-20">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            title="Interview"
            onClick={onToggleRecording}
            className={cn(
              'h-8 w-8 rounded-full transition-all duration-200 relative z-20',
              isRecording
                ? effectiveTheme === 'dark'
                  ? 'bg-red-700 hover:bg-red-600 text-red-100'
                  : 'bg-red-600 hover:bg-red-500 text-white'
                : effectiveTheme === 'dark'
                  ? 'bg-blue-700 hover:bg-blue-600 text-blue-100'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
            )}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
          </Button>
          {isRecording && (
            <Badge
              variant="destructive"
              className={cn(
                'border-0 text-zinc-500 text-sm font-normal ', //animate-pulse
                effectiveTheme === 'dark' ? 'text-white/80' : 'text-zinc-500'
              )}
            >
              {formatTime(recordingTime)}
            </Badge>
          )}
          {attachedScreenshotsCount > 0 && (
            <Badge
              variant="secondary"
              className={cn(
                'border-0 text-sm font-normal',
                effectiveTheme === 'dark' ? 'text-blue-300 bg-blue-900/30' : 'text-blue-600 bg-blue-100/50'
              )}
            >
              📸 {attachedScreenshotsCount}
            </Badge>
          )}
        </div>
        <div className="flex items-center justify-end flex-1 gap-3">
          <div className="flex items-center gap-1">
            <Badge
              variant="secondary"
              className={cn(
                'border-0 py-1 text-sm font-normal',
                effectiveTheme === 'dark' ? ' text-white/90' : 'text-zinc-600'
              )}
            >
              Ask AI
            </Badge>
            <kbd
              className={cn(
                'px-2 py-1 rounded text-xs',
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
          </div>

          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={cn(
                'border-0 py-1 text-sm font-normal',
                effectiveTheme === 'dark' ? ' text-white/70' : ' text-zinc-600'
              )}
            >
              Show/Hide
            </Badge>
            <kbd
              className={cn(
                'px-2 py-1 rounded text-xs',
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
              \
            </kbd>
          </div>
          <div className="flex items-center justify-end gap-2 ">
            {/* bg-zinc-500/10 rounded-full p-1 */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              className={cn(
                'h-8 w-8 relative z-20 rounded-full border zinc-border transition-all duration-300 ease-in-out group',
                'hover:scale-105',
                isSettingsOpen
                  ? effectiveTheme === 'dark'
                    ? 'text-zinc-400 bg-zinc-500/20 border-zinc-400/40'
                    : 'text-zinc-600 bg-zinc-100/60 border-zinc-300/50'
                  : effectiveTheme === 'dark'
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-zinc-600 hover:text-zinc-800 hover:bg-white/30'
              )}
              title="Settings"
            >
              <Settings
                size={16}
                className={cn(
                  'transition-transform duration-500 ease-in-out',
                  'group-hover:rotate-90',
                  isSettingsOpen && 'rotate-250'
                )}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.close()}
              className={cn(
                'h-8 w-8 relative z-20 rounded-full border zinc-border transition-all duration-300 ease-in-out group',
                'hover:scale-105',
                effectiveTheme === 'dark'
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-zinc-600 hover:text-zinc-800 hover:bg-white/30'
              )}
              title="Close App"
            >
              <X
                size={16}
                className={cn(
                  'transition-transform duration-500 ease-in-out',
                  'group-hover:rotate-90'
                )}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* <form onSubmit={handleSubmit} className="flex gap-2 relative z-20">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask AI about what you see..."
          className={cn(
            'flex-1 border backdrop-blur-sm',
            effectiveTheme === 'dark'
              ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40'
              : 'bg-white/60 border-gray-300/60 text-gray-900 placeholder:text-gray-500 focus:border-gray-400/60'
          )}
        />
        <Button
          type="submit"
          disabled={!question.trim()}
          className={cn(
            'transition-all duration-200',
            effectiveTheme === 'dark'
              ? 'bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white'
              : 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white'
          )}
        >
          Ask
        </Button>
      </form> */}
    </div>
  )
}
