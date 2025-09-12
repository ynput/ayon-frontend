import { getAttributeIcon } from '@shared/util'
import {
  useGetSiteInfoQuery,
  useGetKanbanProjectUsersQuery,
  useGetProjectsInfoQuery,
} from '@shared/api'
import type {
  GetProjectsInfoResponse,
  FolderType,
  Status,
  Tag,
  TaskType,
  AttributeModel,
  AttributeEnumItem,
  AttributeData,
  ProductTypeOverride,
} from '@shared/api'
import { ColumnOrderState } from '@tanstack/react-table'
import { Icon, Option } from '@ynput/ayon-react-components'
import { dateOptions } from './filterDates'
import { isEmpty } from 'lodash'

type Scope = 'folder' | 'product' | 'task' | 'user' | 'version'
export type FilterFieldType =
  | 'folderType'
  | 'taskType'
  | 'productType'
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

type FilterConfig = {
  enableExcludes?: boolean
  enableOperatorChange?: boolean
  enableRelativeValues?: boolean
  prefixes?: Partial<Record<FilterFieldType, string>> // strings that will be prepended to the id of the option
  keys?: Partial<Record<FilterFieldType, string>> // replaces the default keys for the filter
}

export type BuildFilterOptions = {
  filterTypes: FilterFieldType[]
  projectNames: string[]
  scope: Scope
  data: {
    tags?: string[]
    attributes?: Record<string, AttributeDataValue[]>
    assignees?: string[]
  }
  columnOrder?: ColumnOrderState
  config?: FilterConfig
  power?: boolean
}

