export type FilterValue = {
  id: string
  value?: string
  label: string
  img?: string | null
  icon?: string | null
  color?: string | null
  isCustom?: boolean
  parentId?: string | null
}

export type Filter = {
  id: string
  label: string
  inverted?: boolean
  icon?: string | null
  img?: string | null
  values?: FilterValue[]
  isCustom?: boolean
  singleSelect?: boolean
}

export interface Option extends Filter {
  allowsCustomValues?: boolean
  color?: string | null
  parentId?: string | null
}

export const filterOptions: Option[] = [
  {
    id: 'assignee',
    label: 'Assignee',
    icon: 'person',
    inverted: false,
    values: [
      {
        id: 'demouser32',
        value: 'demouser32',
        label: 'Becky Cruz',
        img: '/api/users/demouser32/avatar',
        icon: null,
      },
      {
        id: 'demouser18',
        value: 'demouser18',
        label: 'Felix Petersen',
        img: '/api/users/demouser18/avatar',
        icon: null,
      },
      {
        id: 'demouser19',
        value: 'demouser19',
        label: 'Anja Grøndalen',
        img: '/api/users/demouser19/avatar',
        icon: null,
      },
      {
        id: 'demouser20',
        value: 'demouser20',
        label: 'Nina Pedersen',
        img: '/api/users/demouser20/avatar',
        icon: null,
      },
      {
        id: 'demouser21',
        value: 'demouser21',
        label: 'Mia Hansen',
        img: '/api/users/demouser21/avatar',
        icon: null,
      },
      {
        id: 'demouser22',
        value: 'demouser22',
        label: 'Mia Hansen',
        img: '/api/users/demouser22/avatar',
        icon: null,
      },
      {
        id: 'demouser23',
        value: 'demouser23',
        label: 'Mia Hansen',
        img: '/api/users/demouser23/avatar',
        icon: null,
      },
      {
        id: 'demouser24',
        value: 'demouser24',
        label: 'Mia Hansen',
        img: '/api/users/demouser24/avatar',
        icon: null,
      },
      {
        id: 'demouser25',
        value: 'demouser25',
        label: 'Mia Hansen',
        img: '/api/users/demouser25/avatar',
        icon: null,
      },
      {
        id: 'demouser26',
        value: 'demouser26',
        label: 'Mia Hansen',
        img: '/api/users/demouser26/avatar',
        icon: null,
      },
      {
        id: 'demouser27',
        value: 'demouser27',
        label: 'Mia Hansen',
        img: '/api/users/demouser27/avatar',
        icon: null,
      },
      {
        id: 'demouser28',
        value: 'demouser28',
        label: 'Mia Hansen',
        img: '/api/users/demouser28/avatar',
        icon: null,
      },
      {
        id: 'demouser29',
        value: 'demouser29',
        label: 'Mia Hansen',
        img: '/api/users/demouser29/avatar',
        icon: null,
      },
      {
        id: 'demouser30',
        value: 'demouser30',
        label: 'Mia Hansen',
        img: '/api/users/demouser30/avatar',
        icon: null,
      },
    ],
  },
  {
    id: 'status',
    label: 'Status',
    icon: 'arrow_circle_right',
    inverted: false,
    values: [
      {
        id: 'approved',
        value: 'approved',
        label: 'Approved',
        img: null,
        icon: 'check_circle',
        color: 'lightgreen',
      },
      {
        id: 'pending',
        value: 'pending',
        label: 'Pending',
        img: null,
        icon: 'schedule',
        color: 'orange',
      },
      {
        id: 'rejected',
        value: 'rejected',
        label: 'Rejected',
        img: null,
        icon: 'cancel',
        color: 'red',
      },
    ],
  },
  {
    id: 'priority',
    label: 'Priority',
    icon: 'priority_high',
    inverted: false,
    values: [
      {
        id: 'high',
        value: 'high',
        label: 'High',
        img: null,
        icon: 'priority_high',
        color: 'red',
      },
      {
        id: 'medium',
        value: 'medium',
        label: 'Medium',
        img: null,
        icon: 'priority_medium',
        color: 'orange',
      },
      {
        id: 'low',
        value: 'low',
        label: 'Low',
        img: null,
        icon: 'priority_low',
        color: 'lightgreen',
      },
    ],
  },
  {
    id: 'taskType',
    label: 'Task Type',
    icon: 'check_circle',
  },
]

// status: approved
const initStatus = {
  ...filterOptions[2],
  values: filterOptions[2].values ? [filterOptions[2].values[0]] : [],
}
// assignee: demouser32, demouser18
const initAssignee = {
  ...filterOptions[1],
  values: filterOptions[1].values ? [filterOptions[1].values[0], filterOptions[1].values[1]] : [],
}
export const initFilter = [initStatus]
