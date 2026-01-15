import { Icon } from '@ynput/ayon-react-components'
import { useProjectContext } from '@shared/context'
import { getEntityColor, getEntityIcon } from '@shared/containers'

type Props = {
  entity: { entityType: string; subType?: string | undefined }
  color?: string;
  icon?: string;
}

export const EntityIcon = ({ entity, icon, color }: Props) => {
  const { folderTypes, productTypes, taskTypes, anatomy } = useProjectContext()

  const anatomyForIcons = {
    folderTypes: folderTypes || [],
    taskTypes: taskTypes || [],
    productTypes: productTypes || [],
  }

  return (
    <Icon
      icon={icon? icon: getEntityIcon(entity.entityType, entity?.subType, anatomyForIcons)}
      style={{ color: color? color: getEntityColor(entity.entityType, entity.subType, anatomyForIcons) }}
      className="icon"
      data-tooltip={entity.subType?.replace(/_/g, ' ')}
    />
  )
}
