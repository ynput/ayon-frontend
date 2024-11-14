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
      font-size: 11px;
      line-height: 16px;
      font-weight: 700;
      padding: 1px 4px;
      vertical-align: middle;
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
const StyledButton = styled(Button)`
  padding: 0;
  &.hasIcon {
    padding: 2px 4px;
  }
  .icon {
    height: 20px;
    width: 20px;
  }
`

type Props = {
  rowData: $Any
  selected: boolean
  isUnassigned: boolean
  showButtonsOnHover: boolean
  addButtonDisabled: boolean
  showAddMoreButton: boolean
  readOnly: boolean
  onAdd: (user?: string) => void
  onRemove?: () => void
}

export const UserRow = ({
  rowData,
  selected = false,
  isUnassigned = false,
  showButtonsOnHover = false,
  addButtonDisabled = false,
  showAddMoreButton = false,
  readOnly,
  onAdd,
  onRemove,
}: Props) => {
  const { name, self, isMissing } = rowData
  return (
    <StyledProfileRow className={clsx({ actionable: showButtonsOnHover, selected })}>
      {/* @ts-ignore */}
      <UserImage name={name} highlight={self} />
      <span
        style={{
          flexGrow: 1,
          color: isMissing ? 'var(--color-hl-error)' : 'inherit',
        }}
      >
        {name}
      </span>
      {!readOnly && (isUnassigned || showAddMoreButton) && (
        <StyledButton
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
              Add <span className="shortcut">A</span>
            </>
          ) : (
            'Add more'
          )}
        </StyledButton>
      )}

      {!readOnly && !isUnassigned && (
        <StyledButton
          className="action"
          icon={'remove'}
          variant="filled"
          onClick={(e) => {
            e.stopPropagation()
            onRemove!()
          }}
        >
          Remove <span className="shortcut">R</span>
        </StyledButton>
      )}
    </StyledProfileRow>
  )
}

export default UserRow
