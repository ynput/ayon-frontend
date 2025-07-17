import React from 'react'
import PropTypes from 'prop-types'
import { Section, Toolbar } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { PROJECTS_LIST_WIDTH_KEY } from '@containers/ProjectsList/ProjectsList'

const ProjectManagerPageLayout = ({
  projectList,
  children,
  passthrough,
  toolbar,
  sectionStyle,
  ...props
}) => {
  if (passthrough) return children

  if (!projectList) {
    return (
      <main>
        <Section
          style={{
            alignItems: 'start',
            ...sectionStyle,
          }}
        >
          {toolbar && <Toolbar>{toolbar}</Toolbar>}
          {children}
        </Section>
      </main>
    )
  }
  return (
    <Splitter
      style={{
        overflow: 'hidden',
        height: '100%',
        padding: 8,
        position: 'relative',
        ...props.style,
      }}
      stateKey={PROJECTS_LIST_WIDTH_KEY}
      stateStorage="local"
    >
      <SplitterPanel size={15}>{projectList}</SplitterPanel>
      <SplitterPanel size={100} style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
        <Section
          style={{
            alignItems: 'start',
            ...sectionStyle,
          }}
        >
          {toolbar && <Toolbar>{toolbar}</Toolbar>}
          {children}
        </Section>
      </SplitterPanel>
    </Splitter>
  )
}

ProjectManagerPageLayout.propTypes = {
  toolbar: PropTypes.node,
  projectList: PropTypes.node,
  children: PropTypes.node,
}

export default ProjectManagerPageLayout
