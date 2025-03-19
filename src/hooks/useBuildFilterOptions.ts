// entityType
// users
// status by scope
// attributes by scope

import { AttributeModel, AttributeEnumItem, AttributeData } from '@api/rest/attributes'
import { FolderType, Status, Tag, TaskType } from '@api/rest/project'
import { ALLOW_INVERTED_FILTERS, SHOW_DATE_FILTERS } from '@components/SearchFilter/featureFlags'
import { Option } from '@components/SearchFilter/types'
import getEntityTypeIcon from '@helpers/getEntityTypeIcon'
import { useGetAttributeListQuery } from '@queries/attributes/getAttributes'
import {
  GetProjectsInfoResponse,
  useGetKanbanProjectUsersQuery,
  useGetProjectsInfoQuery,
} from '@queries/userDashboard/getUserDashboard'
import { productTypes } from '@state/project'
import {
  addMonths,
  addWeeks,
  addYears,
  isAfter,
  isBefore,
  isSameMonth,
  isSameWeek,
  isSameYear,
  isToday,
  isYesterday,
} from 'date-fns'
import { isEmpty } from 'lodash'

type Scope = 'folder' | 'product' | 'task' | 'user'
export type FilterFieldType =
  | 'folderType'
  | 'taskType'
  | ('users' | 'assignees')
  | 'attributes'
  | 'status'
  | 'tags'
type AttributeType =
  | string
  | number
  | boolean
  | Date
  | string[]
  | number[]
  | any[]
  | { [key: string]: any }

type AttributeDataValue = AttributeType | null | undefined

export const filterDateFunctions = {
  today: (date: Date) => isToday(date),
  yesterday: (date: Date) => isYesterday(date),
  ['after-now']: (date: Date) => isAfter(date, new Date()),
  ['before-now']: (date: Date) => isBefore(new Date(), date),
  ['this-week']: (date: Date) => isSameWeek(date, new Date()),
  ['last-week']: (date: Date) => isSameWeek(date, addWeeks(new Date(), -1)),
  ['this-month']: (date: Date) => isSameMonth(date, new Date()),
  ['last-month']: (date: Date) => isSameMonth(date, addMonths(new Date(), -1)),
  ['this-year']: (date: Date) => isSameYear(date, new Date()),
  ['last-year']: (date: Date) => isSameYear(date, addYears(new Date(), -1)),
}

type DateOptionType = keyof typeof filterDateFunctions

const dateOptions: (Option & { id: DateOptionType })[] = [
  {
    id: 'today',
    label: 'Today',
    values: [],
    icon: 'today',
  },
  {
    id: 'yesterday',
    label: 'Yesterday',
    values: [],
    icon: 'date_range',
  },
  {
    id: 'after-now',
    label: 'After Now',
    values: [],
    icon: 'event_upcoming',
  },
  {
    id: 'before-now',
    label: 'Before Now',
    values: [],
    icon: 'event_busy',
  },
  {
    id: 'this-week',
    label: 'This Week',
    values: [],
    icon: 'date_range',
  },
  {
    id: 'last-week',
    label: 'Last Week',
    values: [],
    icon: 'date_range',
  },
  {
    id: 'this-month',
    label: 'This Month',
    values: [],
    icon: 'calendar_month',
  },
  {
    id: 'last-month',
    label: 'Last Month',
    values: [],
    icon: 'calendar_month',
  },
  {
    id: 'this-year',
    label: 'This Year',
    values: [],
    icon: 'calendar_month',
  },
  {
    id: 'last-year',
    label: 'Last Year',
    values: [],
    icon: 'calendar_month',
  },
]

export type BuildFilterOptions = {
  filterTypes: FilterFieldType[]
  projectNames: string[]
  scope: Scope
  data: {
    tags?: string[]
    attributes?: Record<string, AttributeDataValue[]>
    assignees?: string[]
  }
}

