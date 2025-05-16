import { useSettingsPanel } from '@shared/context'
import { Button } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'

const ButtonPosition = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 100;

  button.hasIcon {
    padding: 2px;
    border-radius: 12px;
  }
`

interface ListsAttributesShortcutButtonProps {}

const ListsAttributesShortcutButton: FC<ListsAttributesShortcutButtonProps> = ({}) => {
  const { togglePanel, isPanelOpen } = useSettingsPanel()

  if (isPanelOpen) return null

  return (
    <ButtonPosition>
      <Button icon={'add'} onClick={() => togglePanel('list_attributes')} />
    </ButtonPosition>
  )
}

export default ListsAttributesShortcutButton
