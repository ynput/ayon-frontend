import { useSelector } from 'react-redux'
import { Spacer, Section, Toolbar } from '@ynput/ayon-react-components'

import FolderDetail from './FolderDetail'
import VersionDetail from './VersionDetail'
import TaskDetail from './TaskDetail'

const Detail = () => {
  const type = useSelector((state) => state.context.focused.type)

  let detailComponent = null

  switch (type) {
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

  const header = type ? type.charAt(0).toUpperCase() + type.slice(1) : 'No selection'

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