const useBuildFilterOptions = ({
  filterTypes,
  projectNames,
  scope,
  data,
}: BuildFilterOptions): Option[] => {
  let options: Option[] = []

  // QUERIES
  //
  //
  const { data: projectsInfo = {} } = useGetProjectsInfoQuery(
    {
      projects: projectNames,
    },
    {
      skip:
        !projectNames?.length ||
        !['entitySubType', 'status'].some((type) => filterTypes.includes(type as FilterFieldType)),
    },
  )

  const { data: projectUsers = [] } = useGetKanbanProjectUsersQuery(
    { projects: projectNames },
    {
      skip:
        !projectNames?.length ||
        (!filterTypes.includes('users') && !filterTypes.includes('assignees')),
    },
  )

  const { data: attributes = [] } = useGetAttributeListQuery(undefined, {
    skip: !filterTypes.includes('attributes'),
  })
  //
  //
  // QUERIES

  // ADD OPTIONS

  // TASK TYPE
  // add taskType option
  if (filterTypes.includes('taskType') && scope !== 'user') {
    const entitySubTypeOption = getOptionRoot('taskType')
    if (entitySubTypeOption) {
      // get all subTypes for the current scope (entityType)
      let subTypes = getSubTypes(projectsInfo, 'task')

      entitySubTypeOption.values?.push(...subTypes)

      options.push(entitySubTypeOption)
    }
  }

  // FOLDER TYPE
  // add folderType option
  if (filterTypes.includes('folderType') && scope !== 'user') {
    const entitySubTypeOption = getOptionRoot('folderType')
    if (entitySubTypeOption) {
      // get all subTypes for the current scope (entityType)
      let subTypes = getSubTypes(projectsInfo, 'folder')

      entitySubTypeOption.values?.push(...subTypes)

      options.push(entitySubTypeOption)
    }
  }

  // STATUS
  // add status option
  if (filterTypes.includes('status')) {
    const statusOption = getOptionRoot('status')

    if (statusOption) {
      Object.values(projectsInfo).forEach((project) => {
        const statuses = project?.statuses || []
        statuses.forEach((status: Status) => {
          if (!statusOption.values?.some((value) => value.id === status.name)) {
            statusOption.values?.push({
              id: status.name,
              label: status.name,
              icon: status.icon,
              color: status.color,
            })
          }
        })
      })

      options.push(statusOption)
    }
  }

  // ASSIGNEES
  // add users/assignees option
  if (filterTypes.includes('assignees')) {
    const assigneesOption = getOptionRoot('assignees')

    if (assigneesOption) {
      // add every user for the projects (skip duplicates)
      projectUsers.forEach((user) => {
        if (!assigneesOption.values?.some((value) => value.id === user.name)) {
          assigneesOption.values?.push({
            id: user.name,
            label: user.attrib.fullName || user.name,
            img: `/api/users/${user.name}/avatar`,
            icon: null,
          })
        }
      })
      // sort the assignees based on the number of times they appear in data.assignees
      assigneesOption.values?.sort((a, b) => {
        const aCount = data.assignees?.filter((assignee) => assignee === a.id).length || 0
        const bCount = data.assignees?.filter((assignee) => assignee === b.id).length || 0
        return bCount - aCount
      })

      options.push(assigneesOption)
    }
  }

  // TAGS
  // add tags options
  if (filterTypes.includes('tags')) {
    const tagsOption = getOptionRoot('tags')

    if (tagsOption) {
      // reduce projectsInfo to get all tags
      const tagsAnatomy = new Map<string, Tag>()
      Object.values(projectsInfo).forEach((project) => {
        if (project?.tags) {
          project.tags.forEach((tag) => {
            if (!tagsAnatomy.has(tag.name)) {
              tagsAnatomy.set(tag.name, tag)
            }
          })
        }
      })

      // create options for each tag, finding color if in tagsAnatomy
      const tagOptionValuesMap = new Map<string, Option & { count: number }>()
      data.tags?.forEach((tag) => {
        const existingTag = tagOptionValuesMap.get(tag)
        if (existingTag) {
          // increment count
          existingTag.count++
          return
        } else {
          // create new tag
          const tagData = tagsAnatomy.get(tag)

          tagOptionValuesMap.set(tag, {
            id: tag,
            type: 'string',
            label: tag,
            values: [],
            color: tagData?.color || null,
            count: 1,
          })
        }
      })

      // convert values map to array and sort based on count
      const tagOptionValues = Array.from(tagOptionValuesMap.values()).sort(
        (a, b) => b.count - a.count,
      )

      // add tag options to the tagsOption
      tagsOption.values?.push(...tagOptionValues)

      options.push(tagsOption)
    }
  }

  // ATTRIBUTES
  // dynamically add attributes options
  if (filterTypes.includes('attributes')) {
    const attributesByScope = attributes.filter((attribute) => attribute.scope?.includes(scope))
    // if attributesData is provided, filter out attributes that are not in the attributesData
    const attributesByValues = !isEmpty(data.attributes)
      ? attributesByScope.filter((attribute) => data.attributes && data.attributes[attribute.name])
      : attributesByScope

    const attributesWithoutDates = SHOW_DATE_FILTERS
      ? attributesByValues
      : attributesByValues.filter((attribute) => attribute.data.type !== 'datetime')

    attributesWithoutDates.forEach((attribute) => {
      // for the attribute, get the option root
      const option = getAttributeFieldOptionRoot(attribute, true)

      const realData = data.attributes && data.attributes[attribute.name]
      const enums = attribute.data.enum

      const suggestValuesForTypes: AttributeData['type'][] = [
        'string',
        'integer',
        'float',
        'list_of_strings',
        'list_of_integers',
      ]

      const optionValues: Option[] = []

      // if the attribute type is in the suggestValuesForTypes, get the options based on real values
      if (suggestValuesForTypes.includes(attribute.data.type)) {
        const options = getAttributeOptions(realData, enums, attribute.data.type)
        optionValues.push(...options)
      }

      // if the attribute type is boolean, add yes/no options
      if (attribute.data.type === 'boolean') {
        const options = [
          {
            id: 'true',
            label: 'Yes',
            values: [],
            icon: 'radio_button_checked',
          },
          {
            id: 'false',
            label: 'No',
            values: [],
            icon: 'radio_button_unchecked',
          },
        ]
        optionValues.push(...options)
      }

      // if the attribute type is datetime, add datetime options

      if (attribute.data.type === 'datetime') {
        optionValues.push(...dateOptions)
      }

      // add option to the list of options
      option.values?.push(...optionValues)

      // add option to the list of options
      options.push(option)
    })
  }

  return options
}

