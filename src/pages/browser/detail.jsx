import { useSelector } from 'react-redux'
import { Spacer, Section, Toolbar } from '@ynput/ayon-react-components'

import FolderDetail from './folderDetail'
import VersionDetail from './versionDetail'
import TaskDetail from './taskDetail'

const Detail = () => {
  const context = useSelector((state) => ({ ...state.context }))

  let detailComponent = null

  switch (context.focused.type) {
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

  const header = context.focused.type
    ? context.focused.type.charAt(0).toUpperCase() + context.focused.type.slice(1)
    : 'No selection'

  return (
    <Section className="wrap">
      <Toolbar>
        <span className="section-header">{header}</span>
        <Spacer />
      </Toolbar>
      {detailComponent}
    </Section>
  )
}

export default Detail
