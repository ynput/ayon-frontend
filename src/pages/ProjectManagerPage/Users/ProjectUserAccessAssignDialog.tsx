import { useState } from 'react'
import { FormLayout, Dialog, Button, Icon } from '@ynput/ayon-react-components'
import { $Any } from '@types'
import clsx from 'clsx'
import * as Styled from './ProjectUserAccessAssignDialog.styled'
import { AccessGroupUsers, SelectionStatus } from './types'

const icons: {[key in SelectionStatus] : string | undefined} = {
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
  users: string[]
  userAccessGroups: AccessGroupUsers
  onSave: (items: AccessGroupItem[], users: string[]) => void
  onClose: () => void
}

const ProjectUserAccessAssignDialog = ({
  accessGroups,
  users,
  userAccessGroups,
  onSave,
  onClose,
}: Props) => {
  const mapStates = () => {
    const getStatus = (users: string[], accessGroupUsers: string[]) => {
      const usersSet = new Set(users)
      const accessGroupUsersSet = new Set(accessGroupUsers)
      const intersection = usersSet.intersection(accessGroupUsersSet)

      // No users in ag users
      if (intersection.size == 0) {
        return SelectionStatus.None
      }

      //All users / some users in ag users
      return intersection.size == usersSet.size ? SelectionStatus.All : SelectionStatus.Mixed
    }

    const data: $Any = {}
    accessGroups.map((ag) => {
      if (userAccessGroups[ag.name] === undefined) {
        data[ag.name] = SelectionStatus.None
      } else {
        data[ag.name] = getStatus(users, userAccessGroups[ag.name])
      }
    })

    return data
  }

  const initialStates = mapStates()
  const initialStatesList = Object.keys(initialStates).map(agName => ({name: agName, status: initialStates[agName]}))

  const [accessGroupItems, setAccessGroupItems] = useState<AccessGroupItem[]>(initialStatesList)


  const toggleAccessGroup = (accessGroup: AccessGroupItem) => {
    const newStatus = [SelectionStatus.Mixed, SelectionStatus.All].includes(accessGroup.status) ? SelectionStatus.None : SelectionStatus.All
    setAccessGroupItems((prev: AccessGroupItem[]) => {
      const idx = prev.findIndex((item) => item.name === accessGroup.name)
      return [...prev.slice(0, idx), {...accessGroup, status: newStatus}, ...prev.slice(idx + 1)]
    })
  }
  const handleClose = () => {
    onClose()
  }

  const handleSave = () => {
    const changes = accessGroupItems.filter(item => initialStates[item.name] !== item.status)
    onSave(changes, users)
    onClose()
  }

  return (
    <Dialog
      size="sm"
      header={`Add access for ${users.join(', ')}`}
      footer={<Button icon="check" variant="filled" label="Save" onClick={() => handleSave()} />}
      isOpen={true}
      onClose={handleClose}
    >
      <FormLayout>
        <Styled.List>
          {accessGroupItems.map((item) => (
            <Styled.ProjectItem
              key={item.name}
              className={clsx('project-item', {
                selected: item.status === SelectionStatus.All
              })}
              id={item.name}
              tabIndex={0}
              onClick={() => {
                toggleAccessGroup(item)
              }}
            >
              <span className="name">{item.name}</span>
              {icons[item.status] !== undefined && <Icon icon={icons[item.status]!} />}
            </Styled.ProjectItem>
          ))}
        </Styled.List>
      </FormLayout>
    </Dialog>
  )
}

export default ProjectUserAccessAssignDialog
