import {useMemo} from 'react'
import { Button } from '@ynput/ayon-react-components'
import * as Styled from './Preview.styled'
import VersionSelectorTool from '@components/VersionSelectorTool/VersionSelectorTool'
import { useGetReviewablesQuery, useGetPreviewQuery,useGetPreviewVersionsQuery } from '/src/services/preview/getPreview'
import { useDispatch } from 'react-redux'
import { updateSelection } from '/src/features/preview'
import PreviewDetailsPanel from './PreviewDetailsPanel'
import PreviewPlayer from './PreviewPlayer'

const Preview = ({ projectName, selected = [], onClose }) => {
  const dispatch = useDispatch()

  // get version preview data
  // TODO: this is temporary lazy fix to get the product id. Ideally, Preview should accept
  // productId as a prop
  const { data: selectedVersionsData = [], isFetching: isFetchingPreview } = useGetPreviewQuery(
    { projectName, versionIds: selected },
    { skip: !selected.length || !projectName },
  )


  // This should come from a prop
  const productId = selectedVersionsData[0]?.productId 

  // new query: returns all reviewables for a product
  const {data: allReviewables, isFetching: isFetchingReviewables} = useGetReviewablesQuery(
    { projectName, productId }, 
    { skip: !productId }
  )

  const versions = useMemo(() => {
    // Get a list of all versions that have reviewables
    if (!allReviewables?.length) return []
    const result = []
    const ids = []
    for (const reviewable of allReviewables || []) {
      if (ids.includes(reviewable.versionId)) continue
      ids.push(reviewable.versionId) 
      result.push({
        id: reviewable.versionId,
        name: reviewable.versionName,
        status: reviewable.status,
      })
    }
    return result
  }, [allReviewables])


  // This should not return the first reviewable, but there should be reviewable
  // selector in the UI
  const selectedReviewable = useMemo(() => {
    if (!selected.length) return null
    if (!allReviewables?.length) return null
    const res = allReviewables.find(({ versionId }) => versionId === selected[0])
    return res
  }, [selected, allReviewables])


  const handleVersionChange = (id) => {
    dispatch(updateSelection({ selected: [id] }))
  }

  const isLoadingAll = isFetchingPreview || isFetchingReviewables

  return (
    <Styled.Container>
      <Styled.Header>
        <VersionSelectorTool
          versions={versions}
          selected={selected[0]}
          isLoading={isLoadingAll}
          onChange={handleVersionChange}
        />
        <Button onClick={onClose} icon={'close'} />
      </Styled.Header>
      <Styled.Content>
        <PreviewPlayer
          projectName={projectName}
          reviewable={selectedReviewable}
        />
        <PreviewDetailsPanel selected={selected} projectName={projectName} />
      </Styled.Content>
    </Styled.Container>
  )
}

export default Preview
