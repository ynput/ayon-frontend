import { useState } from 'react'
import HierarchyBuilder from './HierarchyBuilder'
import { Button } from '@ynput/ayon-react-components'
import { useSelector } from 'react-redux'

const BuildHierarchyButton = ({ buttonProps, dialogProps }) => {
  const [visible, setVisible] = useState(false)
  const project = useSelector((state) => state.project)
  const { attrib } = project

  const focusedFolders = useSelector((state) => state.context.focused.folders) || []

  return (
    <>
      <Button
        icon="account_tree"
        label="Build hierarchy"
        onClick={() => setVisible(true)}
        {...buttonProps}
      />
      {visible && (
        <HierarchyBuilder
          parents={focusedFolders}
          visible={visible}
          onHide={() => setVisible(false)}
          attrib={attrib}
          {...dialogProps}
        />
      )}
    </>
  )
}

export default BuildHierarchyButton
