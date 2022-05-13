import { useSelector } from 'react-redux'
import { Spacer } from '../../components'

import FolderDetail from './detail-folder'
import VersionDetail from './detail-version'
import TaskDetail from './detail-task'

const Detail = () => {
  const context = useSelector((state) => ({ ...state.context }))

  let detailComponent = null

  switch (context.focusedType) {
    case 'folder':
      detailComponent = <FolderDetail />
      break
    case 'version':
      detailComponent = <VersionDetail />
      break
    case 'task':
      detailComponent = <TaskDetail />
      break
    default:
      break
  }

  // <ToolButton icon="settings" disabled={true} tooltip="Mockup button" />

  const header = context.focusedType
    ? context.focusedType.charAt(0).toUpperCase() + context.focusedType.slice(1)
    : 'No selection'

  return (
    <section className="invisible insplit">
      <section className="row invisible">
        <span className="section-header">{header}</span>
        <Spacer />
      </section>
      {detailComponent}
    </section>
  )
}

export default Detail
