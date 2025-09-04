import { forwardRef, ReactNode } from 'react'
import * as Styled from './ViewItem.styled'
import clsx from 'clsx'
import { getPlatformShortcutKey, KeyMode } from '@shared/util'
import { confirmDialog } from 'primereact/confirmdialog'

export interface ViewItem {
  id: string
  label: string
  startContent?: ReactNode
  endContent?: ReactNode
  isSelected?: boolean
  isEditable?: boolean
  isSaveable?: boolean // can this be saved from working view (shows little save button)
  highlighted?: 'save' | 'edit' // highlights a button
  onEdit?: (e: React.MouseEvent<HTMLButtonElement>) => void
  onSave?: (e: React.MouseEvent<HTMLButtonElement>) => void // saves the view settings from selected view
  onResetView?: (e: React.MouseEvent<HTMLButtonElement>) => void // resets working view
  onClick?: (e: React.MouseEvent<HTMLLIElement>) => void
}

export interface ViewMenuItemProps
  extends Omit<React.LiHTMLAttributes<HTMLLIElement>, 'id'>,
    ViewItem {}

export const ViewItem = forwardRef<HTMLLIElement, ViewMenuItemProps>(
  (
    {
      label,
      startContent,
      endContent,
      isSelected,
      isEditable,
      isSaveable,
      highlighted,
      onEdit,
      onSave,
      onResetView,
      className,
      ...props
    },
    ref,
  ) => {
    const handleSave = (e: React.MouseEvent<HTMLButtonElement>, requireConfirm: boolean) => {
      // prevent selecting the view when clicking save
      e.stopPropagation()
      if (requireConfirm) {
        // first validate we actually want to save by asking user to confirm
        confirmDialog({
          message: 'Save current view settings and overwrite this view?',
          header: 'Confirm save',
          accept: () => onSave && onSave(e),
        })
      } else {
        onSave && onSave(e)
      }
    }

    return (
      <Styled.ViewItem {...props} className={clsx(className, { selected: isSelected })} ref={ref}>
        {startContent && startContent}
        <span className="label">{label}</span>
        {/* Reset button (e.g., for working view) - shows if handler is provided */}
        {onResetView && (
          <Styled.ActionButton
            icon="restart_alt"
            variant="text"
            className="reset"
            onClick={onResetView}
            data-tooltip="Reset this view to default"
            data-shortcut={getPlatformShortcutKey('0', [KeyMode.Shift, KeyMode.Ctrl])}
          />
        )}
        {isEditable && isSaveable && !isSelected && (
          <Styled.ActionButton
            icon="save"
            variant="text"
            className={clsx('save', { active: highlighted === 'save' })}
            onClick={(e) => handleSave(e, highlighted !== 'save')}
            data-tooltip="Save view settings from current view"
          />
        )}
        {isEditable && onEdit && (
          <Styled.ActionButton
            variant="text"
            icon="more_horiz"
            className={clsx('more', { active: highlighted === 'edit' })}
            onClick={onEdit}
            data-tooltip="Edit view"
          />
        )}
        {endContent && endContent}
      </Styled.ViewItem>
    )
  },
)
