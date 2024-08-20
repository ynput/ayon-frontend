const sortByLabelAndName = (array) => {
  const sortFunc = (a, b) => {
    let x, y
    if (a.data.label !== undefined || !b.data.label !== undefined) {
      x = a.data.label
      y = b.data.label
    } else {
      x = a.name
      y = a.name.toLowerCase()
    }

    return x.toLowerCase().localeCompare(y.toLowerCase())
  }

  array.sort(sortFunc)
  return array
}

export { sortByLabelAndName }
