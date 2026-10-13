import { Icon, IconProps } from '@ynput/ayon-react-components'
import { useProjectContext } from '@shared/context'
import { getEntityColor, getEntityIcon } from '@shared/util/iconUtils'

interface Props extends Partial<IconProps> {
  entity: { entityType: string; subType?: string }
  color?: string
}

export const EntityIcon = ({ entity, icon, color, ...props }: Props) => {
  const { anatomy } = useProjectContext()

  return (
    <Icon
      icon={icon ?? getEntityIcon(entity.entityType, entity.subType, anatomy)}
      style={{ color: color ?? getEntityColor(entity.entityType, entity.subType, anatomy) }}
      className="icon"
      data-tooltip={entity.subType?.replace(/_/g, ' ')}
      {...props}
    />
  )
}
