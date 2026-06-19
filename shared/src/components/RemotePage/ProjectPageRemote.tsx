// a hoc component that helps to wrap remote project pages
// set up slicer

import {
  useSlicerContext,
  Slicer,
  defaultSliceOptions,
  SLICER_SPLITTER_STATE_KEY,
  SLICER_SPLITTER_PANEL_CONFIG,
} from '@shared/containers/Slicer'
import { RemotePageWrapper, RemotePageWrapperProps } from '@shared/components'
import { Section } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { FC } from 'react'

interface WithSlicerProps {
  children: React.ReactNode
  fields: string[]
}

const WithSlicer = ({ children, fields }: WithSlicerProps) => {
  const slicerFields = defaultSliceOptions.filter((field) => fields.includes(field.value))

  return (
    <main style={{ width: '100%', height: '100%' }}>
      <Splitter
        layout="horizontal"
        style={{ width: '100%', height: '100%' }}
        stateKey={SLICER_SPLITTER_STATE_KEY}
        stateStorage="local"
      >
        <SplitterPanel {...SLICER_SPLITTER_PANEL_CONFIG}>
          <Section wrap>
            <Slicer sliceFields={slicerFields} pinnedSliceType="hierarchy" />
          </Section>
        </SplitterPanel>
        <SplitterPanel size={80}>{children}</SplitterPanel>
      </Splitter>
    </main>
  )
}

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
}) => {
  // default use RemotePageWrapper
  let component = <RemotePageWrapper {...{ Component, projectName }} />

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
          state={{ slicer: slicerContext, ...state }}
          {...addonProps}
        />
      </WithSlicer>
    )
  }

  return component
}
