import { PropsWithChildren } from 'react';
import DropdownCell from './DropdownCell'
type Props = {
  previewValue: { icon: string; color: string; text: string }
  showPreview: boolean
  handleExpandIconClick: () => void
}

const DropdownCellWrapper: React.FC<HTMLDivElement & PropsWithChildren<Props>> = ({
  previewValue,
  showPreview,
  handleExpandIconClick,
  children,
}) => {
  if (showPreview) {
    return (
      <DropdownCell
        color={previewValue.color}
        icon={previewValue.icon}
        text={previewValue.text}
        handleExpandIconClick={handleExpandIconClick}
      />
    )
  }

  return children
}

export default DropdownCellWrapper