export const useBuildFilterOptions = ({
  filterTypes,
  projectNames,
  scope,
  data,
  config,
  columnOrder = [],
  power,
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

  const { data: info } = useGetSiteInfoQuery(
    { full: true },
    { skip: !filterTypes.includes('attributes') },
  )
  const { attributes = [] } = info || {}
  //
  //
  // QUERIES

  // ADD OPTIONS

  // TASK TYPE
  // add taskType option
  if (filterTypes.includes('taskType') && scope !== 'user') {
    const entitySubTypeOption = getOptionRoot('taskType', {
      ...config,
      enableOperatorChange: false,
    })
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
    const entitySubTypeOption = getOptionRoot('folderType', {
      ...config,
      enableOperatorChange: false,
    })
    if (entitySubTypeOption) {
      // get all subTypes for the current scope (entityType)
      let subTypes = getSubTypes(projectsInfo, 'folder')

      entitySubTypeOption.values?.push(...subTypes)

      options.push(entitySubTypeOption)
    }
  }

  // PRODUCT TYPE
  // add productType option
  if (filterTypes.includes('productType') && scope !== 'user') {
    const entitySubTypeOption = getOptionRoot('productType', {
      ...config,
      enableOperatorChange: false,
    })
    if (entitySubTypeOption) {
      // get all subTypes for the current scope (entityType)
      let subTypes = getSubTypes(projectsInfo, 'product')
      entitySubTypeOption.values?.push(...subTypes)
      options.push(entitySubTypeOption)
    }
  }

  // STATUS
  // add status option
  if (filterTypes.includes('status')) {
    const statusOption = getOptionRoot('status', { ...config, enableOperatorChange: false })

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
    const assigneesOption = getOptionRoot('assignees', config)

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
    const tagsOption = getOptionRoot('tags', config)

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

    const attributesWithoutDates = config?.enableRelativeValues
      ? attributesByValues
      : attributesByValues.filter((attribute) => attribute.data.type !== 'datetime')

    attributesWithoutDates.forEach((attribute) => {
      const realData = data.attributes && data.attributes[attribute.name]
      const enums = attribute.data.enum
      const type = attribute.data.type

      const isListOf = [
        'list_of_strings',
        'list_of_integers',
        'list_of_any',
        'list_of_submodels',
      ].includes(type)
      const isDate = type === 'datetime'
      const enableOperatorChange = isListOf ? config?.enableOperatorChange : false
      const enableRelativeValues = isListOf || isDate ? config?.enableRelativeValues : false
      // for the attribute, get the option root
      const option = getAttributeFieldOptionRoot(attribute, {
        ...config,
        allowsCustomValues: true,
        enableOperatorChange: enableOperatorChange,
        enableRelativeValues: enableRelativeValues,
      })

      const suggestValuesForTypes: AttributeData['type'][] = [
        'string',
        'integer',
        'float',
        'list_of_strings',
        'list_of_integers',
      ]

      const optionValues: Option[] = []

      // if the attribute type is in the suggestValuesForTypes, get the options based on real values
      if (suggestValuesForTypes.includes(type)) {
        const options = getAttributeOptions(realData, enums, type)
        optionValues.push(...options)
      }

      // if the attribute type is boolean, add yes/no options
      if (type === 'boolean') {
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

      if (isDate) {
        optionValues.push(
          ...dateOptions.map((o) => ({
            ...o,
            contentAfter: power ? undefined : <Icon icon="bolt" />,
          })),
        )
      }

      // add option to the list of options
      option.values?.push(...optionValues)

      // add option to the list of options
      options.push(option)
    })
  }

  // order options by columnOrder
  if (columnOrder) {
    return sortOptionsBasedOnColumns(options, columnOrder)
  } else return options
}

// HELPER FUNCTIONS
//
//
//
//
const getSubTypes = (projectsInfo: GetProjectsInfoResponse, type: Scope): Option[] => {
  const options: Option[] = []
  if (type === 'product') {


    Object.values(projectsInfo).forEach((project) => {
      // for each project, get all productTypes and add them to the options (if they don't already exist)
      const productTypes = project?.config?.productTypes?.default || []
      productTypes.forEach((productType: ProductTypeOverride) => {
        if (!options.some((option) => option.id === productType.name)) {
          options.push({
            id: productType.name,
            type: 'string',
            label: productType.name,
            icon: getAttributeIcon('product', productType.icon),
            inverted: false,
            values: [],
            allowsCustomValues: false,
          })
        }
      })

    })


    /*
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
    */

  } else if (type === 'task') {
    Object.values(projectsInfo).forEach((project) => {
      // for each project, get all task types and add them to the options (if they don't already exist)
      const taskTypes = project?.taskTypes || []
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
      const folderTypes = project?.folderTypes || []
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

const getFormattedId = (base: string, fieldType: FilterFieldType, config?: FilterConfig) => {
  const { prefixes, keys } = config || {}
  if (keys && fieldType in keys) {
    return `${keys[fieldType]}`
  } else if (prefixes && fieldType in prefixes) {
    return `${prefixes[fieldType]}${base}`
  } else return base
}

const getOptionRoot = (fieldType: FilterFieldType, config?: FilterConfig) => {
  const getRootIdWithPrefix = (base: string) => getFormattedId(base, fieldType, config)

  let rootOption: Option | null = null
  switch (fieldType) {
    case 'taskType':
      rootOption = {
        id: getRootIdWithPrefix(`taskType`),
        type: 'string',
        label: `Task Type`,
        icon: getAttributeIcon('task'),
        inverted: false,
        operator: 'OR',
        values: [],
        allowsCustomValues: false,
        allowHasValue: false,
        allowNoValue: false,
        allowExcludes: config?.enableExcludes,
        operatorChangeable: false,
      }
      break
    case 'folderType':
      rootOption = {
        id: getRootIdWithPrefix(`folderType`),
        type: 'string',
        label: `Folder Type`,
        icon: getAttributeIcon('folder'),
        inverted: false,
        operator: 'OR',
        values: [],
        allowsCustomValues: false,
        allowHasValue: false,
        allowNoValue: false,
        allowExcludes: config?.enableExcludes,
        operatorChangeable: false,
      }
      break
    case 'productType':
      rootOption = {
        id: getRootIdWithPrefix(`productType`),
        type: 'string',
        label: `Product Type`,
        icon: getAttributeIcon('product'),
        inverted: false,
        operator: 'OR',
        values: [],
        allowsCustomValues: false,
        allowHasValue: false,
        allowNoValue: false,
        allowExcludes: config?.enableExcludes,
        operatorChangeable: false,
      }
      break
    case 'status':
      rootOption = {
        id: getRootIdWithPrefix('status'),
        type: 'string',
        label: 'Status',
        icon: getAttributeIcon('status'),
        inverted: false,
        operator: 'OR',
        values: [],
        allowsCustomValues: false,
        allowHasValue: false,
        allowNoValue: false,
        allowExcludes: config?.enableExcludes,
        operatorChangeable: false,
      }
      break
    case 'assignees':
      rootOption = {
        id: getRootIdWithPrefix('assignees'),
        type: 'list_of_strings',
        label: 'Assignee',
        icon: getAttributeIcon('assignees'),
        inverted: false,
        operator: 'OR',
        values: [],
        allowsCustomValues: false,
        allowHasValue: config?.enableRelativeValues,
        allowNoValue: config?.enableRelativeValues,
        allowExcludes: config?.enableExcludes,
        operatorChangeable: config?.enableOperatorChange,
      }
      break
    case 'tags':
      rootOption = {
        id: getRootIdWithPrefix('tags'),
        type: 'list_of_strings',
        label: 'Tags',
        icon: getAttributeIcon('tags'),
        inverted: false,
        operator: 'OR',
        values: [],
        allowsCustomValues: true,
        allowHasValue: config?.enableRelativeValues,
        allowNoValue: config?.enableRelativeValues,
        allowExcludes: config?.enableExcludes,
        operatorChangeable: config?.enableOperatorChange,
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
  config: FilterConfig & { allowsCustomValues: boolean },
): Option => ({
  id: getFormattedId(attribute.name, 'attributes', config),
  type: attribute.data.type,
  label: attribute.data.title || attribute.name,
  operator: 'OR',
  inverted: false,
  values: [],
  allowsCustomValues: config?.allowsCustomValues,
  allowHasValue: config.enableRelativeValues,
  allowNoValue: config.enableRelativeValues,
  allowExcludes: config?.enableExcludes,
  operatorChangeable: config?.enableOperatorChange,
  icon: getAttributeIcon(attribute.name, attribute.data.type, !!attribute.data.enum?.length),
  singleSelect: ['boolean', 'datetime'].includes(attribute.data.type),
})

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

const sortOptionsBasedOnColumns = (options: Option[], columnOrder: ColumnOrderState) => {
  const columnOrderWithSubTypes = columnOrder.flatMap((col) => {
    if (col === 'subType') {
      return ['taskType', 'folderType']
    }
    return col
  })
  return [...options].sort((a, b) => {
    const aIndex = columnOrderWithSubTypes.indexOf(a.id.replace('.', '_'))
    const bIndex = columnOrderWithSubTypes.indexOf(b.id.replace('.', '_'))

    // If both options are in columnOrder, sort them based on their index in columnOrder
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex
    }

    // If only one of the options is in columnOrder, sort the one in columnOrder first
    if (aIndex !== -1) {
      return -1
    }
    if (bIndex !== -1) {
      return 1
    }

    // If neither option is in columnOrder, keep their original order
    return 0
  })
}
