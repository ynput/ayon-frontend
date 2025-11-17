import { getAttributeIcon, getEntityTypeIcon } from '@shared/util'
import {
  useGetEntityGroupsQuery,
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
  EntityGroup,
} from '@shared/api'
import { ColumnOrderState } from '@tanstack/react-table'
import { Icon, Option, Filter } from '@ynput/ayon-react-components'
import { dateOptions } from './filterDates'
import { isEmpty } from 'lodash'
import { SliceFilter } from '@shared/containers'
import { FEATURED_VERSION_TYPES } from '../FeaturedVersionOrder'
import { useGlobalContext } from '@shared/context'

type ScopeType = 'folder' | 'product' | 'task' | 'user' | 'version'
type Scope = ScopeType | ScopeType[]

export type ScopeWithFilterTypes = {
  scope: ScopeType
  filterTypes: FilterFieldType[]
}

export type FilterFieldType =
  | 'folderType'
  | 'taskType'
  | 'productType'
  | ('users' | 'assignees' | 'author')
  | 'attributes'
  | 'status'
  | 'tags'
  | 'version'
  | 'hasReviewables'
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
  filterTypes?: FilterFieldType[]
  projectNames: string[]
  scope?: Scope
  scopes?: ScopeWithFilterTypes[]
  data: {
    tags?: string[]
    attributes?: Record<string, AttributeDataValue[]>
    assignees?: string[]
    productTypes?: ProductType[]
  }
  columnOrder?: ColumnOrderState
  config?: FilterConfig
  power?: boolean
}

