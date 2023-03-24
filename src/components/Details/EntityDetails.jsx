import React from 'react'
import PropTypes from 'prop-types'
import { Panel } from '@ynput/ayon-react-components'
import ThumbnailGallery from './ThumbnailGallery'
import AttributeTable from '/src/containers/attributeTable'

const EntityDetails = ({ nodes = [], typeFields = [], type, extraAttrib = [] }) => {
  if (nodes.length === 0) return null

  const isMultiple = nodes.length > 1

  let attribsData = {}
  if (isMultiple) {
    const addAttribs = (attrib, acc) => {
      for (const key in attrib) {
        if (!acc[key]) {
          acc[key] = []
        }
        acc[key].push(attrib[key])
      }
    }
    // reformat data, check if all nodes have the same attribs values
    // if they are different, display Multiple(value1, value2)
    // if they are the same, display value1
    const attribs = {}
    for (const node of nodes) {
      addAttribs(node.extraAttrib, attribs)
      addAttribs(node.attrib, attribs)
    }

    for (const key in attribs) {
      const values = attribs[key]

      let uniqueValues = []
      if (Array.isArray(values[0])) {
        // if array flatten it
        uniqueValues = [...new Set(values.flat())]
      } else {
        uniqueValues = [...new Set(values)]
      }

      // compare arrays if they are arrays
      if (uniqueValues.length > 1 && uniqueValues.flat().length > 1) {
        attribsData[key] = `Multiple(${uniqueValues
          .map((v) => (v?.length || typeof v === 'number' ? v : 'null'))
          .join(', ')})`
      } else {
        attribsData[key] = uniqueValues[0]
      }
    }
  } else {
    attribsData = { ...nodes[0].extraAttrib, ...nodes[0].attrib }
  }

  return (
    <Panel style={{ height: '100%', overflow: 'hidden' }}>
      <ThumbnailGallery
        thumbnails={nodes.map((n) => ({
          id: n.id,
          name: n.name,
          updatedAt: n.updatedAt,
        }))}
        type={type}
      />
      <AttributeTable
        entityType={type}
        data={attribsData}
        additionalData={typeFields}
        extraFields={extraAttrib}
        style={{
          overflow: 'auto',
        }}
      />
    </Panel>
  )
}

EntityDetails.propTypes = {
  type: PropTypes.oneOf(['version', 'subset', 'folder', 'task']),
  nodes: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      id: PropTypes.string,
      attrib: PropTypes.object.isRequired,
      extraAttrib: PropTypes.object.isRequired,
    }),
  ),
  extraAttrib: PropTypes.arrayOf(PropTypes.shape({ name: PropTypes.string.isRequired })),
}

export default EntityDetails
