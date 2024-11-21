import clsx from 'clsx'
import { $Any } from '@types'

import * as Styled from './ProjectUserAccess.styled'

type Props = {
  data: $Any
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

export const AccessGroupsColumn = ({
  data,
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
  return (
    <Styled.UserColumn className={clsx({ actionable: showButtonsOnHover, selected, hovering })}>
      {data.assignedAccessGroups.map((ag: {accessGroup: string, complete: boolean}, idx: number) => (
        <span style={{opacity: ag.complete ? 1 : .5}}>
          {ag.accessGroup[0].toUpperCase() + ag.accessGroup.slice(1)}
          {idx !== data.assignedAccessGroups.length - 1 ? ',' : ''}
        </span>
      ))}
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

export default AccessGroupsColumn
