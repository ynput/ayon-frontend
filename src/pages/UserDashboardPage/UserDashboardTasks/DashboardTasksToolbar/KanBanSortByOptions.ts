type SortByOption = {
  id: string
  label: string
  sortOrder: boolean
  sortByEnumOrder?: boolean // sort based on the index of the value in the enum attribute
  fallbacks?: string[]
}

const sortByOptions: SortByOption[] = [
  { id: 'label', fallbacks: ['name'], label: 'Task', sortOrder: true },
  { id: 'folderName', label: 'Folder', sortOrder: true },
  { id: 'status', label: 'Status', sortOrder: true },
  { id: 'priority', label: 'Priority', sortOrder: true, sortByEnumOrder: true },
  { id: 'endDate', label: 'Due Date', sortOrder: true },
]

export default sortByOptions
