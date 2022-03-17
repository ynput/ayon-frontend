import { useSelector } from 'react-redux'
import { Button, Spacer } from '../../components'

import FolderDetail from './detail-folder'
import VersionDetail from './detail-version'

const Detail = () => {
  //const dispatch = useDispatch()
  const context = useSelector((state) => ({ ...state.contextReducer }))

  let detailComponent = null

  switch (context.focusedType) {
    case 'folder':
      detailComponent = <FolderDetail />
      break
    case 'version':
      detailComponent = <VersionDetail />
      break
    default:
      break
  }

  return (
    <section className="invisible insplit">
      <section className="row invisible">
        <span className="section-header">
          {context.focusedType || 'Nothing selected'}
        </span>
        <Spacer />
        <Button icon="pi pi-bolt" disabled={true} tooltip="Mockup button" />
      </section>
      {detailComponent}
    </section>
  )
}

export default Detail
