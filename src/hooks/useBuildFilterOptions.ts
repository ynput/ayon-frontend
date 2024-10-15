// entityType
// users
// status by scope
// attributes by scope

import { AttributeModel, AttributeEnumItem, AttributeData } from '@api/rest/attributes'
import { Tag } from '@api/rest/project'
import { Option } from '@components/SearchFilter/types'
import getEntityTypeIcon from '@helpers/getEntityTypeIcon'
import { useGetAttributeListQuery } from '@queries/attributes/getAttributes'
import {
  GetProjectsInfoResponse,
  useGetKanbanProjectUsersQuery,
  useGetProjectsInfoQuery,
} from '@queries/userDashboard/getUserDashboard'
import { productTypes } from '@state/project'
import { isEmpty, upperFirst } from 'lodash'

type Scope = 'folder' | 'product' | 'task' | 'user'
type FilterFieldType = 'entitySubType' | ('users' | 'assignees') | 'attributes' | 'status'
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

export type BuildFilterOptions = {
  filterTypes: FilterFieldType[]
  projectNames: string[]
  scope: Scope
  attributesData?: Record<string, AttributeDataValue[]>
  tagsData?: string[]
}

const useBuildFilterOptions = ({
  filterTypes,
  projectNames,
  scope,
  attributesData = {},
  tagsData = [],
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

  // add entitySubType option
  if (filterTypes.includes('entitySubType') && scope !== 'user') {
    const entitySubTypeOption: Option = {
      id: `${scope}Type`,
      label: `${upperFirst(scope)} Type`,
      icon: getEntityTypeIcon(scope),
      inverted: false,
      values: [],
      allowsCustomValues: false,
    }

    // get all subTypes for the current scope (entityType)
    let subTypes = getSubTypes(projectsInfo, scope)

    entitySubTypeOption.values?.push(...subTypes)

    options.push(entitySubTypeOption)
  }

  // add status option
  if (filterTypes.includes('status')) {
    const statusOption: Option = {
      id: 'status',
      label: 'Status',
      icon: 'arrow_circle_right',
      inverted: false,
      values: [],
      allowsCustomValues: false,
    }

    Object.values(projectsInfo).forEach((project) => {
      const statuses = project?.statuses || []
      statuses.forEach((status) => {
        if (!statusOption.values?.some((value) => value.id === status.name)) {
          statusOption.values?.push({
            id: status.name,
            value: status.name,
            label: status.name,
            icon: status.icon,
            color: status.color,
          })
        }
      })
    })

    options.push(statusOption)
  }

  // add users/assignees option
  if (filterTypes.includes('users') || filterTypes.includes('assignees')) {
    const isAssignees = filterTypes.includes('assignees')
    const usersOption: Option = {
      id: isAssignees ? 'assignee' : 'user',
      label: isAssignees ? 'Assignee' : 'User',
      icon: 'person',
      inverted: false,
      values: [],
      allowsCustomValues: false,
    }

    // add every user for the projects (skip duplicates)
    projectUsers.forEach((user) => {
      if (!usersOption.values?.some((value) => value.id === user.name)) {
        usersOption.values?.push({
          id: user.name,
          value: user.name,
          label: user.attrib.fullName || user.name,
          img: `/api/users/${user.name}/avatar`,
          icon: null,
        })
      }
    })

    options.push(usersOption)
  }

  // add tags options
  if (tagsData.length > 0) {
    const tagsOption: Option = {
      id: 'tags',
      label: 'Tags',
      icon: 'local_offer',
      inverted: false,
      values: [],
      allowsCustomValues: true,
    }

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
    tagsData.forEach((tag) => {
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

  // dynamically add attributes options
  if (filterTypes.includes('attributes')) {
    const attributesByScope = attributes.filter((attribute) => attribute.scope?.includes(scope))
    // if attributesData is provided, filter out attributes that are not in the attributesData
    const attributesByValues = !isEmpty(attributesData)
      ? attributesByScope.filter((attribute) => attributesData[attribute.name])
      : attributesByScope

    attributesByValues.forEach((attribute) => {
      // for the attribute, get the option root
      const option = getAttributeFieldOptionRoot(attribute, true)

      const realData = attributesData[attribute.name]
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
        const options = getAttributeOptions(realData, enums)
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
        const options = [
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
        optionValues.push(...options)
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
      taskTypes.forEach((taskType) => {
        if (!options.some((option) => option.id === taskType.name)) {
          options.push({
            id: taskType.name,
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
      folderTypes.forEach((folderType) => {
        if (!options.some((option) => option.id === folderType.name)) {
          options.push({
            id: folderType.name,
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

const getAttributeFieldOptionRoot = (
  attribute: AttributeModel,
  allowsCustomValues: boolean = false,
): Option => ({
  id: attribute.name,
  label: attribute.data.title || attribute.name,
  values: [],
  allowsCustomValues,
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
    resolutionWidth: 'fit_width',
    resolutionHeight: 'height',
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
): Option[] => {
  const enumOptions: Option[] = []
  const options: (Option & { count: number })[] = []

  // add the enum values first
  if (enums) {
    enums.forEach((enumItem) => {
      enumOptions.push({
        id: enumItem.value.toString(),
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
