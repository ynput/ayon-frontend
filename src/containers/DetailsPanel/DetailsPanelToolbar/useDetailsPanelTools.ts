import { ButtonProps } from '@ynput/ayon-react-components'
import { useDispatch } from 'react-redux'

interface ToolButton extends Pick<ButtonProps, 'icon' | 'onClick' | 'selected' | 'disabled'> {
  shortcutKey?: string
  hide?: boolean
}

type Props = {
  onClose: () => void
}

const buildShortcuts = (tools: ToolButton[]) =>
  tools
    .filter((tool) => tool.shortcutKey)
    .map((tool) => ({ key: tool.shortcutKey, action: tool.onClick }))

const useDetailsPanelTools = ({ onClose }: Props) => {
  const dispatch = useDispatch()

  const handleCloseButton = () => {
    onClose()
  }

  // define the tools here and what each one does
  let tools: ToolButton[] = [
    { icon: 'close', onClick: handleCloseButton, hide: !onClose, shortcutKey: 'Escape' },
  ]

  tools = tools.filter((tool) => !tool.hide)

  const shortcuts = buildShortcuts(tools)

  return { tools, shortcuts }
}

export default useDetailsPanelTools
