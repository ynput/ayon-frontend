type GroupByOption = {
  id: string
  label: string
  sortOrder: boolean
  sortByEnumOrder?: boolean // sort based on the index of the value in the enum attribute
}

const groupByOptions: GroupByOption[] = [
  { id: 'folderName', label: 'Folder', sortOrder: true },
  { id: 'status', label: 'Status', sortOrder: true, sortByEnumOrder: true },
  { id: 'priority', label: 'Priority', sortOrder: true, sortByEnumOrder: true },
  { id: 'taskType', label: 'Type', sortOrder: true },
  { id: 'projectName', label: 'Project', sortOrder: true },
]

const assigneesGroupBy = {
  id: 'assignees',
  label: 'Assignee',
  sortOrder: true,
  sortByEnumOrder: true,
}

export const getGroupByOptions = (includeAssignees: boolean) => {
  const options = [...groupByOptions]
  if (includeAssignees) {
    options.push(assigneesGroupBy)
  }

  return options
}
