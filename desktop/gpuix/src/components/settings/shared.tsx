import React, { type ReactNode } from 'react'
import { useBagrryStore } from '../../store/bagrry-store'
import { FONT_DISPLAY, FONT_MONO, FONT_SANS } from '../../theme'
import { Icons } from '../icons'

export function TabHeading({
  title,
  description,
}: {
  title: string
  description?: ReactNode
}) {
  const colors = useBagrryStore((s) => s.colors)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
      <text
        style={{
          fontSize: 26,
          fontFamily: FONT_DISPLAY,
          fontWeight: '600',
          color: colors.text,
          whiteSpace: 'nowrap',
        }}
      >
        {`${title}`}
      </text>
      {description && (
        <text
          style={{
            fontSize: 13,
            fontFamily: FONT_SANS,
            color: colors.textMuted,
            lineHeight: 1.4,
          }}
        >
          {typeof description === 'string' ? `${description}` : (description as any)}
        </text>
      )}
    </div>
  )
}

export function SettingsCard({
  title,
  description,
  dashed,
  danger,
  action,
  children,
  style,
}: {
  title?: string
  description?: string
  dashed?: boolean
  danger?: boolean
  action?: ReactNode
  children: ReactNode
  style?: any
}) {
  const colors = useBagrryStore((s) => s.colors)

  return (
    <div
      style={{
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: danger ? `${colors.danger}66` : colors.border,
        borderStyle: dashed ? 'dashed' : 'solid',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        marginBottom: 16,
        ...style,
      }}
    >
      {(title || action) && (
        <div
          style={{
            paddingLeft: 16,
            paddingRight: 16,
            paddingTop: 14,
            paddingBottom: description ? 6 : 12,
            borderBottomWidth: 1,
            borderColor: colors.border,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {title && (
              <text
                style={{
                  fontSize: 13,
                  fontWeight: '600',
                  color: danger ? colors.danger : colors.text,
                  fontFamily: FONT_SANS,
                  whiteSpace: 'nowrap',
                }}
              >
                {`${title}`}
              </text>
            )}
            {description && (
              <text
                style={{
                  fontSize: 11.5,
                  color: colors.textSubtle,
                  fontFamily: FONT_SANS,
                }}
              >
                {`${description}`}
              </text>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  )
}

export function SettingRow({
  icon,
  title,
  description,
  control,
  onClick,
  testId,
}: {
  icon?: ReactNode
  title: string
  description?: ReactNode
  control?: ReactNode
  onClick?: () => void
  testId?: string
}) {
  const colors = useBagrryStore((s) => s.colors)

  return (
    <div
      testId={testId}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderColor: colors.border,
        cursor: onClick ? 'pointer' : 'default',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 12, flexGrow: 1, minWidth: 0 }}>
        {icon && (
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              backgroundColor: colors.surface2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flexGrow: 1 }}>
          <text
            style={{
              fontSize: 13,
              fontWeight: '500',
              color: colors.text,
              fontFamily: FONT_SANS,
              whiteSpace: 'nowrap',
            }}
          >
            {`${title}`}
          </text>
          {description && (
            <text
              style={{
                fontSize: 11.5,
                color: colors.textSubtle,
                fontFamily: FONT_SANS,
              }}
            >
              {typeof description === 'string' ? `${description}` : (description as any)}
            </text>
          )}
        </div>
      </div>
      {control && <div style={{ flexShrink: 0 }}>{control}</div>}
    </div>
  )
}

export function SettingsField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  const colors = useBagrryStore((s) => s.colors)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingLeft: 16,
        paddingRight: 16,
        paddingTop: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderColor: colors.border,
        gap: 16,
      }}
    >
      <div style={{ width: 140, flexShrink: 0, paddingTop: 6 }}>
        <text
          style={{
            fontSize: 13,
            color: colors.text,
            fontFamily: FONT_SANS,
            whiteSpace: 'nowrap',
          }}
        >
          {`${label}`}
        </text>
      </div>
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {children}
        {hint && (
          <text
            style={{
              fontSize: 11,
              color: colors.textSubtle,
              fontFamily: FONT_SANS,
            }}
          >
            {`${hint}`}
          </text>
        )}
      </div>
    </div>
  )
}

export function Switch({
  checked,
  onCheckedChange,
  testId,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  testId?: string
}) {
  const colors = useBagrryStore((s) => s.colors)

  return (
    <div
      testId={testId}
      onClick={() => onCheckedChange(!checked)}
      style={{
        width: 36,
        height: 20,
        borderRadius: 10,
        backgroundColor: checked ? colors.accent : colors.surface2,
        borderWidth: 1,
        borderColor: checked ? colors.accent : colors.borderStrong,
        display: 'flex',
        alignItems: 'center',
        justifyContent: checked ? 'flex-end' : 'flex-start',
        paddingLeft: 2,
        paddingRight: 2,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: 7,
          backgroundColor: checked ? colors.accentFg : colors.textSubtle,
        }}
      />
    </div>
  )
}

