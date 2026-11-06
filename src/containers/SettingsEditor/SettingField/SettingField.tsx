import { CSSProperties, MouseEvent, ReactNode } from 'react'
import clsx from 'clsx'
import { SettingFieldKind, isInlineFieldKind, isStackedFieldKind } from './SettingFieldHelpers'

export type SettingFieldProps = {
  fieldId?: string
  label?: ReactNode
  /** Override level of the value (default, studio, project, site, edit), colours the label */
  level?: string
  labelStyle?: CSSProperties
  /** Lays the field out for its kind. Leave empty for the classic layout */
  kind?: SettingFieldKind
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
  description,
  className,
  widgetClassName,
  onLabelClick,
  onContextMenu,
  children,
}: SettingFieldProps) => (
  <div
    className={clsx(
      'form-inline-field',
      kind && `setting-field-${kind}`,
      isStackedFieldKind(kind) && 'setting-field-stacked',
      isInlineFieldKind(kind) && 'setting-field-inline',
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
        <button type="button" onClick={onLabelClick} style={labelStyle}>
          {label}
        </button>
      </div>
    )}

    <div className={clsx('form-inline-field-widget', widgetClassName)}>{children}</div>
  </div>
)
