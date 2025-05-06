// @ts-nocheck
import { format } from 'date-fns'

const formatAttributesData = (nodes = []) => {
  try {
    let attribsData = {}
    const isMultiple = nodes.length > 1
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
      // if they are different, display Mixed(value1, value2)
      // if they are the same, display value1
      const attribs = {}
      for (const node of nodes) {
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
          if (key.includes('Date')) {
            attribsData[key] = `Mixed(${uniqueValues
              .map((v) => (v ? format(new Date(v), 'dd/MM/yyyy') : 'null'))
              .join(', ')})`
          } else {
            attribsData[key] = `Mixed(${uniqueValues
              .map((v) => (v?.length || typeof v === 'number' ? v : 'null'))
              .join(', ')})`
          }
        } else {
          attribsData[key] = uniqueValues[0]
        }
      }
    } else if (nodes.length === 1) {
      attribsData = { ...nodes[0].attrib }
    }

    return attribsData
  } catch (error) {
    console.error(error)
    return {}
  }
}

export default formatAttributesData
