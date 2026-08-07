import TasksProgress from '@containers/TasksProgress'
import { Section } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { FC } from 'react'
import { useAppSelector } from '@state/store'
import TaskProgressDetailsPanel from './TaskProgressDetailsPanel'
import { useGetAttributeConfigQuery } from '@shared/api'
import { getPriorityOptions } from '@shared/util'
import { useScopedStatuses } from '@shared/hooks'
import { Slicer, SLICER_PAGES_CONFIG, useSlicerSplitter } from '@shared/containers/Slicer'
import { useProjectContext } from '@shared/context'
import DetailsPanelSplitter from '@components/DetailsPanelSplitter'
import { useTaskProgressSlicerCountsSource } from '@containers/TasksProgress/hooks'

const TasksProgressPage: FC = () => {
  const projectName = useAppSelector((state: any) => state.project.name) as string

  //   GET PROJECT INFO FOR STATUS
  const { ...projectInfo } = useProjectContext()
  // Get attributes so we can use priority
  const { data: priorityAttrib } = useGetAttributeConfigQuery({ attributeName: 'priority' })
  const priorities = getPriorityOptions(priorityAttrib, 'task')
  const taskStatuses = useScopedStatuses([projectName], ['task'])
  const folderStatuses = useScopedStatuses([projectName], ['folder'])

  const [slicerSize, handleResizeEnd] = useSlicerSplitter()

  const slicerCountsSource = useTaskProgressSlicerCountsSource(projectName)

  return (
    <main>
      <Splitter
        layout="horizontal"
        style={{ width: '100%', height: '100%' }}
        onResizeEnd={handleResizeEnd}
      >
        <SplitterPanel size={slicerSize[0]}>
          <Section wrap>
            <Slicer
              sliceFields={SLICER_PAGES_CONFIG.progress.fields}
              pinnedSliceType="hierarchy"
              countsSource={slicerCountsSource}
            />
          </Section>
        </SplitterPanel>
        <SplitterPanel size={slicerSize[1]} style={{ overflow: 'hidden' }}>
          <DetailsPanelSplitter layout="horizontal" style={{ height: '100%', overflow: 'hidden' }}>
            <SplitterPanel size={80} style={{ overflow: 'hidden' }}>
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