export const useBuildFilterOptions = ({
  filterTypes: globalFilterTypes = [],
  projectNames,
  scope,
  scopes: customScopes,
  data,
  config,
  columnOrder = [],
  power,
}: BuildFilterOptions): Option[] => {
  let options: Option[] = []

  // Determine which scopes to use
  // If customScopes is provided, use it; otherwise, fall back to the old method
  const scopesWithTypes: Array<{ scope: ScopeType; filterTypes: FilterFieldType[] }> = customScopes
    ? customScopes
    : (() => {
        // Fallback to old method: normalize scope to array and use globalFilterTypes for all
        const normalizedScopes = scope ? (Array.isArray(scope) ? scope : [scope]) : []
        return normalizedScopes.map((s) => ({
          scope: s,
          filterTypes: globalFilterTypes,
        }))
      })()

  const isMultiScope = scopesWithTypes.length > 1

  // QUERIES
  //
  //
  // Check if any scope needs these filter types
  const anyNeedsEntitySubType = scopesWithTypes.some((s) =>
    ['entitySubType', 'status'].some((type) => s.filterTypes.includes(type as FilterFieldType)),
  )
  const anyNeedsUsers = scopesWithTypes.some((s) =>
    ['assignees', 'users', 'author'].some((type) =>
      s.filterTypes.includes(type as FilterFieldType),
    ),
  )
  // find if any search field is in any of the scopesWithTypes
  const fieldInScopes = (field: FilterFieldType): boolean => {
    return scopesWithTypes.some((s) => s.filterTypes.includes(field))
  }

  // get grouping options for productTypes
  // NOTE: We should revisit this to be used for all attribs and fields
  const { data: { groups: productTypes = [] } = {} } = useGetEntityGroupsQuery(
    {
      entityType: 'product',
      groupingKey: 'productType',
      projectName: projectNames[0],
      empty: true,
    },
    { skip: !projectNames?.length || !fieldInScopes('productType') },
  )

  const { data: projectsInfo = {} } = useGetProjectsInfoQuery(
    {
      projects: projectNames,
    },
    {
      skip: !projectNames?.length || !anyNeedsEntitySubType,
    },
  )

  const { data: projectUsers = [] } = useGetKanbanProjectUsersQuery(
    { projects: projectNames },
    {
      skip: !projectNames?.length || !anyNeedsUsers,
    },
  )

  const { attributes } = useGlobalContext()
  //
  //
  // QUERIES

  // ADD OPTIONS

  // Helper to get scope label (capitalize first letter)
  const getScopeLabel = (scope: ScopeType) => scope.charAt(0).toUpperCase() + scope.slice(1)

  // Loop through each scope to build options
  scopesWithTypes.forEach(({ scope: currentScope, filterTypes: scopeFilterTypes }) => {
    const scopePrefix = isMultiScope ? currentScope : undefined
    const scopeLabel = isMultiScope ? getScopeLabel(currentScope) : undefined

    // TASK TYPE
    // add taskType option
    if (scopeFilterTypes.includes('taskType') && currentScope !== 'user') {
      const entitySubTypeOption = getOptionRoot(
        'taskType',
        {
          ...config,
          enableOperatorChange: false,
        },
        scopePrefix,
        scopeLabel,
      )
      if (entitySubTypeOption) {
        // get all subTypes for the current scope (entityType)
        let subTypes = getSubTypes({ projectsInfo, productTypes }, 'task')

        entitySubTypeOption.values?.push(...subTypes)

        options.push(entitySubTypeOption)
      }
    }

    // FOLDER TYPE
    // add folderType option
    if (scopeFilterTypes.includes('folderType') && currentScope !== 'user') {
      const entitySubTypeOption = getOptionRoot(
        'folderType',
        {
          ...config,
          enableOperatorChange: false,
        },
        scopePrefix,
        scopeLabel,
      )
      if (entitySubTypeOption) {
        // get all subTypes for the current scope (entityType)
        let subTypes = getSubTypes({ projectsInfo, productTypes }, 'folder')

        entitySubTypeOption.values?.push(...subTypes)

        options.push(entitySubTypeOption)
      }
    }

    // PRODUCT TYPE
    // add productType option
    if (scopeFilterTypes.includes('productType') && currentScope !== 'user') {
      const entitySubTypeOption = getOptionRoot(
        'productType',
        {
          ...config,
          enableOperatorChange: false,
        },
        scopePrefix,
        scopeLabel,
      )
      if (entitySubTypeOption) {
        // get all subTypes for the current scope (entityType)
        let subTypes = getSubTypes({ projectsInfo, productTypes }, 'product')
        entitySubTypeOption.values?.push(...subTypes)
        options.push(entitySubTypeOption)
      }
    }

    // STATUS
    // add status option
    if (scopeFilterTypes.includes('status')) {
      const statusOption = getOptionRoot(
        'status',
        { ...config, enableOperatorChange: false },
        scopePrefix,
        scopeLabel,
      )

      if (statusOption) {
        Object.values(projectsInfo).forEach((project) => {
          const statuses = project?.statuses || []
          statuses
            .filter((status) => status.scope?.includes(currentScope))
            .forEach((status: Status) => {
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
    if (scopeFilterTypes.includes('assignees')) {
      const assigneesOption = getOptionRoot('assignees', config, scopePrefix, scopeLabel)

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

    if (scopeFilterTypes.includes('author')) {
      const authorOption = getOptionRoot('author', config, scopePrefix, scopeLabel)
      if (authorOption) {
        // add every user for the projects (skip duplicates)
        projectUsers.forEach((user) => {
          if (!authorOption.values?.some((value) => value.id === user.name)) {
            authorOption.values?.push({
              id: user.name,
              label: user.attrib.fullName || user.name,
              img: `/api/users/${user.name}/avatar`,
              icon: null,
            })
          }
        })
        options.push(authorOption)
      }
    }

    // TAGS
    // add tags options
    if (scopeFilterTypes.includes('tags')) {
      const tagsOption = getOptionRoot('tags', config, scopePrefix, scopeLabel)

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

    // VERSION
    // add version options
    if (scopeFilterTypes.includes('version')) {
      const versionOption = getOptionRoot('version', config, scopePrefix, scopeLabel)

      if (versionOption) {
        // add featured version types as options
        FEATURED_VERSION_TYPES.forEach((versionType) => {
          versionOption.values?.push({
            id: versionType.value,
            label: versionType.label,
            icon: versionType.icon,
          })
        })

        options.push(versionOption)
      }
    }

    // HAS REVIEWABLES
    // add hasReviewables option
    if (scopeFilterTypes.includes('hasReviewables')) {
      const hasReviewablesOption = getOptionRoot('hasReviewables', config, scopePrefix, scopeLabel)

      if (hasReviewablesOption) {
        const options_list = [
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
        hasReviewablesOption.values?.push(...options_list)
        options.push(hasReviewablesOption)
      }
    }

    // ATTRIBUTES
    // dynamically add attributes options
    if (scopeFilterTypes.includes('attributes')) {
      const attributesByScope = attributes.filter((attribute) =>
        attribute.scope?.includes(currentScope),
      )
      // if attributesData is provided, filter out attributes that are not in the attributesData
      const attributesByValues = !isEmpty(data.attributes)
        ? attributesByScope.filter(
            (attribute) => data.attributes && data.attributes[attribute.name],
          )
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
        ].includes(type || '')
        const isDate = type === 'datetime'
        const enableOperatorChange = isListOf ? config?.enableOperatorChange : false
        const enableRelativeValues = isListOf || isDate ? config?.enableRelativeValues : false
        // for the attribute, get the option root
        const option = getAttributeFieldOptionRoot(
          attribute,
          {
            ...config,
            allowsCustomValues: true,
            enableOperatorChange: enableOperatorChange,
            enableRelativeValues: enableRelativeValues,
          },
          scopePrefix,
          scopeLabel,
        )

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
  }) // End of scopes.forEach loop

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
const getSubTypes = (
  {
    projectsInfo,
    productTypes,
  }: { projectsInfo: GetProjectsInfoResponse; productTypes: EntityGroup[] },
  type: ScopeType,
): Option[] => {
  const options: Option[] = []
  if (type === 'product') {
    productTypes.forEach(({ icon, label, value }) => {
      options.push({
        id: value,
        type: 'string',
        label: label || value,
        icon: icon || getEntityTypeIcon('product'),
        inverted: false,
        values: [],
        allowsCustomValues: false,
      })
    })
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

const getFormattedId = (
  base: string,
  fieldType: FilterFieldType,
  config?: FilterConfig,
  scopePrefix?: string,
) => {
  const { prefixes, keys } = config || {}
  let result = base

  if (keys && fieldType in keys) {
    result = `${keys[fieldType]}`
  } else if (prefixes && fieldType in prefixes) {
    result = `${prefixes[fieldType]}${base}`
  }

  // Add scope prefix if provided
  if (scopePrefix) {
    result = `${scopePrefix}_${result}`
  }

  return result
}

const formatLabel = (baseLabel: string, scopeLabel?: string) =>
  scopeLabel ? `${baseLabel} - ${scopeLabel}` : baseLabel

const getOptionRoot = (
  fieldType: FilterFieldType,
  config?: FilterConfig,
  scopePrefix?: string,
  scopeLabel?: string,
) => {
  const getRootIdWithPrefix = (base: string) => getFormattedId(base, fieldType, config, scopePrefix)
  const formatLabelWithScope = (baseLabel: string) => formatLabel(baseLabel, scopeLabel)

  let rootOption: Option | null = null
  switch (fieldType) {
    case 'taskType':
      rootOption = {
        id: getRootIdWithPrefix(`taskType`),
        type: 'string',
        label: formatLabelWithScope(`Task Type`),
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
        label: formatLabelWithScope(`Folder Type`),
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
        label: formatLabelWithScope(`Product Type`),
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
        label: formatLabelWithScope('Status'),
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
        label: formatLabelWithScope('Assignee'),
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
    case 'author':
      rootOption = {
        id: getRootIdWithPrefix('author'),
        type: 'string',
        label: formatLabelWithScope('Author'),
        icon: getAttributeIcon('author'),
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
        label: formatLabelWithScope('Tags'),
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
    case 'version':
      rootOption = {
        id: getRootIdWithPrefix('version'),
        type: 'string',
        label: formatLabelWithScope('Version'),
        icon: getAttributeIcon('version'),
        inverted: false,
        operator: 'OR',
        values: [],
        allowsCustomValues: true,
        allowHasValue: false,
        allowNoValue: false,
        allowExcludes: false,
        operatorChangeable: false,
      }
      break
    case 'hasReviewables':
      rootOption = {
        id: getRootIdWithPrefix('hasReviewables'),
        type: 'boolean',
        label: formatLabelWithScope('Has Reviewables'),
        icon: 'play_circle',
        inverted: false,
        operator: 'OR',
        values: [],
        allowsCustomValues: false,
        allowHasValue: false,
        allowNoValue: false,
        allowExcludes: config?.enableExcludes,
        operatorChangeable: false,
        singleSelect: true,
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
  scopePrefix?: string,
  scopeLabel?: string,
): Option => ({
  id: getFormattedId(attribute.name, 'attributes', config, scopePrefix),
  type: attribute.data.type,
  label: scopeLabel
    ? formatLabel(attribute.data.title || attribute.name, scopeLabel)
    : attribute.data.title || attribute.name,
  operator: 'OR',
  inverted: false,
  values: [],
  allowsCustomValues: config?.allowsCustomValues,
  allowHasValue: config.enableRelativeValues,
  allowNoValue: config.enableRelativeValues,
  allowExcludes: config?.enableExcludes,
  operatorChangeable: config?.enableOperatorChange,
  icon: getAttributeIcon(attribute.name, attribute.data.type, !!attribute.data.enum?.length),
  singleSelect: ['boolean', 'datetime'].includes(attribute.data.type || ''),
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

/**
 * Splits combined filters by their scope and removes the scope prefix from filter IDs.
 * Used to separate multi-scope filters back into individual scope filters.
 *
 * @param combinedFilter - The filter with potentially scope-prefixed IDs
 * @param scopes - Array of scopes to split by
 * @param config - Filter config containing prefixes for field types
 * @param filterIdToScopeMap - Optional mapping of filter IDs (without scope prefix) to their scopes (e.g., { taskType: 'task', folderType: 'folder' })
 * @returns Object with scope-keyed filters (including 'unscoped' for filters that don't match any scope), with prefixes removed from IDs
 *
 * @example
 * // Input: combinedFilter with IDs like "version_status", "folder_status", "taskType"
 * // With filterIdToScopeMap: { taskType: 'task' }
 * // Output: { version: { conditions: [...] }, folder: { conditions: [...] }, task: { conditions: [...] }, unscoped: { conditions: [] } }
 */
export const splitFiltersByScope = (
  combinedFilter: Record<string, any> | null,
  scopes: ScopeType[],
  config?: FilterConfig,
  filterIdToScopeMap?: Record<string, ScopeType>,
): Record<ScopeType | 'unscoped', Record<string, any>> => {
  // Initialize with all scopes having empty conditions, plus unscoped
  const result: Record<ScopeType | 'unscoped', Record<string, any>> = {
    folder: { conditions: [] },
    product: { conditions: [] },
    task: { conditions: [] },
    user: { conditions: [] },
    version: { conditions: [] },
    unscoped: { conditions: [] },
  }

  if (!combinedFilter?.conditions || combinedFilter?.conditions.length === 0) {
    return result
  }

  // Helper to extract scope prefix from an ID
  const extractScopeAndRemovePrefix = (
    id: string,
    currentConfig?: FilterConfig,
  ): { scope: ScopeType | null; cleanId: string } => {
    // Check if ID starts with any scope prefix
    const scopeMatch = scopes.find((scope) => id.startsWith(`${scope}_`))

    if (scopeMatch) {
      // Remove scope prefix
      const cleanId = id.substring(`${scopeMatch}_`.length)
      return { scope: scopeMatch, cleanId }
    }

    // If no scope prefix, return null scope (shouldn't happen in multi-scope scenario)
    return { scope: null, cleanId: id }
  }

  // Helper to process a filter recursively
  const processConditions = (
    conditions: any[] | undefined,
    targetFilters: Record<ScopeType | 'unscoped', Record<string, any>>,
  ) => {
    if (!conditions || conditions.length === 0) return

    conditions.forEach((condition) => {
      // If this is a nested filter
      if ('conditions' in condition && !('key' in condition)) {
        processConditions(condition.conditions, targetFilters)
      } else if ('key' in condition) {
        // This is a QueryCondition
        const { scope, cleanId } = extractScopeAndRemovePrefix(condition.key, config)

        if (scope && targetFilters[scope]) {
          // Add the condition with cleaned ID to the appropriate scope
          targetFilters[scope].conditions?.push({
            ...condition,
            key: cleanId,
          })
        } else if (!scope) {
          // No explicit scope prefix found, check filterIdToScopeMap
          const mappedScope = filterIdToScopeMap?.[condition.key]

          if (mappedScope && targetFilters[mappedScope]) {
            // Found in the map, add to mapped scope
            targetFilters[mappedScope].conditions?.push(condition)
          } else {
            // Not in map, add to unscoped
            targetFilters['unscoped']?.conditions?.push(condition)
          }
        }
      }
    })
  }

  // Process the combined filter
  processConditions(combinedFilter.conditions, result)

  return result
}

/**
 * Splits combined Filter objects by their scope and removes the scope prefix from filter IDs.
 * Used to separate multi-scope Filter arrays back into individual scope Filter arrays.
 * This function works with Filter objects from @ynput/ayon-react-components, not QueryFilter objects.
 *
 * @param filters - Array of Filter objects with potentially scope-prefixed IDs
 * @param scopes - Array of scopes to split by
 * @param filterIdToScopeMap - Optional mapping of filter IDs (without scope prefix) to their scopes (e.g., { taskType: 'task', folderType: 'folder' })
 * @returns Object with scope-keyed Filter arrays (including 'unscoped' for filters that don't match any scope)
 *
 * @example
 * // Input: filters with IDs like "version_status", "folder_status", "taskType"
 * // With filterIdToScopeMap: { taskType: 'task' }
 * // Output: { version: [...], folder: [...], task: [...], product: [...], user: [...], unscoped: [...] }
 */
export const splitClientFiltersByScope = (
  filters: (Filter | SliceFilter)[] | null | undefined,
  scopes: ScopeType[],
  filterIdToScopeMap?: Record<string, ScopeType>,
): Record<ScopeType | 'unscoped', Filter[]> => {
  // Initialize with all scopes having empty arrays, plus unscoped
  const result: Record<ScopeType | 'unscoped', Filter[]> = {
    folder: [],
    product: [],
    task: [],
    user: [],
    version: [],
    unscoped: [],
  }

  if (!filters || filters.length === 0) {
    return result
  }

  // Helper to extract scope prefix from a filter ID
  const extractScopeFromId = (id: string): ScopeType | null => {
    // Check if ID starts with any scope prefix
    const scopeMatch = scopes.find((scope) => id.startsWith(`${scope}_`))
    return scopeMatch || null
  }

  // Helper to remove scope prefix from ID
  const removeScopePrefix = (id: string, scope: ScopeType): string => {
    const prefix = `${scope}_`
    return id.startsWith(prefix) ? id.substring(prefix.length) : id
  }

  // Process each filter
  filters.forEach((filter) => {
    if (!filter.id) return

    const scope = extractScopeFromId(filter.id)

    // If a scope was found, create a new filter without the scope prefix
    if (scope) {
      const cleanedFilter: Filter = {
        ...filter,
        id: removeScopePrefix(filter.id, scope),
      }
      result[scope].push(cleanedFilter)
    } else {
      // No explicit scope prefix found, check filterIdToScopeMap
      const mappedScope = filterIdToScopeMap?.[filter.id]

      if (mappedScope) {
        // Found in the map, add to mapped scope
        result[mappedScope].push(filter)
      } else {
        // Not in map, add to unscoped
        result['unscoped'].push(filter)
      }
    }
  })

  return result
}
