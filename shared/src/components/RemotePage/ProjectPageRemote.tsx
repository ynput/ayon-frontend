// a hoc component that helps to wrap remote project pages
// set up slicer

import { useSlicerContext } from '@shared/containers/Slicer/context/slicer'
import { ProjectPageLayout, Slicer } from '@ynput/ayon-addon'
import { RemotePageWrapper } from './RemotePageWrapper'
import type { RemotePageWrapperProps } from './RemotePageWrapper'
import { FC } from 'react'

interface WithSlicerProps {
  children: React.ReactNode
  fields: string[]
}

// the legacy `slicer: { fields }` key renders through the same layout components that addons
// place themselves on project.page contributions (@ynput/ayon-addon)
const WithSlicer = ({ children, fields }: WithSlicerProps) => (
  <main style={{ width: '100%', height: '100%' }}>
    <ProjectPageLayout sidebar={<Slicer fields={fields} />}>{children}</ProjectPageLayout>
  </main>
)

export interface ProjectPageRemoteProps extends RemotePageWrapperProps {
  slicer?: { fields: string[] }
  addonProps?: any
}

export const ProjectPageRemote: FC<ProjectPageRemoteProps> = ({
  Component,
  projectName,
  slicer,
  state = {},
  addonProps,
  ...props
}) => {
  // default use RemotePageWrapper
  let component = <RemotePageWrapper {...{ Component, projectName }} {...props} />

  // use with slicer panel next to the remote page
  if (slicer && projectName) {
    let slicerContext = null
    try {
      slicerContext = useSlicerContext()
    } catch (error) {
      console.log('Slicer context not available for this addon page')
    }

    component = (
      <WithSlicer fields={slicer.fields}>
        <RemotePageWrapper
          {...{ Component, projectName }}
          {...props}
          state={{ slicer: slicerContext, ...state }}
          {...addonProps}
        />
      </WithSlicer>
    )
  }

  return component
}
