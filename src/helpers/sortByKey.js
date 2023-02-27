import { isString } from 'lodash'

const sortByKey = (array, key) => {
  // Return a copy of array of objects sorted
  // by the given key
  return array.sort(function (a, b) {
    var x = a[key]
    var y = b[key]

    // check if string and put to lowercase
    if (isString(x)) {
      x = x.toLowerCase()
      y = y.toLowerCase()
    }

    return x < y ? -1 : x > y ? 1 : 0
  })
}

export default sortByKey
