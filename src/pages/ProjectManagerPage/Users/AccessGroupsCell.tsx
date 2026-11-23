import clsx from 'clsx'
import { Fragment } from 'react'
import { $Any } from '@types'

import * as Styled from './ProjectUserAccess.styled'
import { Spacer } from '@ynput/ayon-react-components'

type Props = {
  data: $Any
  selected: boolean
  addButtonDisabled: boolean
  readOnly: boolean
  onAdd: (user: string) => void
}

export const AccessGroupsCell = ({
  data,
  selected = false,
  addButtonDisabled = false,
  readOnly,
  onAdd,
}: Props) => {
  return (
    <Styled.DataColumn className={clsx({ actionable: true, selected })}>
      {/* one run of text, so the names are apart by ", " and not by the gap of the row */}
      <span className="access-groups">
        {data.assignedAccessGroups.map(
          (ag: { accessGroup: string; complete: boolean }, idx: number) => (
            <Fragment key={ag.accessGroup}>
              {idx > 0 && ', '}
              <span className={clsx({ 'partial-match': !ag.complete })}>{ag.accessGroup}</span>
            </Fragment>
          ),
        )}
      </span>
      <Spacer />
      {!readOnly && (
        <Styled.ActionButton
          className="action"
          disabled={addButtonDisabled}
          data-tooltip={addButtonDisabled ? 'No project selected' : undefined}
          variant="filled"
          icon={'add'}
          onClick={(e) => {
            e.stopPropagation()
            onAdd(data.name)
          }}
        >
          <>
            Add <span className="shortcut">A</span>
          </>
        </Styled.ActionButton>
      )}
    </Styled.DataColumn>
  )
}

export default AccessGroupsCell
