// get a value using a field string from an object
// get attrib.fps from {name: 'test', attrib: {fps: 10}}
const getFieldInObject = (field = '', object = {}) => {
  // split by period
  const keys = field.split('.')
  // copy object
  let value = { ...object }
  for (const key of keys) {
    if (value) {
      // get value and set for next loop
      value = value[key]
    }
  }
  return value
}

export default getFieldInObject
