import { PropsWithChildren } from 'react'
import DropdownCell from './DropdownCell'
type Props = {
  previewValue: { icon: string; color: string; text: string }
  showPreview: boolean
  handleExpandIconClick: () => void
}

// This either renders the dropdown component or the preview component
// depending on the showPreview prop
// we do this to avoid rendering the dropdown component when it's not needed
// because it's a heavy component
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
