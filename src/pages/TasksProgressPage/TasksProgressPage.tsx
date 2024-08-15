import Hierarchy from '@containers/hierarchy'
import TasksProgress from '@containers/TasksProgress'
import { useGetProjectQuery } from '@queries/project/getProject'
import { $Any } from '@types'
import { Section } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { FC } from 'react'
import { useSelector } from 'react-redux'
import TaskProgressDetailsPanel from './TaskProgressDetailsPanel'

const detailsMinWidth = 533
const detailsMaxWidth = '40vw'
const detailsMaxMaxWidth = 700

const TasksProgressPage: FC = () => {
  const projectName = useSelector((state: $Any) => state.project.name) as string
  const isOpen = useSelector((state: $Any) => state.details.open) as boolean

  //   GET PROJECT INFO FOR STATUS
  const { data: projectInfo } = useGetProjectQuery({ projectName }, { skip: !projectName })

  return (
    <main style={{ overflow: 'hidden' }}>
      <Splitter
        layout="horizontal"
        style={{ width: '100%', height: '100%' }}
        stateKey="browser-splitter-1"
      >
        <SplitterPanel size={18} style={{ minWidth: 250, maxWidth: 600 }}>
          <Section wrap>
            <Hierarchy />
          </Section>
        </SplitterPanel>
        <SplitterPanel size={82} style={{ overflow: 'hidden' }}>
          <Splitter
            layout="horizontal"
            style={{ height: '100%', overflow: 'hidden' }}
            stateKey="browser-splitter-2"
          >
            <SplitterPanel style={{ overflow: 'hidden' }}>
              <TasksProgress
                statuses={projectInfo?.statuses}
                taskTypes={projectInfo?.taskTypes}
                projectName={projectName}
              />
            </SplitterPanel>
            {isOpen ? (
              <SplitterPanel
                style={{
                  maxWidth: `clamp(${detailsMinWidth}px, ${detailsMaxWidth}, ${detailsMaxMaxWidth}px)`,
                  minWidth: detailsMinWidth,
                  zIndex: 100,
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
