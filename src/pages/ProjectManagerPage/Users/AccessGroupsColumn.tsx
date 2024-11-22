import clsx from 'clsx'
import { $Any } from '@types'

import * as Styled from './ProjectUserAccess.styled'
import { Spacer } from '@ynput/ayon-react-components'
import { capitalizeFirstLetter } from '@helpers/string'

type Props = {
  data: $Any
  selected: boolean
  showAddButton: boolean
  hovering: boolean
  addButtonDisabled: boolean
  readOnly: boolean
  onAdd: (user?: string) => void
}

export const AccessGroupsColumn = ({
  data,
  selected = false,
  showAddButton = false,
  hovering = false,
  addButtonDisabled = false,
  readOnly,
  onAdd,
}: Props) => {
  return (
    <Styled.DataColumn className={clsx({ actionable: true, selected, hovering })}>
      {data.assignedAccessGroups.map(
        (ag: { accessGroup: string; complete: boolean }, idx: number) => (
          <span key={ag.accessGroup} className={clsx({ 'partial-match': !ag.complete })}>
            {capitalizeFirstLetter(ag.accessGroup)}
            {idx !== data.assignedAccessGroups.length - 1 ? ',' : ''}
          </span>
        ),
      )}
      <Spacer />
      {!readOnly && showAddButton && (
        <Styled.ActionButton
          className="action"
          disabled={addButtonDisabled}
          data-tooltip={addButtonDisabled ? 'No project selected' : undefined}
          variant={showAddButton ? 'filled' : 'text'}
          icon={'add'}
          onClick={(e) => {
            console.log('clicking add...')
            e.stopPropagation()
            // Handle click outside selection on hovering, make sure selection changes accordingly (one user selection only)
            onAdd()
          }}
        >
          {showAddButton && (
            <>
              Add <span className="shortcut">A</span>{' '}
            </>
          )}
        </Styled.ActionButton>
      )}
    </Styled.DataColumn>
  )
}

export default AccessGroupsColumn
