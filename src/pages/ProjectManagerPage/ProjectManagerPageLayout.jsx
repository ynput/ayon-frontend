import React from 'react'
import PropTypes from 'prop-types'
import { Section, Toolbar } from '@ynput/ayon-react-components'

const ProjectManagerPageLayout = ({ projectList, children, passthrough, toolbar, sectionStyle, ...props }) => {
  if (passthrough) return children
  return (
    <main style={{ overflow: 'hidden', ...props.style }}>
      {projectList && projectList}
      <Section
        style={{
          alignItems: 'start',
          ...sectionStyle
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
