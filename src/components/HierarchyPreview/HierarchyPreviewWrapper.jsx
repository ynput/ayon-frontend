import React from 'react'
import * as Styled from './HierarchyPreview.styled'
import HierarchyPreview from './HierarchyPreview'

const HierarchyPreviewWrapper = ({ hierarchy = [] }) => {
  return (
    <Styled.Preview>
      <HierarchyPreview hierarchy={hierarchy} />
    </Styled.Preview>
  )
}

export default HierarchyPreviewWrapper
