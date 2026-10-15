// a hoc component that helps to wrap remote project pages
// set up slicer

import { useSlicerContext } from '@shared/containers/Slicer/context/slicer'
import { Slicer } from '@shared/containers/Slicer/components/Slicer'
import { defaultSliceOptions } from '@shared/containers/Slicer/hooks/useTableDataBySlice'
import {
  SLICER_SPLITTER_STATE_KEY,
  SLICER_SPLITTER_PANEL_CONFIG,
} from '@shared/containers/Slicer/hooks/useSlicerSplitter'
import { RemotePageWrapper } from './RemotePageWrapper'
import type {
  RemoteDetailsPanel,
  RemoteDetailsPanelEntities,
  RemotePageWrapperProps,
} from './RemotePageWrapper'
import { DetailsPanelSplitter } from '../DetailsPanelSplitter'
import { Section } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { FC, useMemo, useState } from 'react'

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

export interface RemotePageDetailsPanelProps {
  projectName: string
  entities: RemoteDetailsPanelEntities
  onClose: () => void
}

export interface ProjectPageRemoteProps extends Omit<RemotePageWrapperProps, 'detailsPanel'> {
  slicer?: { fields: string[] }
  addonProps?: any
  // the host's details panel, shown next to the page when the page opens it.
  // Only for pages that use it: it puts the page in a splitter.
  DetailsPanel?: FC<RemotePageDetailsPanelProps>
}

export const ProjectPageRemote: FC<ProjectPageRemoteProps> = ({
  Component,
  projectName,
  slicer,
  state = {},
  addonProps,
  DetailsPanel,
  ...props
}) => {
  const [shown, setShown] = useState<RemoteDetailsPanelEntities & { projectName?: string }>()
  const entities = useMemo(
    () =>
      shown?.entityIds.length && shown.projectName === projectName
        ? { entityType: shown.entityType, entityIds: shown.entityIds }
        : null,
    [shown, projectName],
  )
  const detailsPanel = useMemo<RemoteDetailsPanel | undefined>(
    () =>
      DetailsPanel && {
        isOpen: !!entities,
        entities,
        open: ({ entityType, entityIds }) => setShown({ entityType, entityIds, projectName }),
        close: () => setShown(undefined),
      },
    [DetailsPanel, entities, projectName],
  )

  const withDetailsPanel = (page: JSX.Element) =>
    DetailsPanel && projectName ? (
      <DetailsPanelSplitter
        layout="horizontal"
        stateKey="remote-page-splitter-details"
        stateStorage="local"
        style={{ width: '100%', height: '100%' }}
      >
        <SplitterPanel size={70}>{page}</SplitterPanel>
        <SplitterPanel size={30} className="details" style={{ zIndex: 300, minWidth: 300 }}>
          {entities && (
            <DetailsPanel
              projectName={projectName}
              entities={entities}
              onClose={() => setShown(undefined)}
            />
          )}
        </SplitterPanel>
      </DetailsPanelSplitter>
    ) : (
      page
    )

  // default use RemotePageWrapper
  let component = withDetailsPanel(
    <RemotePageWrapper {...{ Component, projectName, detailsPanel }} {...props} />,
  )

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
        {withDetailsPanel(
          <RemotePageWrapper
            {...{ Component, projectName, detailsPanel }}
            {...props}
            state={{ slicer: slicerContext, ...state }}
            {...addonProps}
          />,
        )}
      </WithSlicer>
    )
  }

  return component
}
