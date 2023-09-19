import React from 'react'
import FolderSequence from './FolderSequence'

function FolderHierarchy({ hierarchy = [], onChange, onNew }) {
  return (
    <>
      {hierarchy.map((item, index) => (
        <FolderSequence key={item.id} onChange={onChange} {...item} onNew={onNew} index={index}>
          {item.children && (
            <FolderHierarchy hierarchy={item.children} onChange={onChange} onNew={onNew} />
          )}
        </FolderSequence>
      ))}
    </>
  )
}

export default FolderHierarchy
