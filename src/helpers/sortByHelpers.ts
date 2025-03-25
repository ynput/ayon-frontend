type TreeNode = {
  name: string,
  data: {
    label?: string;
  }
}

const sortByLabelAndName = (array: TreeNode[]): TreeNode[] => {
  const sortFunc = (a: TreeNode, b: TreeNode): number => {
    let x, y

    x = a.data.label || a.name
    y = b.data.label || b.name

    return x.toLowerCase().localeCompare(y.toLowerCase())
  }

  array.sort(sortFunc)
  return array
}

export { sortByLabelAndName }
