import Hierarchy from '@containers/hierarchy'
import TaskList from '@containers/taskList'
import WorkfileList from './WorkfileList'
import WorkfileDetail from './WorkfileDetail'
import useTitle from '@hooks/useTitle'

const WorkfilesPage = () => {
  useTitle() // This will use breadcrumbs fallback
  return (
    <main>
      <Hierarchy style={{ flex: 1, minWidth: 250, maxWidth: 500 }} />
      <TaskList style={{ flex: 0.75, minWidth: 250, maxWidth: 500 }} autoSelect />
      <WorkfileList style={{ flex: 1, minWidth: 300, maxWidth: 500 }} />
      <WorkfileDetail style={{ flex: 1.5, overflow: 'hidden', maxWidth: 500 }} />
    </main>
  )
}

export default WorkfilesPage
