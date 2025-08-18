import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { useConfig } from '@/contexts/ConfigContext'
import { useTheme } from '@/contexts/ThemeContext'
import { extractTextFromPdf } from '@/lib/pdfTextExtract'
import { cn } from '@/lib/utils'
import { AIService } from '@renderer/services/aiService'
import { ExternalLink, FileText, Moon, Palette, Plus, RotateCcw, Sun, X } from 'lucide-react'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import remarkGfm from 'remark-gfm'

interface SettingsPanelProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose, className }) => {
  const {
    config,
    updateConfig,
    updateOpacity,
    selectMode,
    getSelectedMode,
    resetConfig,
    selectInterviewProfile,
    getSelectedInterviewProfile,
    updateResumeAnalysis
  } = useConfig() as any
  const { theme, setTheme, effectiveTheme } = useTheme()

  // Local state for smooth opacity updates
  const [localOpacity, setLocalOpacity] = useState(config.opacity)
  const debouncedUpdateRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [resumeUploading, setResumeUploading] = useState(false)
  const [resumeError, setResumeError] = useState<string | null>(null)

  // Sync local state with config changes (e.g., from other sources)
  useEffect(() => {
    setLocalOpacity(config.opacity)
  }, [config.opacity])

  // Cleanup debounced update on unmount
  useEffect(() => {
    return () => {
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current)
      }
    }
  }, [])

  if (!isOpen) return null

  const selectedMode = getSelectedMode()
  const selectedInterviewProfile = getSelectedInterviewProfile()

  // Debounced function to update config
  const debouncedUpdateConfig = useCallback(
    (opacity: number) => {
      if (debouncedUpdateRef.current) {
        clearTimeout(debouncedUpdateRef.current)
      }

      debouncedUpdateRef.current = setTimeout(() => {
        updateOpacity(opacity)
      }, 2000) // 150ms delay for debouncing
    },
    [updateOpacity]
  )

  const handleOpacityChange = (values: number[]) => {
    const opacity = Math.round(Math.max(10, Math.min(100, values[0])))

    // Update local state immediately for smooth UI
    setLocalOpacity(opacity)

    // Apply opacity to CSS immediately for visual feedback
    const root = document.documentElement
    root.style.setProperty('--app-opacity', (opacity / 100).toString())

    // Debounce the actual config update
    debouncedUpdateConfig(opacity)
  }

  const handleOpacityInputChange = (value: string) => {
    const numValue = parseFloat(value)
    if (isNaN(numValue)) return

    const opacity = Math.round(Math.max(10, Math.min(100, numValue)))

    // Update local state immediately
    setLocalOpacity(opacity)

    // Apply opacity to CSS immediately
    const root = document.documentElement
    root.style.setProperty('--app-opacity', (opacity / 100).toString())

    // Update config immediately for input changes (less frequent)
    updateOpacity(opacity)
  }

  const handleThemeToggle = () => {
    const themes = ['light', 'dark', 'system'] as const
    const currentIndex = themes.indexOf(theme)
    const nextTheme = themes[(currentIndex + 1) % themes.length]
    setTheme(nextTheme)
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun size={16} />
      case 'dark':
        return <Moon size={16} />
      case 'system':
        return <Palette size={16} />
    }
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light'
      case 'dark':
        return 'Dark'
      case 'system':
        return 'System'
    }
  }

  // PDF upload handler
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setResumeError(null)
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setResumeError('Please upload a PDF file.')
      return
    }
    setResumeUploading(true)
    try {
      // Extract text from PDF
      const resumeText = await extractTextFromPdf(file)
      if (!resumeText || resumeText.length < 20) {
        setResumeError('Could not extract text from PDF. Please check your file.')
        setResumeUploading(false)
        return
      }
      const aiService = new AIService(config)
      const summary = await aiService.analyzeResumePdf(resumeText)
      await updateResumeAnalysis(summary)
    } catch (err: any) {
      setResumeError('Failed to analyze resume. Please try again.')
    } finally {
      setResumeUploading(false)
    }
  }

  return (
    <div
      className={cn(
        'acrylic-panel',
        'rounded-lg transition-all duration-200',
        'min-w-[400px] max-w-[500px]',
        className
      )}
      onMouseEnter={() => window.electronAPI.setClickThrough(false)}
      onMouseLeave={() => window.electronAPI.setClickThrough(true)}
    >
      {/* Header */}
      <div className={cn('flex items-center justify-between p-4 border-b border-zinc-500/10')}>
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className={cn(effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-700', 'text-md')}
          >
            Settings
          </Badge>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className={cn(
            'h-8 w-8',
            effectiveTheme === 'dark'
              ? 'text-white/70 hover:text-white hover:bg-white/10'
              : 'text-zinc-600 hover:text-zinc-800 hover:bg-white/30'
          )}
        >
          <X size={14} />
        </Button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-2 max-h-[500px] overflow-y-auto">
        {/* Resume Upload */}
        <div className="border-b border-zinc-500/10 flex flex-col gap-2">
          <label
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
            )}
          >
            {config.resumeAnalysis ? 'Replace Your Resume (PDF)' : 'Upload Your Resume (PDF)'}
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={handleResumeUpload}
            disabled={resumeUploading}
            className="text-xs bg-white/10 border border-zinc-500/20 rounded p-2 file:border-0 file:bg-zinc-500 file:text-white file:rounded file:px-3 file:py-1.5 hover:file:bg-zinc-700 transition-colors duration-200"
          />
          {resumeUploading && (
            <div className="text-xs text-green-500 animate-pulse">Processing, please wait...</div>
          )}
          {resumeError && <div className="text-xs text-red-500">{resumeError}</div>}
          {config.resumeAnalysis && (
            <div
              className={cn(
                'text-xs p-2 rounded bg-green-100/60 mt-2',
                effectiveTheme === 'dark' ? 'bg-green-900/30 text-green-200' : 'text-green-800'
              )}
            >
              <details>
                <summary className="cursor-pointer font-semibold mb-1 select-none">
                  Uploaded
                </summary>
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
                  {config.resumeAnalysis}
                </ReactMarkdown>
              </details>
            </div>
          )}
        </div>
        {/* Theme Settings */}
        <div className="space-y-3">
          <h3
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
            )}
          >
            Theme
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleThemeToggle}
              className={cn(
                'flex items-center gap-2',
                effectiveTheme === 'dark'
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-white/30 text-zinc-700 hover:bg-gray-200'
              )}
            >
              {getThemeIcon()}
              {getThemeLabel()}
            </Button>
            <Badge
              variant="secondary"
              className={cn(
                'text-xs border-0 p-2',
                effectiveTheme === 'dark'
                  ? 'bg-white/10 text-white/70'
                  : 'bg-white/30 text-zinc-600'
              )}
            >
              Ctrl+T
            </Badge>
          </div>
        </div>

        {/* Opacity Settings */}
        <div className="space-y-3">
          <h3
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
            )}
          >
            Panel Opacity ({localOpacity}%)
          </h3>
          <div className="flex items-center gap-3">
            <Slider
              value={[localOpacity]}
              onValueChange={handleOpacityChange}
              min={10}
              max={100}
              step={1}
              className={cn(
                'flex-1',
                '[&_[data-slot=slider-track]]:bg-zinc-500/20',
                '[&_[data-slot=slider-range]]:bg-blue-500',
                '[&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:border-blue-500',
                effectiveTheme === 'dark'
                  ? '[&_[data-slot=slider-track]]:bg-white/20 [&_[data-slot=slider-thumb]]:bg-white'
                  : '[&_[data-slot=slider-track]]:bg-zinc-500/20 [&_[data-slot=slider-thumb]]:bg-white'
              )}
            />
            <Input
              type="number"
              min={10}
              max={100}
              step={1}
              value={localOpacity}
              onChange={(e) => handleOpacityInputChange(e.target.value)}
              className={cn(
                'w-16 border-zinc-500/10',
                effectiveTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-white/20 text-zinc-800'
              )}
            />
          </div>
        </div>

        {/* AI Modes */}
        <div className="space-y-3">
          <h3
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
            )}
          >
            Manual Modes
          </h3>
          <div className="grid grid-cols-5 gap-1.5">
            {config.modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => selectMode(mode.id)}
                className={cn(
                  'p-1.5 rounded border border-zinc-500/10 text-xs transition-all duration-200',
                  'flex flex-col items-center gap-0.5 hover:scale-105 min-h-[50px]',
                  selectedMode?.id === mode.id
                    ? effectiveTheme === 'dark'
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                      : 'bg-blue-500/20 border-blue-400/50 text-blue-700'
                    : effectiveTheme === 'dark'
                      ? 'bg-white/5 text-white/70 hover:bg-white/10'
                      : 'bg-white/20 text-zinc-600 hover:bg-white/40'
                )}
              >
                <span className="text-xs">{mode.icon}</span>
                <span className="font-medium text-[10px] leading-tight">{mode.name}</span>
              </button>
            ))}
            {/* Add Mode Button */}
            <button
              onClick={() => window.electronAPI.config.openConfigFile()}
              className={cn(
                'p-1.5 rounded border border-zinc-500/10 text-xs transition-all duration-200',
                'flex flex-col items-center justify-center gap-0.5 hover:scale-105 min-h-[50px]',
                'border-dashed',
                effectiveTheme === 'dark'
                  ? 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 border-dashed border-2 border-white/50'
                  : 'bg-white/10 text-zinc-400 hover:bg-white/30 hover:text-zinc-500 border-dashed border-2 border-zinc-500'
              )}
              title="Edit modes in config file"
            >
              <Plus size={15} />
              <span className="font-medium text-[10px] leading-tight">Custom</span>
            </button>
          </div>
          <div
            className={cn(
              'p-3 rounded border border-zinc-500/10 text-xs max-h-32 overflow-y-auto',
              effectiveTheme === 'dark' ? 'bg-white/5 text-white/70' : 'bg-white/30 text-zinc-600'
            )}
          >
            <div className="font-medium mb-2 text-xs">Current Mode:</div>
            <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
              {selectedMode?.prompt || 'No mode selected'}
            </pre>
          </div>
        </div>

        {/* Interview Profiles */}
        <div className="space-y-3">
          <h3
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
            )}
          >
            Interview Modes
          </h3>
          <div className="grid grid-cols-3 gap-1.5">
            {config.interviewProfiles?.map((profile) => (
              <button
                key={profile.id}
                onClick={() => selectInterviewProfile(profile.id)}
                className={cn(
                  'p-1.5 rounded border border-zinc-500/10 text-xs transition-all duration-200',
                  'flex flex-col items-center gap-0.5 hover:scale-105 min-h-[50px]',
                  config.selectedInterviewProfileId === profile.id
                    ? effectiveTheme === 'dark'
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                      : 'bg-blue-500/20 border-blue-400/50 text-blue-700'
                    : effectiveTheme === 'dark'
                      ? 'bg-white/5 text-white/70 hover:bg-white/10'
                      : 'bg-white/20 text-zinc-600 hover:bg-white/40'
                )}
              >
                <span className="text-xs">{profile.icon}</span>
                <span className="font-medium text-[10px] leading-tight">{profile.name}</span>
              </button>
            ))}
            {/* Add Interview Profile Button */}
            <button
              onClick={() => window.electronAPI.config.openConfigFile()}
              className={cn(
                'p-1.5 rounded border border-zinc-500/10 text-xs transition-all duration-200',
                'flex flex-col items-center justify-center gap-0.5 hover:scale-105 min-h-[50px]',
                'border-dashed',
                effectiveTheme === 'dark'
                  ? 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60 border-dashed border-2 border-white/50'
                  : 'bg-white/10 text-zinc-400 hover:bg-white/30 hover:text-zinc-500 border-dashed border-2 border-zinc-500'
              )}
              title="Add Interview Mode"
            >
              <Plus size={15} />
              <span className="font-medium text-[10px] leading-tight">Custom</span>
            </button>
          </div>
          <div
            className={cn(
              'p-3 rounded border border-zinc-500/10 text-xs max-h-32 overflow-y-auto',
              effectiveTheme === 'dark' ? 'bg-white/5 text-white/70' : 'bg-white/30 text-zinc-600'
            )}
          >
            <div className="font-medium mb-2 text-xs">Current Mode:</div>
            <pre className="text-xs leading-relaxed whitespace-pre-wrap font-sans">
              {selectedInterviewProfile?.prompt || 'No mode selected'}
            </pre>
          </div>
        </div>

        {/* Configuration */}
        <div className="space-y-3">
          <h3
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
            )}
          >
            Configuration
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'text-xs px-2 py-1 rounded',
                  config.apiKey.length > 0
                    ? effectiveTheme === 'dark'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-green-500/20 text-green-700'
                    : effectiveTheme === 'dark'
                      ? 'bg-red-500/20 text-red-300'
                      : 'bg-red-500/20 text-red-700'
                )}
              >
                {config.apiKey.length > 0 ? '✓ API Key Set' : '⚠ No API Key'}
              </div>
              <Button
                variant="ghost"
                size="icon"
                title="Refresh Config"
                onClick={async () => {
                  setLoadingConfig(true)
                  await window.electronAPI.config.reload()
                  const loadedConfig = await window.electronAPI.config.get()
                  await updateConfig(loadedConfig)
                  setLoadingConfig(false)
                }}
                className={cn(
                  'p-1 h-6 w-6',
                  effectiveTheme === 'dark'
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-white/30 text-zinc-700 hover:bg-gray-200'
                )}
                disabled={loadingConfig}
              >
                {loadingConfig ? (
                  <span className="animate-spin">
                    <RotateCcw size={14} />
                  </span>
                ) : (
                  <RotateCcw size={14} />
                )}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.electronAPI.config.openConfigFile()}
                className={cn(
                  'flex items-center gap-2 justify-start',
                  effectiveTheme === 'dark'
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-zinc-600 hover:text-zinc-800 hover:bg-white/30'
                )}
              >
                <FileText size={14} />
                Edit Config File
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.electronAPI.config.openConfigFolder()}
                className={cn(
                  'flex items-center gap-2 justify-start',
                  effectiveTheme === 'dark'
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-zinc-600 hover:text-zinc-800 hover:bg-white/30'
                )}
              >
                <ExternalLink size={14} />
                Open Config Folder
              </Button>
            </div>

            <p
              className={cn(
                'text-xs',
                effectiveTheme === 'dark' ? 'text-white/60' : 'text-zinc-600'
              )}
            >
              Edit the config file to set your Google API key and customize AI modes. Get your API
              key from{' '}
              <a
                href="https://makersuite.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'underline hover:no-underline',
                  effectiveTheme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                )}
              >
                Google AI Studio
              </a>
            </p>
          </div>
        </div>

        {/* AI Model Settings */}
        <div className="space-y-3">
          <h3
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
            )}
          >
            AI Model
          </h3>
          <select
            value={config.aiModel}
            onChange={(e) => updateConfig({ aiModel: e.target.value })}
            className={cn(
              'w-full p-2 rounded border border-zinc-500/10 text-sm',
              effectiveTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-white/20 text-zinc-800'
            )}
          >
            <option value="gemini-2.5-pro">Gemini 2.5 Pro (default)</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
            <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
          </select>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="space-y-3">
          <h3
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
            )}
          >
            Keyboard Shortcuts
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-gray-600')}>
                Show/Hide App
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs border-0',
                  effectiveTheme === 'dark'
                    ? 'bg-white/10 text-white/70'
                    : 'bg-white/30 text-zinc-600'
                )}
              >
                Ctrl+\
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-gray-600')}>
                Take Screenshot & Send
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs border-0',
                  effectiveTheme === 'dark'
                    ? 'bg-white/10 text-white/70'
                    : 'bg-white/30 text-zinc-600'
                )}
              >
                Ctrl+Enter
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-gray-600')}>
                Attach Screenshot
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs border-0',
                  effectiveTheme === 'dark'
                    ? 'bg-white/10 text-white/70'
                    : 'bg-white/30 text-zinc-600'
                )}
              >
                Ctrl+Space
              </Badge>
            </div>
            <div className="text-xs text-center mt-2 opacity-60">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/50' : 'text-gray-500')}>
                Up to 5 screenshots can be attached
              </span>
            </div>
            <div className="flex justify-between">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-gray-600')}>
                Toggle Interview Mode
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs border-0',
                  effectiveTheme === 'dark'
                    ? 'bg-white/10 text-white/70'
                    : 'bg-white/30 text-zinc-600'
                )}
              >
                Ctrl+]
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-gray-600')}>
                Scroll Chat Up
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs border-0',
                  effectiveTheme === 'dark'
                    ? 'bg-white/10 text-white/70'
                    : 'bg-white/30 text-zinc-600'
                )}
              >
                Ctrl+PageUp
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-gray-600')}>
                Scroll Chat Down
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs border-0',
                  effectiveTheme === 'dark'
                    ? 'bg-white/10 text-white/70'
                    : 'bg-white/30 text-zinc-600'
                )}
              >
                Ctrl+PageDown
              </Badge>
            </div>
            <div className="text-xs text-center mt-2 opacity-60">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/50' : 'text-gray-500')}>
                Alternative: Ctrl+Shift+↑/↓
              </span>
            </div>
            <div className="flex justify-between">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-gray-600')}>
                Toggle Theme
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs border-0',
                  effectiveTheme === 'dark'
                    ? 'bg-white/10 text-white/70'
                    : 'bg-white/30 text-zinc-600'
                )}
              >
                Ctrl+T
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className={cn(effectiveTheme === 'dark' ? 'text-white/70' : 'text-gray-600')}>
                Close App
              </span>
              <Badge
                variant="secondary"
                className={cn(
                  'text-xs border-0',
                  effectiveTheme === 'dark'
                    ? 'bg-white/10 text-white/70'
                    : 'bg-white/30 text-zinc-600'
                )}
              >
                Ctrl+Q
              </Badge>
            </div>
          </div>
        </div>

        {/* Interview Mode Settings */}
        <div className="space-y-3">
          <h3
            className={cn(
              'text-sm font-medium',
              effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
            )}
          >
            Interview Mode Settings
          </h3>

          <div
            className={cn(
              'p-3 rounded border border-zinc-500/20 bg-blue-500/10 text-xs',
              effectiveTheme === 'dark' ? 'text-blue-200' : 'text-blue-700'
            )}
          >
            💡 <strong>Interview Mode:</strong> Click the microphone button to start live AI
            assistance with real-time transcription and responses.
          </div>

          {/* Screenshot Interval */}
          <div className="space-y-2">
            <label
              className={cn(
                'text-sm',
                effectiveTheme === 'dark' ? 'text-white/70' : 'text-zinc-600'
              )}
            >
              Screenshot Interval (seconds)
            </label>
            <select
              value={config.interviewMode?.screenshotInterval || 5}
              onChange={(e) =>
                updateConfig({
                  interviewMode: {
                    ...config.interviewMode,
                    screenshotInterval: parseInt(e.target.value)
                  }
                })
              }
              className={cn(
                'w-full p-2 rounded border border-zinc-500/10 text-sm',
                effectiveTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-white/20 text-zinc-800'
              )}
            >
              <option value={0}>Manual Only</option>
              <option value={3}>3 seconds</option>
              <option value={5}>5 seconds</option>
              <option value={10}>10 seconds</option>
              <option value={15}>15 seconds</option>
              <option value={30}>30 seconds</option>
            </select>
          </div>

          {/* Screenshot Quality */}
          <div className="space-y-2">
            <label
              className={cn(
                'text-sm',
                effectiveTheme === 'dark' ? 'text-white/70' : 'text-zinc-600'
              )}
            >
              Screenshot Quality
            </label>
            <select
              value={config.interviewMode?.screenshotQuality || 'medium'}
              onChange={(e) =>
                updateConfig({
                  interviewMode: {
                    ...config.interviewMode,
                    screenshotQuality: e.target.value as 'low' | 'medium' | 'high'
                  }
                })
              }
              className={cn(
                'w-full p-2 rounded border border-zinc-500/10 text-sm',
                effectiveTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-white/20 text-zinc-800'
              )}
            >
              <option value="low">Low (640x480)</option>
              <option value="medium">Medium (1280x720)</option>
              <option value="high">High (1920x1080)</option>
            </select>
          </div>

          {/* Language Setting */}
          <div className="space-y-2">
            <label
              className={cn(
                'text-sm',
                effectiveTheme === 'dark' ? 'text-white/70' : 'text-zinc-600'
              )}
            >
              Voice Recognition Language
            </label>
            <select
              value={config.interviewMode?.language || 'en-US'}
              onChange={(e) =>
                updateConfig({
                  interviewMode: {
                    ...config.interviewMode,
                    language: e.target.value
                  }
                })
              }
              className={cn(
                'w-full p-2 rounded border border-zinc-500/10 text-sm',
                effectiveTheme === 'dark' ? 'bg-white/10 text-white' : 'bg-white/20 text-zinc-800'
              )}
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
              <option value="it-IT">Italian</option>
              <option value="pt-BR">Portuguese (Brazil)</option>
              <option value="zh-CN">Chinese (Simplified)</option>
              <option value="ja-JP">Japanese</option>
              <option value="ko-KR">Korean</option>
            </select>
          </div>

          {/* Tools Settings */}
          <div className="space-y-3">
            <h3
              className={cn(
                'text-sm font-medium',
                effectiveTheme === 'dark' ? 'text-white' : 'text-zinc-800'
              )}
            >
              Tools
            </h3>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="google-search-tool"
                checked={config.tools?.includes('google-search')}
                onChange={(e) => {
                  const enabled = e.target.checked
                  const newTools = enabled
                    ? Array.from(new Set([...(config.tools || []), 'google-search']))
                    : (config.tools || []).filter((t) => t !== 'google-search')
                  updateConfig({ tools: newTools })
                }}
                className="accent-blue-500 w-4 h-4"
              />
              <label
                htmlFor="google-search-tool"
                className={cn(
                  'text-sm',
                  effectiveTheme === 'dark' ? 'text-white/80' : 'text-zinc-700'
                )}
              >
                Enable Google Search Tool
              </label>
            </div>
            <div
              className={cn(
                'text-xs',
                effectiveTheme === 'dark' ? 'text-white/60' : 'text-zinc-600'
              )}
            >
              Allow the AI to use Google Search for real-time answers.
            </div>
          </div>
        </div>

        {/* Reset Settings */}
        <div className="pt-4 border-t border-zinc-500/10 space-y-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              localStorage.removeItem('onboarding-completed')
              window.location.reload()
            }}
            className={cn(
              'flex items-center gap-2 w-full',
              effectiveTheme === 'dark'
                ? 'text-blue-400 hover:bg-blue-500/20'
                : 'text-blue-600 hover:bg-blue-500/20'
            )}
          >
            <Palette size={14} />
            Reset Onboarding
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetConfig}
            className={cn(
              'flex items-center gap-2 w-full',
              effectiveTheme === 'dark'
                ? 'text-red-400 hover:bg-red-500/20'
                : 'text-red-600 hover:bg-red-500/20'
            )}
          >
            <RotateCcw size={14} />
            Reset to Defaults
          </Button>
        </div>
      </div>
    </div>
  )
}
