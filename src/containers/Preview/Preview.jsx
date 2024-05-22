import { Button } from '@ynput/ayon-react-components'
import { useDispatch, useSelector } from 'react-redux'
import { updateSelection } from '/src/features/preview'
import * as Styled from './Preview.styled'
import VersionSelectorTool from '/src/components/VersionSelectorTool/VersionSelectorTool'

// const Preview = ({ selected = [], entityType, onClose }) => {
const Preview = ({ selected=[], entityType, onClose }) => {
  // TODO @LudoHolbik: a new services file src/services/preview/getPreview.js should be created for these queries below

  // TODO @Innders: get selected entity data from selected and entityType

  // TODO @LudoHolbik: get selected versions data from selected and entityType
  // some entity types won't support this
  // look at getActivities.js getEntityVersions [line 64] and getVersions [line 86] for reference
  const allVersionsDummyData = [
    { id: '1', name: 'v001' },
    { id: '2', name: 'v002' },
    { id: '3', name: 'v003' },
    { id: '4', name: 'v004', status: 'approved' },
    { id: '5', name: 'v005', status: 'selected' },
    { id: '6', name: 'v006', status: 'latest' },
    // { id: 7, name: 'HERO' },
  ]

  const allData = useSelector((state) => state.preview)
  const dispatch = useDispatch()
  console.log(allData, 'allDaTA')


  const onChange = (selectedId) => {
    const selectedIds = [selectedId]
    console.log(selectedIds,'selectedIds')
    dispatch(updateSelection({selected: selectedIds}))
  }

  return (
    <Styled.Container>
      <Styled.Header>
        <VersionSelectorTool versions={allVersionsDummyData} selected={selected} onChange={onChange}  />
        <Button onClick={onClose} icon={'close'} />
      </Styled.Header>
      <Styled.Content>
        {/* <h2>Selected Version: {selected.join(', ')}</h2> */}
      </Styled.Content>
    </Styled.Container>
  )
}

export default Preview
