import clsx from 'clsx'
import { $Any } from '@types'
import UserImage from '@components/UserImage'
import * as Styled from './ProjectUserAccess.styled'

type Props = {
  rowData: $Any
  selected: boolean
  isUnassigned: boolean
  hovering: boolean
  showButtonsOnHover: boolean
  addButtonDisabled: boolean
  showAddMoreButton: boolean
  readOnly: boolean
  onAdd: (user?: string) => void
  onRemove?: () => void
}

export const UserColumn = ({
  rowData,
  selected = false,
  isUnassigned = false,
  hovering = false,
  showButtonsOnHover = false,
  addButtonDisabled = false,
  showAddMoreButton = false,
  readOnly,
  onAdd,
  onRemove,
}: Props) => {
  const { name, self, isMissing } = rowData
  return (
    <Styled.UserColumn className={clsx({ actionable: showButtonsOnHover, selected, hovering })}>
      {/* @ts-ignore */}
      <UserImage name={name} highlight={self} size={22} />
      <span
        style={{
          flexGrow: 1,
          color: isMissing ? 'var(--color-hl-error)' : 'inherit',
        }}
      >
        {name}
      </span>
      {!readOnly && showButtonsOnHover && (isUnassigned || showAddMoreButton) && (
        <Styled.ActionButton
          className="action"
          disabled={addButtonDisabled}
          data-tooltip={addButtonDisabled ? 'No project selected' : undefined}
          variant={isUnassigned ? 'filled' : 'text'}
          icon={'add'}
          onClick={(e) => {
            e.stopPropagation()
            // Handle click outside selection on hovering, make sure selection changes accordingly (one user selection only)
            onAdd()
          }}
        >
          {isUnassigned ? (
            <>
              Add <span className="shortcut">A</span>
            </>
          ) : (
            'Add more'
          )}
        </Styled.ActionButton>
      )}

      {!readOnly && !isUnassigned && (
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
    </Styled.UserColumn>
  )
}

export default UserColumn
