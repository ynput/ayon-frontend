import React from 'react'
import * as Styled from './HierarchyPreview.styled'
import HierarchyPreview from './HierarchyPreview'

const HierarchyPreviewWrapper = ({ hierarchy = [], error }) => {
  return (
    <Styled.Preview>
      <HierarchyPreview hierarchy={hierarchy} error={error} />
    </Styled.Preview>
  )
}

export default HierarchyPreviewWrapper
