import React from 'react'
import PropTypes from 'prop-types'
import { Toolbar } from '@ynput/ayon-react-components'

const ProjectManagerPageLayout = ({ toolbar, projectList, children, toolbarMore }) => {
  return (
    <>
      <Toolbar style={{ padding: 8, paddingBottom: 0 }}>
        {toolbar}
        {toolbarMore && <>{toolbarMore}</>}
      </Toolbar>
      <main style={{ overflowY: 'clip' }}>
        {projectList}
        {children}
      </main>
    </>
  )
}

ProjectManagerPageLayout.propTypes = {
  toolbar: PropTypes.node,
  projectList: PropTypes.node,
  children: PropTypes.node,
  toolbarMore: PropTypes.node,
}

export default ProjectManagerPageLayout
