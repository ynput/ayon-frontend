import Slicer from '@containers/Slicer'
import TasksProgress from '@containers/TasksProgress'
import { useGetProjectQuery } from '@queries/project/enhancedProject'
import { Section } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { FC } from 'react'
import { useAppSelector } from '@state/store'
import TaskProgressDetailsPanel from './TaskProgressDetailsPanel'
import { useGetAttributeConfigQuery } from '@shared/api'
import { getPriorityOptions } from '@shared/util'
import { useScopedStatuses } from '@shared/hooks'
import { useSlicerContext } from '@context/SlicerContext'
import { useScopedDetailsPanel } from '@shared/context'

const TasksProgressPage: FC = () => {
  const projectName = useAppSelector((state: any) => state.project.name) as string
  const { isOpen: detailsOpen } = useScopedDetailsPanel('progress')

  // load slicer remote config
  const { config } = useSlicerContext()
  const taskProgressSliceFields = config?.progress?.fields

  //   GET PROJECT INFO FOR STATUS
  const { data: projectInfo } = useGetProjectQuery({ projectName }, { skip: !projectName })
  // Get attributes so we can use priority
  const { data: priorityAttrib } = useGetAttributeConfigQuery({ attributeName: 'priority' })
  const priorities = getPriorityOptions(priorityAttrib, 'task')
  const statuses = useScopedStatuses([projectName], ['task'])

  return (
    <main>
      <Splitter layout="horizontal" style={{ width: '100%', height: '100%' }}>
        <SplitterPanel size={detailsOpen ? 12 : 18} style={{ minWidth: 100, maxWidth: 500 }}>
          <Section wrap>
            <Slicer sliceFields={taskProgressSliceFields} persistFieldId="hierarchy" />
          </Section>
        </SplitterPanel>
        <SplitterPanel size={90} style={{ overflow: 'hidden' }}>
          <Splitter
            layout="horizontal"
            style={{ height: '100%', overflow: 'hidden' }}
            pt={{ gutter: { style: { width: detailsOpen ? 4 : 0 } } }}
          >
            <SplitterPanel size={60} style={{ overflow: 'hidden' }}>
              <TasksProgress
                statuses={statuses}
                taskTypes={projectInfo?.taskTypes}
                folderTypes={projectInfo?.folderTypes}
                priorities={priorities}
                projectName={projectName}
              />
            </SplitterPanel>
            {detailsOpen ? (
              <SplitterPanel
                size={20}
                style={{
                  minWidth: 300,
                  maxWidth: 800,
                  zIndex: 500,
                }}
              >
                <TaskProgressDetailsPanel projectInfo={projectInfo} projectName={projectName} />
              </SplitterPanel>
            ) : (
              <SplitterPanel size={0} style={{ maxWidth: 0 }}></SplitterPanel>
            )}
          </Splitter>
        </SplitterPanel>
      </Splitter>
    </main>
  )
}

export default TasksProgressPage
