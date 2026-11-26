import { CSSProperties, MouseEvent, ReactNode } from 'react'
import clsx from 'clsx'
import { SettingFieldKind, isInlineFieldKind } from './SettingFieldHelpers'

export type SettingFieldProps = {
  fieldId?: string
  label?: ReactNode
  /** Override level of the value (default, studio, project, site, edit), colours the label */
  level?: string
  labelStyle?: CSSProperties
  /** Lays the field out for its kind. Leave empty for the classic layout */
  kind?: SettingFieldKind
  /** With a kind: the control on its label's line, whatever the kind (an empty list's button) */
  inline?: boolean
  description?: string
  className?: string
  widgetClassName?: string
  onLabelClick?: () => void
  onContextMenu?: (e: MouseEvent) => void
  children?: ReactNode
}

/**
 * One setting: its label and its control. With a kind, the flat layout sizes and
 * places the control from it: fixed-size controls (switches, numbers, colours,
 * choice buttons) and dropdowns sit at the end of the label's line, every other
 * label sits above.
 */
export const SettingField = ({
  fieldId,
  label,
  level = 'default',
  labelStyle,
  kind,
  inline = false,
  description,
  className,
  widgetClassName,
  onLabelClick,
  onContextMenu,
  children,
}: SettingFieldProps) => {
  const isInline = !!kind && (inline || isInlineFieldKind(kind))
  return (
    <div
      className={clsx(
        'form-inline-field',
        kind && `setting-field-${kind}`,
        kind && !isInline && 'setting-field-stacked',
        isInline && 'setting-field-inline',
        className,
      )}
      data-fieldid={fieldId}
      onContextMenu={onContextMenu}
      data-tooltip={description}
      data-tooltip-delay={300}
      data-tooltip-as="markdown"
      data-tooltip-position="mouse"
    >
      {label && (
        <div className={`form-inline-field-label ${level}`}>
          {/* a span, as in the classic markup: e2e tests take a field's first button as its control */}
          <span onClick={onLabelClick} style={labelStyle}>
            {/* classic layout: the text itself, so a wrapped label hugs it (SettingsEditor.sass) */}
            {kind ? label : <span className="label-text">{label}</span>}
          </span>
        </div>
      )}

      <div className={clsx('form-inline-field-widget', widgetClassName)}>{children}</div>
    </div>
  )
}