export default useBuildFilterOptions

// HELPER FUNCTIONS
//
//
//
//
const getSubTypes = (projectsInfo: GetProjectsInfoResponse, type: Scope): Option[] => {
  const options: Option[] = []
  if (type === 'product') {
    Object.values(productTypes).forEach(({ icon, name }) => {
      options.push({
        id: name,
        type: 'string',
        label: name,
        icon: icon,
        inverted: false,
        values: [],
        allowsCustomValues: false,
      })
    })
  } else if (type === 'task') {
    Object.values(projectsInfo).forEach((project) => {
      // for each project, get all task types and add them to the options (if they don't already exist)
      const taskTypes = project?.task_types || []
      taskTypes.forEach((taskType: TaskType) => {
        if (!options.some((option) => option.id === taskType.name)) {
          options.push({
            id: taskType.name,
            type: 'string',
            label: taskType.name,
            icon: taskType.icon,
            inverted: false,
            values: [],
            allowsCustomValues: false,
          })
        }
      })
    })
  } else if (type === 'folder') {
    Object.values(projectsInfo).forEach((project) => {
      // for each project, get all folder types and add them to the options (if they don't already exist)
      const folderTypes = project?.folder_types || []
      folderTypes.forEach((folderType: FolderType) => {
        if (!options.some((option) => option.id === folderType.name)) {
          options.push({
            id: folderType.name,
            type: 'string',
            label: folderType.name,
            icon: folderType.icon,
            inverted: false,
            values: [],
            allowsCustomValues: false,
          })
        }
      })
    })
  }

  return options
}

const getOptionRoot = (fieldType: FilterFieldType) => {
  let rootOption: Option | null = null
  switch (fieldType) {
    case 'taskType':
      rootOption = {
        id: `taskType`,
        type: 'string',
        label: `Task Type`,
        icon: getEntityTypeIcon('task'),
        inverted: false,
        operator: 'OR',
        values: [],
        allowsCustomValues: false,
        allowHasValue: false,
        allowNoValue: false,
        allowExcludes: ALLOW_INVERTED_FILTERS,
        operatorChangeable: false,
      }
      break
    case 'folderType':
      rootOption = {
        id: `folderType`,
        type: 'string',
        label: `Folder Type`,
        icon: getEntityTypeIcon('folder'),
        inverted: false,
        operator: 'OR',
        values: [],
        allowsCustomValues: false,
        allowHasValue: false,
        allowNoValue: false,
        allowExcludes: ALLOW_INVERTED_FILTERS,
        operatorChangeable: false,
      }
      break
    case 'status':
      rootOption = {
        id: 'status',
        type: 'string',
        label: 'Status',
        icon: 'arrow_circle_right',
        inverted: false,
        operator: 'OR',
        values: [],
        allowsCustomValues: false,
        allowHasValue: false,
        allowNoValue: false,
        allowExcludes: ALLOW_INVERTED_FILTERS,
        operatorChangeable: false,
      }
      break
    case 'assignees':
      rootOption = {
        id: 'assignees',
        type: 'list_of_strings',
        label: 'Assignee',
        icon: 'person',
        inverted: false,
        operator: 'OR',
        values: [],
        allowsCustomValues: false,
        allowHasValue: true,
        allowNoValue: true,
        allowExcludes: ALLOW_INVERTED_FILTERS,
        operatorChangeable: true,
      }
      break
    case 'tags':
      rootOption = {
        id: 'tags',
        type: 'list_of_strings',
        label: 'Tags',
        icon: 'local_offer',
        inverted: false,
        operator: 'OR',
        values: [],
        allowsCustomValues: true,
        allowHasValue: true,
        allowNoValue: true,
        allowExcludes: ALLOW_INVERTED_FILTERS,
        operatorChangeable: true,
      }
      break
    default:
      break

    // Note: attributes are handled separately
  }

  return rootOption
}