export function Badge({
  tone = 'neutral',
  children,
}: {
  tone?: 'accent' | 'success' | 'neutral' | 'danger'
  children: ReactNode
}) {
  const colors = useBagrryStore((s) => s.colors)

  let bg = colors.surface2
  let fg = colors.textMuted
  let border = colors.border

  if (tone === 'accent') {
    bg = colors.accentSubtle
    fg = colors.accent
    border = `${colors.accent}40`
  } else if (tone === 'success') {
    bg = '#7bd88f22'
    fg = '#7bd88f'
    border = '#7bd88f44'
  } else if (tone === 'danger') {
    bg = `${colors.danger}22`
    fg = colors.danger
    border = `${colors.danger}44`
  }

  return (
    <div
      style={{
        paddingLeft: 7,
        paddingRight: 7,
        paddingTop: 2,
        paddingBottom: 2,
        borderRadius: 5,
        backgroundColor: bg,
        borderWidth: 1,
        borderColor: border,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <text
        style={{
          fontSize: 11,
          fontWeight: '500',
          fontFamily: FONT_SANS,
          color: fg,
          whiteSpace: 'nowrap',
        }}
      >
        {typeof children === 'string' ? `${children}` : (children as any)}
      </text>
    </div>
  )
}

export function AccentLink({
  children,
  onClick,
  testId,
}: {
  children: ReactNode
  onClick?: () => void
  testId?: string
}) {
  const colors = useBagrryStore((s) => s.colors)

  return (
    <div testId={testId} onClick={onClick} style={{ cursor: 'pointer' }}>
      <text
        style={{
          fontSize: 12.5,
          fontWeight: '500',
          color: colors.accent,
          fontFamily: FONT_SANS,
          whiteSpace: 'nowrap',
        }}
      >
        {typeof children === 'string' ? `${children}` : (children as any)}
      </text>
    </div>
  )
}

export function QuietInput({
  value,
  onChange,
  placeholder,
  testId,
  fontMono,
  style,
}: {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  testId?: string
  fontMono?: boolean
  style?: any
}) {
  const colors = useBagrryStore((s) => s.colors)

  return (
    <input
      testId={testId}
      value={value}
      placeholder={placeholder}
      onChange={(e: any) => onChange(e.value ?? '')}
      style={{
        height: 32,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.borderStrong,
        backgroundColor: 'transparent',
        paddingLeft: 10,
        paddingRight: 10,
        fontSize: 13,
        color: colors.text,
        fontFamily: fontMono ? FONT_MONO : FONT_SANS,
        ...style,
      }}
    />
  )
}

export function ActionButton({
  children,
  onClick,
  variant = 'outline',
  danger,
  disabled,
  testId,
  style,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'solid' | 'accent' | 'outline' | 'ghost'
  danger?: boolean
  disabled?: boolean
  testId?: string
  style?: any
}) {
  const colors = useBagrryStore((s) => s.colors)

  let bg = 'transparent'
  let fg = colors.text
  let border = colors.borderStrong

  if (variant === 'solid') {
    bg = colors.solid
    fg = colors.solidFg
    border = colors.solid
  } else if (variant === 'accent') {
    bg = colors.accent
    fg = colors.accentFg
    border = colors.accent
  } else if (variant === 'outline') {
    bg = colors.surface2
    fg = colors.text
    border = colors.borderStrong
  }

  if (danger) {
    fg = colors.danger
    border = `${colors.danger}66`
  }

  if (disabled) {
    fg = colors.textSubtle
    border = colors.border
    bg = colors.surface
  }

  return (
    <div
      testId={testId}
      onClick={disabled ? undefined : onClick}
      style={{
        paddingLeft: 12,
        paddingRight: 12,
        height: 30,
        borderRadius: 6,
        backgroundColor: bg,
        borderWidth: variant === 'ghost' ? 0 : 1,
        borderColor: border,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        gap: 6,
        ...style,
      }}
    >
      <text
        style={{
          fontSize: 12.5,
          fontWeight: '500',
          color: fg,
          fontFamily: FONT_SANS,
          whiteSpace: 'nowrap',
        }}
      >
        {typeof children === 'string' ? `${children}` : (children as any)}
      </text>
    </div>
  )
}

export function OptionPillGroup<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (val: T) => void
}) {
  const colors = useBagrryStore((s) => s.colors)

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const isSelected = opt.value === value
        return (
          <div
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              paddingLeft: 10,
              paddingRight: 10,
              paddingTop: 4,
              paddingBottom: 4,
              borderRadius: 6,
              backgroundColor: isSelected ? colors.surface2 : 'transparent',
              borderWidth: 1,
              borderColor: isSelected ? colors.accent : colors.border,
              cursor: 'pointer',
            }}
          >
            <text
              style={{
                fontSize: 12,
                fontWeight: isSelected ? '600' : '400',
                color: isSelected ? colors.text : colors.textMuted,
                fontFamily: FONT_SANS,
                whiteSpace: 'nowrap',
              }}
            >
              {`${opt.label}`}
            </text>
          </div>
        )
      })}
    </div>
  )
}
