import DropdownColumnWrapper from './DropdownColumnWrapper'
import { $Any } from '@types'

type Props = {
  folderTypes: $Any
  type: string
}

const FolderTypeCell: React.FC<Props> = ({ folderTypes, type }) => {
  const icon = folderTypes[type].icon
  return (
    <DropdownColumnWrapper
      showPreview
      previewValue={{
        icon: icon,
        color: '',
        text: type,
      }}
    >
   ...
    </DropdownColumnWrapper>
  )
}

export default FolderTypeCell