const getAttributeFieldOptionRoot = (
  attribute: AttributeModel,
  allowsCustomValues: boolean = false,
): Option => ({
  id: `attrib.${attribute.name}`,
  type: attribute.data.type,
  label: attribute.data.title || attribute.name,
  operator: 'OR',
  inverted: false,
  values: [],
  allowsCustomValues,
  allowHasValue: false,
  allowNoValue: false,
  allowExcludes: false,
  operatorChangeable: false,
  icon: getAttributeIcon(attribute),
  singleSelect: ['boolean', 'datetime'].includes(attribute.data.type),
})

const getAttributeIcon = (attribute: AttributeModel): string => {
  let icon = 'format_list_bulleted'
  // some attributes have custom icons
  const customIcons: {
    [key: string]: string
  } = {
    priority: 'keyboard_double_arrow_up',
    fps: '30fps_select',
    resolutionWidth: 'settings_overscan',
    resolutionHeight: 'settings_overscan',
    pixelAspect: 'stop',
    clipIn: 'line_start_diamond',
    clipOut: 'line_end_diamond',
    frameStart: 'line_start_circle',
    frameEnd: 'line_end_circle',
    handleStart: 'line_start_square',
    handleEnd: 'line_end_square',
    fullName: 'id_card',
    email: 'alternate_email',
    developerMode: 'code',
    productGroup: 'inventory_2',
    machine: 'computer',
    comment: 'comment',
    colorSpace: 'palette',
    description: 'description',
  }

  const typeIcons: {
    [key: string]: string
  } = {
    integer: 'pin',
    float: 'pin',
    boolean: 'radio_button_checked',
    datetime: 'calendar_month',
  }

  if (customIcons[attribute.name]) {
    icon = customIcons[attribute.name]
  } else if (typeIcons[attribute.data.type]) {
    icon = typeIcons[attribute.data.type]
  }

  return icon
}

const getAttributeOptions = (
  values?: AttributeDataValue[],
  enums?: AttributeEnumItem[],
  type?: AttributeData['type'],
): Option[] => {
  const enumOptions: Option[] = []
  const options: (Option & { count: number })[] = []

  // add the enum values first
  if (enums) {
    enums.forEach((enumItem) => {
      enumOptions.push({
        id: enumItem.value.toString(),
        type: type,
        label: enumItem.label,
        values: [],
        icon: enumItem.icon,
        color: enumItem.color,
      })
    })
  }

  values?.forEach((value) => {
    // no value? do nothing
    if (!value) return

    let text = ''

    // convert value to text
    switch (typeof value) {
      case 'string':
      case 'number':
      case 'boolean':
        text = value.toString()
        break
      case 'object':
        if (Array.isArray(value)) {
          text = value.join(', ')
        } else {
          text = JSON.stringify(value)
        }
        break
      default:
        break
    }

    // create id for text value
    const id = text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')

    // check if the option already exists in enums
    const existingOption = enumOptions?.find((enumItem) => enumItem.id === id)
    if (existingOption) return

    // check if options already has the value, if so, increment the count
    const existingValue = options.find((option) => option.id === id)
    if (existingValue) {
      existingValue.count++
      return
    } else {
      // add option
      options.push({
        id,
        type: type,
        label: text,
        values: [],
        count: 1,
      })
    }
  })

  // sort options based on count
  options.sort((a, b) => b.count - a.count)

  // enum options first, then the rest
  return [...enumOptions, ...options]
}
