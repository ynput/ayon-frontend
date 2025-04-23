import clsx from 'clsx'
import { $Any } from '@types'
import UserImage from '@shared/UserImage'

import * as Styled from './ProjectUserAccess.styled'

type Props = {
  rowData: $Any
  selected: boolean
  hovering: boolean
  showButtonsOnHover: boolean
  addButtonDisabled: boolean
  showAddButton: boolean
  showAddMoreButton: boolean
  readOnly: boolean
  onAdd: (user: string) => void
  onRemove?: () => void
}

export const UserCell = ({
  rowData,
  selected = false,
  showAddButton = false,
  hovering = false,
  showButtonsOnHover = false,
  addButtonDisabled = false,
  showAddMoreButton = false,
  readOnly,
  onAdd,
  onRemove,
}: Props) => {
  const { attrib, name, self, isMissing } = rowData
  return (
    <Styled.DataColumn className={clsx({ actionable: showButtonsOnHover, selected, hovering })}>
      {/* @ts-ignore */}
      <UserImage name={name} highlight={self} size={22} />
      <span
        style={{
          flexGrow: 1,
          color: isMissing ? 'var(--color-hl-error)' : 'inherit',
        }}
      >
        {attrib?.fullName || name}
      </span>
      {!readOnly && showButtonsOnHover && (showAddButton || showAddMoreButton) && (
        <Styled.ActionButton
          className="action"
          disabled={addButtonDisabled}
          data-tooltip={addButtonDisabled ? 'No project selected' : undefined}
          variant={showAddButton ? 'filled' : 'text'}
          icon={'add'}
          onClick={(e) => {
            e.stopPropagation()
            // Handle click outside selection on hovering, make sure selection changes accordingly (one user selection only)
            onAdd(name)
          }}
        >
          {showAddButton ? (
            <>
              Add <span className="shortcut">A</span>
            </>
          ) : (
            'Add more'
          )}
        </Styled.ActionButton>
      )}

      {!readOnly && !showAddButton && (
        <Styled.ActionButton
          className="action"
          icon={'remove'}
          variant="filled"
          onClick={(e) => {
            e.stopPropagation()
            onRemove!()
          }}
        >
          Remove <span className="shortcut">R</span>
        </Styled.ActionButton>
      )}
    </Styled.DataColumn>
  )
}

export default UserCell
