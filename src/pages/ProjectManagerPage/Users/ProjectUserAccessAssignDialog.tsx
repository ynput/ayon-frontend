import { useMemo, useState } from 'react'
import clsx from 'clsx'

import { FormLayout, Dialog, Button, Icon, Spacer, ShortcutTag } from '@ynput/ayon-react-components'
import { $Any } from '@types'
import Shortcuts from '@containers/Shortcuts'
import { getPlatformShortcutKey, KeyMode } from '@shared/helpers'
import { mapInitialAccessGroupStates } from './mappers'
import { AccessGroupUsers, SelectionStatus } from './types'
import * as Styled from './ProjectUserAccessAssignDialog.styled'
import { ProjectUserData } from '@queries/accessGroups/getAccessGroups'

const icons: { [key in SelectionStatus]: string | undefined } = {
  [SelectionStatus.None]: 'add',
  [SelectionStatus.Mixed]: 'remove',
  [SelectionStatus.All]: 'check',
}

type AccessGroupItem = {
  name: string
  status: SelectionStatus
}

type Props = {
  accessGroups: $Any[]
  projectUsers: ProjectUserData
  users: string[]
  userAccessGroups: AccessGroupUsers
  onSave: (users: string[], items: AccessGroupItem[]) => void
  onClose: () => void
}

const ProjectUserAccessAssignDialog = ({
  accessGroups,
  projectUsers,
  users,
  userAccessGroups,
  onSave,
  onClose,
}: Props) => {
  const initialStates = mapInitialAccessGroupStates(
    accessGroups,
    users,
    projectUsers,
    userAccessGroups,
  )
  const initialStatesList = Object.keys(initialStates).map((agName) => ({
    name: agName,
    status: initialStates[agName],
  }))

  const [accessGroupItems, setAccessGroupItems] = useState<AccessGroupItem[]>(initialStatesList)
  const allSelected =
    accessGroupItems.find((item) => item.status !== SelectionStatus.All) === undefined

  const toggleAccessGroup = (accessGroup: AccessGroupItem) => {
    const newStatus =
      SelectionStatus.All === accessGroup.status ? SelectionStatus.None : SelectionStatus.All
    setAccessGroupItems((prev: AccessGroupItem[]) => {
      const idx = prev.findIndex((item) => item.name === accessGroup.name)
      return [...prev.slice(0, idx), { ...accessGroup, status: newStatus }, ...prev.slice(idx + 1)]
    })
  }

  const handleToggleAll = (value: boolean) => {
    setAccessGroupItems((prev: AccessGroupItem[]) => {
      return prev.map((item) => ({
        ...item,
        status: value ? SelectionStatus.All : SelectionStatus.None,
      }))
    })
  }

  const handleClose = () => {
    onClose()
  }

  const handleSave = () => {
    const changes = accessGroupItems.filter((item) => initialStates[item.name] !== item.status)
    onSave(users, changes)
    onClose()
  }

  const getHeader = () => {
    if (users.length <= 3) {
      return users.join(',')
    }
    const rest = users.length - 3
    return (
      <span>
        {users.slice(0, 3).join(', ')} and{' '}
        <span
          data-tooltip={users.slice(3).join(', ')}
          style={{ textDecoration: 'underline', cursor: 'pointer' }}
        >
          {rest} {rest > 1 ? 'others' : 'other'}
        </span>
      </span>
    )
  }

  const shortcuts = useMemo(
    () => [
      {
        key: 'ctrl+Enter',
        action: handleSave,
      },
      {
        key: 'ctrl+a',
        action: () => handleToggleAll(!allSelected),
      },
    ],
    [allSelected, accessGroupItems],
  )

  return (
    <>
      {/* @ts-ignore */}
      <Shortcuts shortcuts={shortcuts} deps={[accessGroupItems]} />
      <Dialog
        size="md"
        header={<span>Add access for {getHeader()}</span>}
        footer={
          <>
            <Styled.Button
              icon="check"
              variant="surface"
              className={clsx({ 'all-selected': allSelected })}
              label={allSelected ? 'Deselect all' : 'Select all'}
              onClick={() => handleToggleAll(!allSelected)}
            >
              <ShortcutTag>{getPlatformShortcutKey('a', [KeyMode.Ctrl])}</ShortcutTag>
            </Styled.Button>
            <Spacer />
            <Button icon="check" variant="filled" label="Save" onClick={() => handleSave()} />
          </>
        }
        isOpen={true}
        onClose={handleClose}
      >
        <FormLayout>
          <Styled.List>
            {accessGroupItems.map((item) => (
              <Styled.ProjectItem
                key={item.name}
                data-testid={`access-group-${item.name}`}
                className={clsx({
                  selected: item.status === SelectionStatus.All,
                })}
                id={item.name}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key == 'Enter' || e.key == ' ') {
                    toggleAccessGroup(item)
                    e.preventDefault()
                  }
                }}
                onClick={() => toggleAccessGroup(item)}
              >
                <span className="name">{item.name}</span>
                {icons[item.status] !== undefined && (
                  <Icon className={item.status} icon={icons[item.status]!} />
                )}
              </Styled.ProjectItem>
            ))}
          </Styled.List>
        </FormLayout>
      </Dialog>
    </>
  )
}

export default ProjectUserAccessAssignDialog
