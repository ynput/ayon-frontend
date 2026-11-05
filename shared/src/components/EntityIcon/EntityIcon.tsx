import { Icon, IconProps, getReadableColor, type UserColor } from '@ynput/ayon-react-components'
import { useProjectContext } from '@shared/context'
import { getEntityColor, getEntityColorLight, getEntityIcon } from '@shared/util/iconUtils'

interface Props extends Partial<Omit<IconProps, 'color'>> {
  entity: { entityType: string; subType?: string }
  color?: string | UserColor
}

export const EntityIcon = ({ entity, icon, color, ...props }: Props) => {
  const { anatomy } = useProjectContext()

  return (
    <Icon
      icon={icon ?? getEntityIcon(entity.entityType, entity.subType, anatomy)}
      style={{
        color: getReadableColor(
          color ?? {
            color: getEntityColor(entity.entityType, entity.subType, anatomy),
            colorLight: getEntityColorLight(entity.entityType, entity.subType, anatomy),
          },
        ),
      }}
      className="icon"
      data-tooltip={entity.subType?.replace(/_/g, ' ')}
      {...props}
    />
  )
}
