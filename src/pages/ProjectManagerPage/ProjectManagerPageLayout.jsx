import React from 'react'
import PropTypes from 'prop-types'
import { Section, Toolbar } from '@ynput/ayon-react-components'

const ProjectManagerPageLayout = ({ projectList, children, passthrough, toolbar }) => {
  if (passthrough) return children
  return (
    <main style={{ overflowY: 'clip' }}>
      {projectList}
      <Section
        style={{
          alignItems: 'start',
        }}
      >
        {toolbar && <Toolbar>{toolbar}</Toolbar>}
        {children}
      </Section>
    </main>
  )
}

ProjectManagerPageLayout.propTypes = {
  toolbar: PropTypes.node,
  projectList: PropTypes.node,
  children: PropTypes.node,
}

export default ProjectManagerPageLayout
