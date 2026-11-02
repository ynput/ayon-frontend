import { IconProps } from '@ynput/ayon-react-components'

export type NewEntityType = 'folder' | 'task'

export const newEntityDefinitions: Record<
  NewEntityType,
  {
    label: string
    createLabel: string
    icon: IconProps['icon']
  }
> = {
  folder: {
    label: 'Folder',
    createLabel: 'Create folder',
    icon: 'create_new_folder',
  },
  task: {
    label: 'Task',
    createLabel: 'Create task',
    icon: 'add_task',
  },
}
