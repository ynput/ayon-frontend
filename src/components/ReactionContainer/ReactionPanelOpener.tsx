import { useState } from "react"
import { Icon } from "@ynput/ayon-react-components"
import ReactionsPanel from "./ReactionsPanel"
import * as Styled from './ReactionStyles.styled'

const ReactionPanelOpener = () => {
  const [isOpen, setIsOpen] =  useState(false)
  return (
    <Styled.ReactionPanelOpener>
      <Icon icon="add_reaction" className="add-reaction" onClick={() => setIsOpen((prev) => !prev)} />
      {isOpen && <ReactionsPanel />}
    </Styled.ReactionPanelOpener>
  )
}
export default ReactionPanelOpener