import TasksProgress from '@containers/TasksProgress'
import { Section } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { FC } from 'react'
import { useAppSelector } from '@state/store'
import TaskProgressDetailsPanel from './TaskProgressDetailsPanel'
import { useGetAttributeConfigQuery } from '@shared/api'
import { getPriorityOptions } from '@shared/util'
import { useScopedStatuses } from '@shared/hooks'
import {
  useSlicerContext,
  Slicer,
  SLICER_SPLITTER_STATE_KEY,
  SLICER_SPLITTER_PANEL_CONFIG,
} from '@shared/containers/Slicer'
import { useProjectContext } from '@shared/context'
import DetailsPanelSplitter from '@components/DetailsPanelSplitter'

const TasksProgressPage: FC = () => {
  const projectName = useAppSelector((state: any) => state.project.name) as string

  // load slicer remote config
  const { config } = useSlicerContext()
  const taskProgressSliceFields = config?.progress?.fields

  //   GET PROJECT INFO FOR STATUS
  const { ...projectInfo } = useProjectContext()
  // Get attributes so we can use priority
  const { data: priorityAttrib } = useGetAttributeConfigQuery({ attributeName: 'priority' })
  const priorities = getPriorityOptions(priorityAttrib, 'task')
  const taskStatuses = useScopedStatuses([projectName], ['task'])
  const folderStatuses = useScopedStatuses([projectName], ['folder'])

  return (
    <main>
      <Splitter
        layout="horizontal"
        stateKey={SLICER_SPLITTER_STATE_KEY}
        stateStorage="local"
        style={{ width: '100%', height: '100%' }}
      >
        <SplitterPanel {...SLICER_SPLITTER_PANEL_CONFIG}>
          <Section wrap>
            <Slicer sliceFields={taskProgressSliceFields} persistFieldId="hierarchy" />
          </Section>
        </SplitterPanel>
        <SplitterPanel size={88} style={{ overflow: 'hidden' }}>
          <DetailsPanelSplitter layout="horizontal" style={{ height: '100%', overflow: 'hidden' }}>
            <SplitterPanel size={60} style={{ overflow: 'hidden' }}>
              <TasksProgress
                taskStatuses={taskStatuses}
                folderStatuses={folderStatuses}
                taskTypes={projectInfo?.taskTypes}
                folderTypes={projectInfo?.folderTypes}
                priorities={priorities}
                projectName={projectName}
              />
            </SplitterPanel>

            <SplitterPanel
              size={20}
              style={{
                minWidth: 300,
                maxWidth: 800,
                zIndex: 500,
              }}
              className="details"
            >
              <TaskProgressDetailsPanel projectInfo={projectInfo} projectName={projectName} />
            </SplitterPanel>
          </DetailsPanelSplitter>
        </SplitterPanel>
      </Splitter>
    </main>
  )
}

export default TasksProgressPage
