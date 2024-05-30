import { Button } from '@ynput/ayon-react-components'
import * as Styled from './Preview.styled'
import VersionSelectorTool from '/src/components/VersionSelectorTool/VersionSelectorTool'
import { useGetPreviewQuery, useGetPreviewVersionsQuery } from '/src/services/preview/getPreview'

const Preview = ({ selected = [], projectName, onClose }) => {
  // get version preview data
  const { data: selectedVersionsData = [] } = useGetPreviewQuery(
    { projectName, versionIds: selected },
    { skip: !selected.length || !projectName },
  )

  // get all versions for the product ids of the selected versions
  const selectedProductIds = selectedVersionsData?.map(({ productId }) => productId)
  const { data: allVersionsData = [] } = useGetPreviewVersionsQuery(
    { productIds: selectedProductIds, projectName },
    { skip: !selectedProductIds.length },
  )

  console.log(allVersionsData)

  return (
    <Styled.Container>
      <Styled.Header>
        <VersionSelectorTool versions={[]} selected={selected} />
        <Button onClick={onClose} icon={'close'} />
      </Styled.Header>
      <Styled.Content>
        <h2>Selected Version: {selected.join(', ')}</h2>
      </Styled.Content>
    </Styled.Container>
  )
}

export default Preview
