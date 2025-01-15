import DropdownCell from './DropdownCell'
type Props = {
  previewValue: { icon: string; color: string; text: string }
  showPreview: boolean
  handleExpandIconClick: Function
  children: React.ReactNode
}

const DropdownColumnWrapper: React.FC<Props> = ({
  previewValue,
  showPreview,
  children,
  handleExpandIconClick,
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

export default DropdownColumnWrapper
