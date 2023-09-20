import React from 'react'
import FolderSequence from './FolderSequence'
import * as Styled from './FolderSequence.styled'

function FolderHierarchy({ hierarchy = [], onChange, onNew }) {
  return (
    <Styled.Container>
      {hierarchy.map((item, index) => (
        <FolderSequence
          key={item.id}
          onChange={onChange}
          {...item}
          onNew={onNew}
          index={index}
          childTypes={item.children.map((c) => c.entityType)}
        >
          {item.children && (
            <FolderHierarchy hierarchy={item.children} onChange={onChange} onNew={onNew} />
          )}
        </FolderSequence>
      ))}
    </Styled.Container>
  )
}

export default FolderHierarchy
