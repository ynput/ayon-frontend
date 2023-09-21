import React, { useLayoutEffect, useState } from 'react'
import * as Styled from './HierarchyPreview.styled'
import { Button, Icon } from '@ynput/ayon-react-components'

const HierarchyPreview = ({ hierarchy = [], error }) => {
  const [hideChildren, setHideChildren] = useState([])

  useLayoutEffect(() => {
    // by default all children are hidden except for the first index
    const hiddenIds = hierarchy.map((item) => item.id).filter((_, i) => i !== 0)
    setHideChildren(hiddenIds)
  }, [hierarchy])

  const handleHideChildrenChange = (id) => {
    setHideChildren((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  return (
    <Styled.Parent>
      {hierarchy.map((item) => (
        <React.Fragment key={item.id}>
          <Styled.Row $depth={item.depth}>
            {!item.leaf && (
              <Button
                variant="text"
                icon={hideChildren.includes(item.id) ? 'add' : 'remove'}
                className="toggle"
                onClick={() => handleHideChildrenChange(item.id)}
              />
            )}
            <span>{item.label}</span>
          </Styled.Row>
          {!hideChildren.includes(item.id) && !!item.children?.length && (
            <HierarchyPreview hierarchy={item.children} />
          )}
        </React.Fragment>
      ))}
      {error && (
        <Styled.Error>
          <Icon icon="error" />
          Error: {error}
        </Styled.Error>
      )}
    </Styled.Parent>
  )
}

export default HierarchyPreview
