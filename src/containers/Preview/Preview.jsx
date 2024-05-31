import { Button } from '@ynput/ayon-react-components'
import * as Styled from './Preview.styled'
import VersionSelectorTool from '/src/components/VersionSelectorTool/VersionSelectorTool'
import { useGetPreviewQuery, useGetPreviewVersionsQuery } from '/src/services/preview/getPreview'
import { useDispatch } from 'react-redux'
import { updateSelection } from '/src/features/preview'
import PreviewDetailsPanel from './PreviewDetailsPanel'
import PreviewPlayer from './PreviewPlayer'

const Preview = ({ selected = [], projectName, onClose }) => {
  const dispatch = useDispatch()
  // get version preview data
  const { data: selectedVersionsData = [], isFetching: isFetchingPreview } = useGetPreviewQuery(
    { projectName, versionIds: selected },
    { skip: !selected.length || !projectName },
  )

  // get all versions for the product ids of the selected versions
  const selectedProductIds = selectedVersionsData?.map(({ productId }) => productId)
  const { data: allVersionsData = [], isFetching: isFetchingVersions } = useGetPreviewVersionsQuery(
    { productIds: selectedProductIds, projectName },
    { skip: !selectedProductIds.length },
  )

  const handleVersionChange = (id) => {
    dispatch(updateSelection({ selected: [id] }))
  }

  const isLoadingAll = isFetchingPreview || isFetchingVersions

  return (
    <Styled.Container>
      <Styled.Header>
        <VersionSelectorTool
          versions={allVersionsData}
          selected={selected[0]}
          isLoading={isLoadingAll}
          onChange={handleVersionChange}
        />
        <Button onClick={onClose} icon={'close'} />
      </Styled.Header>
      <Styled.Content>
        <PreviewPlayer selected={selected} />

        <PreviewDetailsPanel selected={selected} projectName={projectName} />
      </Styled.Content>
    </Styled.Container>
  )
}

export default Preview
