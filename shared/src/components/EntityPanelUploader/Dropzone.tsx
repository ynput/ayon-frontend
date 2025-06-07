import { FC } from 'react'
import * as Styled from './EntityPanelUploader.styled'
import { Icon } from '@ynput/ayon-react-components'
import clsx from 'clsx'

export interface DropzoneType {
  id: string
  label: string
  icon: string
}

interface DropzoneProps extends DropzoneType, Omit<React.HTMLAttributes<HTMLDivElement>, 'id'> {
  isActive: boolean
}

const Dropzone: FC<DropzoneProps> = ({ label, icon, isActive, className, ...props }) => {
  return (
    <Styled.DropZone className={clsx(className, { active: isActive })} {...props}>
      <Icon icon={icon} />
      <span>{label}</span>
    </Styled.DropZone>
  )
}

export default Dropzone
