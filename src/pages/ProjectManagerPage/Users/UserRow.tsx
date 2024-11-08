import { Button } from '@ynput/ayon-react-components'
import UserImage from '@components/UserImage'

import styled from 'styled-components'
import clsx from 'clsx'
import { $Any } from '@types'

const StyledProfileRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
  button {
    visibility: hidden;
    .shortcut {
      padding: 4px;
      background-color: var(--md-sys-color-primary-container);
      border-radius: var(--border-radius-m);
    }
  }
  &:hover {
    button {
      visibility: visible;
    }
  }
`
type Props = {
  rowData: $Any
  selected: boolean
  isUnassigned: boolean
  showButtonsOnHover: boolean
  addButtonDisabled: boolean
  onAdd: (user?: string) => void
  onRemove?: () => void
}

export const UserRow = ({
  rowData,
  selected = false,
  isUnassigned = false,
  showButtonsOnHover = false,
  addButtonDisabled = false,
  onAdd,
  onRemove,
}: Props) => {
  const { name, self, isMissing } = rowData
  return (
    <StyledProfileRow className={clsx({ actionable: showButtonsOnHover, selected })}>
      {/* @ts-ignore */}
      <UserImage
        name={name}
        size={25}
        style={{
          transform: 'scale(0.8)',
          minHeight: 25,
          minWidth: 25,
          maxHeight: 25,
          maxWidth: 25,
        }}
        highlight={self}
      />
      <span
        style={{
          flexGrow: 1,
          color: isMissing ? 'var(--color-hl-error)' : 'inherit',
        }}
      >
        {name}
      </span>
      <Button
        className="action"
        disabled={addButtonDisabled}
        data-tooltip={addButtonDisabled ? 'No project selected' : undefined}
        variant={isUnassigned ? 'filled' : 'text'}
        icon={'add'}
        onClick={(e) => {
          e.stopPropagation()
          onAdd(rowData.name)
        }}
      >
        {isUnassigned ? (
          <>
            Add
          </>
        ) : (
          'Add more'
        )}
      </Button>

      {!isUnassigned && (
        <Button
          className="action"
          icon={'remove'}
          variant="filled"
          onClick={(e) => {
            e.stopPropagation()
            onRemove!()
          }}
        >
          Remove
        </Button>
      )}
    </StyledProfileRow>
  )
}

export default UserRow
