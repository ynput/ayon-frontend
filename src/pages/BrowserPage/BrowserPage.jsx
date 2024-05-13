import { Splitter, SplitterPanel } from 'primereact/splitter'
import { Section } from '@ynput/ayon-react-components'
import { useSelector } from 'react-redux'
import Hierarchy from '/src/containers/hierarchy'
import TaskList from '/src/containers/taskList'

import Products from './Products'
import DetailsPanel from '/src/containers/DetailsPanel/DetailsPanel'
import { useGetUsersAssigneeQuery } from '/src/services/user/getUsers'
import DetailsPanelSlideOut from '/src/containers/DetailsPanel/DetailsPanelSlideOut/DetailsPanelSlideOut'

const BrowserPage = () => {
  const projectName = useSelector((state) => state.project.name)
  const projectInfo = useSelector((state) => state.project)
  const { statuses = {}, statusesOrder = [], tags = {}, tagsOrder } = projectInfo
  const statusesOptions = statusesOrder.map((status) => statuses[status] && { ...statuses[status] })
  const tagsOptions = tagsOrder.map((tag) => tags[tag] && { ...tags[tag] })

  const projectsInfo = {
    [projectName]: {
      ...projectInfo,
      statuses: statusesOptions,
      tags: tagsOptions,
      projectNames: [{ id: projectName, name: projectName }],
    },
  }
  const focused = useSelector((state) => state.context.focused)

  let { type: entityType } = focused
  // if entityType is representation, entityType stays as versions because we use a slide out
  if (entityType === 'representation') entityType = 'version'
  const entityIds = focused[entityType + 's'] || []
  const entities = entityIds.map((id) => ({ id, projectName }))

  const { data: users = [] } = useGetUsersAssigneeQuery({ names: undefined, projectName })

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
            <TaskList style={{ maxHeight: 300 }} />
          </Section>
        </SplitterPanel>
        <SplitterPanel size={82}>
          <Splitter layout="horizontal" style={{ height: '100%' }} stateKey="browser-splitter-2">
            <SplitterPanel style={{ minWidth: 500 }}>
              <Products />
            </SplitterPanel>
            {entities?.length ? (
              <SplitterPanel style={{ minWidth: 250, maxWidth: 480, zIndex: 100 }}>
                <DetailsPanel
                  entityType={entityType}
                  entities={entities}
                  projectsInfo={projectsInfo}
                  projectNames={[projectName]}
                  statusesOptions={statusesOptions}
                  tagsOptions={tagsOptions}
                  projectUsers={users}
                  activeProjectUsers={users}
                  style={{ boxShadow: 'none' }}
                />
                <DetailsPanelSlideOut projectsInfo={projectsInfo} />
              </SplitterPanel>
            ) : (
              <SplitterPanel style={{ maxWidth: 0 }} />
            )}
          </Splitter>
        </SplitterPanel>
      </Splitter>
    </main>
  )
}

export default BrowserPage
