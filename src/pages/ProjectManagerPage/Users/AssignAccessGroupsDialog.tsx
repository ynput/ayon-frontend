import { useState } from 'react'
import { FormLayout, Dialog, Button, Icon } from '@ynput/ayon-react-components'
import { $Any } from '@types'
import clsx from 'clsx'
import * as Styled from './AssignAccessGroupsDialog.styled'

type Props = {
  accessGroups: $Any[]
  users: string[]
  onSave: (items: AccessGroupItem[], users: string[]) => void
  onClose: () => void
}

type AccessGroupItem = {
  name: string
  selected: boolean
}

const AssignAccessGroupsDialog = ({ accessGroups, users, onSave, onClose }: Props) => {
  const [accessGroupItems, setAccessGroupItems] = useState<AccessGroupItem[]>(accessGroups)

  const toggleAccessGroup = (accessGroup: AccessGroupItem) => {
    setAccessGroupItems((prev: AccessGroupItem[]) => {
      const idx = prev.findIndex((item) => item.name === accessGroup.name)
      return [...prev.slice(0, idx), accessGroup, ...prev.slice(idx + 1)]
    })
  }
  const handleClose = () => {
    onClose()
  }

  const handleSave = () => {
    onSave(accessGroupItems, users)
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
          {accessGroupItems.map(({ name, selected }) => (
            <Styled.ProjectItem
              key={name}
              className={clsx('project-item', {
                selected: selected,
              })}
              id={name}
              tabIndex={0}
              onClick={() => {
                toggleAccessGroup({ name, selected: !selected })
              }}
            >
              <span className="name">{name}</span>
              <Icon icon={selected ? 'check' : 'add'} />
            </Styled.ProjectItem>
          ))}
        </Styled.List>
      </FormLayout>
    </Dialog>
  )
}

export default AssignAccessGroupsDialog
