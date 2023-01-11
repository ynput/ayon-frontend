import { useState } from 'react'
import Hierarchy from '/src/containers/hierarchy'
import TaskList from '/src/containers/taskList'
import WorkfileList from './WorkfileList'
import WorkfileDetail from './WorkfileDetail'

const WorkfilesPage = () => {
  const [selectedWorkfile, setSelectedWorkfile] = useState(null)

  return (
    <main>
      <Hierarchy style={{ maxWidth: 500, minWidth: 300 }} />
      <TaskList style={{ maxWidth: 400, minWidth: 400 }} />
      <WorkfileList
        selectedWorkfile={selectedWorkfile}
        setSelectedWorkfile={setSelectedWorkfile}
        style={{ maxWidth: 500, minWidth: 300 }}
      />

      <WorkfileDetail workfileId={selectedWorkfile?.id} />
    </main>
  )
}

export default WorkfilesPage
