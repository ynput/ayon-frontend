import { getAttributeIcon, getEntityTypeIcon } from '@shared/util'
import { ProductType, useGetKanbanProjectUsersQuery, useGetProjectsInfoQuery } from '@shared/api'
import type {
  GetProjectsInfoResponse,
  FolderType,
  Status,
  Tag,
  TaskType,
  AttributeModel,
  EnumItem,
  AttributeData,
} from '@shared/api'
import { ColumnOrderState } from '@tanstack/react-table'
import {
  Icon,
  Option,
  Filter,
  SEARCH_FILTER_ID,
  SearchFilterGroupOption,
} from '@ynput/ayon-react-components'
import { customRangeOption, generateDatePresetOptions } from './filterDates'
import { isEmpty, upperFirst } from 'lodash'
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
  | 'productBaseType'
  | ('users' | 'assignees' | 'author')
  | 'attributes'
  | 'status'
  | 'tags'
  | 'version' // version: latest
  | 'hasReviewables'
  | 'productName'
  | 'name'
  | 'createdAt'
  | 'updatedAt'
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
  fallbackScope?: ScopeType // used when no scope is provided
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
    productNames?: string[]
    productBaseTypes?: ProductType[]
  }
  columnOrder?: ColumnOrderState
  config?: FilterConfig
  power?: boolean
}

const FILTER_OPTIONS_ORDER = new Set<FilterFieldType>([
  'name',
  'status',
  'tags',
  'assignees',
  'author',
  'folderType',
  'taskType',
  'productType',
  'productBaseType',
  'productName',
  'version',
  'hasReviewables',
  'createdAt',
  'updatedAt',
])

export const useBuildFilterOptions = ({
  filterTypes: globalFilterTypes = [],
  projectNames,
  scope,
  scopes: customScopes,
  data,
  config,
  power,
}: BuildFilterOptions): { options: Option[]; groupOptions: SearchFilterGroupOption[] } => {
  const productTypes = data.productTypes || []
  const productBaseTypes = data.productBaseTypes || []
  let options: Option[] = []
  const attributeOptionNames = new Map<string, string>()

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
  const groupedFilterTypes = new Set(
    Array.from(new Set(scopesWithTypes.flatMap(({ filterTypes }) => filterTypes))).filter(
      (filterType) =>
        scopesWithTypes.filter(({ filterTypes }) => filterTypes.includes(filterType)).length > 1,
    ),
  )

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
  const attributeScopeCounts = new Map<string, number>()
  scopesWithTypes.forEach(({ scope: currentScope, filterTypes }) => {
    if (!filterTypes.includes('attributes')) return

    attributes
      .filter((attribute) => attribute.scope?.includes(currentScope))
      .forEach((attribute) => {
        attributeScopeCounts.set(
          attribute.name,
          (attributeScopeCounts.get(attribute.name) || 0) + 1,
        )
      })
  })
  //
  //
  // QUERIES

  // ADD OPTIONS

  // Loop through each scope to build options
  scopesWithTypes.forEach(({ scope: currentScope, filterTypes: scopeFilterTypes }) => {
    const entityType = isMultiScope ? currentScope : undefined

    // TASK TYPE
    // add taskType option
    if (scopeFilterTypes.includes('taskType') && currentScope !== 'user') {
      const entitySubTypeOption = getOptionRoot(
        'taskType',
        {
          ...config,
          enableOperatorChange: false,
        },
        entityType,
        groupedFilterTypes.has('taskType'),
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
        entityType,
        groupedFilterTypes.has('folderType'),
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
        entityType,
        groupedFilterTypes.has('productType'),
      )
      if (entitySubTypeOption) {
        // get all subTypes for the current scope (entityType)
        let subTypes = getSubTypes({ projectsInfo, productTypes }, 'product')
        entitySubTypeOption.values?.push(...subTypes)
        options.push(entitySubTypeOption)
      }
    }

    // PRODUCT BASE TYPE
    // add productBaseType option
    if (scopeFilterTypes.includes('productBaseType') && currentScope !== 'user') {
      const productBaseTypeOption = getOptionRoot(
        'productBaseType',
        {
          ...config,
          enableOperatorChange: false,
        },
        entityType,
        groupedFilterTypes.has('productBaseType'),
      )
      if (productBaseTypeOption) {
        productBaseTypes.forEach(({ icon, name }) => {
          if (!productBaseTypeOption.values?.some((v) => v.id === name)) {
            productBaseTypeOption.values?.push({
              id: name,
              label: name,
              icon: icon || getEntityTypeIcon('product'),
            })
          }
        })
        data.productBaseTypes?.forEach(({ icon, name }) => {
          if (!productBaseTypeOption.values?.some((v) => v.id === name)) {
            productBaseTypeOption.values?.push({
              id: name,
              label: name,
              icon: icon || getEntityTypeIcon('product'),
            })
          }
        })
        options.push(productBaseTypeOption)
      }
    }
    // PRODUCT NAME
    // add product name option
    if (scopeFilterTypes.includes('productName') && currentScope === 'product') {
      const productNameOption = getOptionRoot(
        'productName',
        config,
        entityType,
        groupedFilterTypes.has('productName'),
      )

      if (productNameOption) {
        // Populate with product names from data as suggestions (optional since allowsCustomValues: true)
        data.productNames?.forEach((name) => {
          if (!productNameOption.values?.some((value) => value.id === name)) {
            productNameOption.values?.push({
              id: name,
              label: name,
            })
          }
        })

        options.push(productNameOption)
      }
    }

    // STATUS
    // add status option
    if (scopeFilterTypes.includes('status')) {
      const statusOption = getOptionRoot(
        'status',
        { ...config, enableOperatorChange: false },
        entityType,
        groupedFilterTypes.has('status'),
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
      const assigneesOption = getOptionRoot(
        'assignees',
        config,
        entityType,
        groupedFilterTypes.has('assignees'),
      )

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
      const authorOption = getOptionRoot(
        'author',
        config,
        entityType,
        groupedFilterTypes.has('author'),
      )
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
      const tagsOption = getOptionRoot('tags', config, entityType, groupedFilterTypes.has('tags'))

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

    // VERSION (LATEST)
    // add version options
    if (scopeFilterTypes.includes('version')) {
      const versionOption = getOptionRoot(
        'version',
        config,
        entityType,
        groupedFilterTypes.has('version'),
      )

      if (versionOption) {
        const versionTypes = FEATURED_VERSION_TYPES

        versionTypes.forEach((versionType) => {
          versionOption.values?.push({
            id: versionType.value,
            label: versionType.label,
            icon: versionType.icon,
          })
        })

        options.push(versionOption)
      }
    }

    // NAME
    // add name filter for custom string input
    if (scopeFilterTypes.includes('name')) {
      const nameOption = getOptionRoot('name', config, entityType, groupedFilterTypes.has('name'))

      if (nameOption) {
        options.push(nameOption)
      }
    }

    // HAS REVIEWABLES
    // add hasReviewables option
    if (scopeFilterTypes.includes('hasReviewables')) {
      const hasReviewablesOption = getOptionRoot(
        'hasReviewables',
        config,
        entityType,
        groupedFilterTypes.has('hasReviewables'),
      )

      if (hasReviewablesOption) {
        const options_list = [
          {
            id: 'true',
            label: 'Yes',
            values: [],
          },
          {
            id: 'false',
            label: 'No',
            values: [],
          },
        ]
        hasReviewablesOption.values?.push(...options_list)
        options.push(hasReviewablesOption)
      }
    }

    // CREATED AT
    if (scopeFilterTypes.includes('createdAt')) {
      const createdAtOption = getOptionRoot(
        'createdAt',
        config,
        entityType,
        groupedFilterTypes.has('createdAt'),
      )
      if (createdAtOption) {
        createdAtOption.values?.push(customRangeOption)
        // Preset date options are PowerPack-gated
        createdAtOption.values?.push(
          ...generateDatePresetOptions().map((o) => ({
            ...o,
            contentAfter: power ? undefined : <Icon icon="bolt" />,
          })),
        )
        options.push(createdAtOption)
      }
    }

    // UPDATED AT
    if (scopeFilterTypes.includes('updatedAt')) {
      const updatedAtOption = getOptionRoot(
        'updatedAt',
        config,
        entityType,
        groupedFilterTypes.has('updatedAt'),
      )
      if (updatedAtOption) {
        updatedAtOption.values?.push(customRangeOption)
        updatedAtOption.values?.push(
          ...generateDatePresetOptions().map((o) => ({
            ...o,
            contentAfter: power ? undefined : <Icon icon="bolt" />,
          })),
        )
        options.push(updatedAtOption)
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
        const isText = type === 'string'
        const isNumber = type === 'integer' || type === 'float'
        const enableOperatorChange = isListOf ? config?.enableOperatorChange : false
        // a project default inherits down to every entity, so nullness filters would never match
        const alwaysResolvesToValue =
          attribute.data.default !== undefined &&
          attribute.data.default !== null &&
          attribute.data.inherit !== false
        // booleans excluded: unset already matches "No", so has/no value would just duplicate it
        const supportsNullness =
          (isListOf || isDate || isText || isNumber) && !alwaysResolvesToValue
        const enableRelativeValues = supportsNullness ? config?.enableRelativeValues : false
        // for the attribute, get the option root
        const option = getAttributeFieldOptionRoot(
          attribute,
          {
            ...config,
            allowsCustomValues: true,
            enableOperatorChange: enableOperatorChange,
            enableRelativeValues: enableRelativeValues,
          },
          entityType,
          (attributeScopeCounts.get(attribute.name) || 0) > 1,
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
            },
            {
              id: 'false',
              label: 'No',
              values: [],
            },
          ]
          optionValues.push(...options)
        }

        // if the attribute type is datetime, add datetime options

        if (isDate) {
          // Custom range is free
          optionValues.push(customRangeOption)
          // Preset date options are PowerPack-gated
          optionValues.push(
            ...generateDatePresetOptions().map((o) => ({
              ...o,
              contentAfter: power ? undefined : <Icon icon="bolt" />,
            })),
          )
        }

        // add option to the list of options
        option.values?.push(...optionValues)

        // add option to the list of options
        attributeOptionNames.set(option.id, attribute.name)
        options.push(option)
      })
    }
  }) // End of scopes.forEach loop

  // Build groups from the options so every filter field is represented without
  // maintaining a separate list as fields are added.
  const groupOptions = options.reduce<SearchFilterGroupOption[]>((groups, option) => {
    if (!option.group) return groups
    const group = typeof option.group === 'string' ? undefined : option.group
    const groupName = group?.name || (option.group as string)
    if (groups.some((group) => group.name === groupName)) return groups

    groups.push({
      name: groupName,
      label: option.label,
      icon: option.icon,
      color: option.color,
    })
    return groups
  }, [])

  const sortedOptions = sortOptions(options, attributeOptionNames, attributes)
  const sortedGroupOptions = sortGroupOptions(
    groupOptions,
    sortedOptions,
    attributeOptionNames,
    attributes,
  )

  return { options: sortedOptions, groupOptions: sortedGroupOptions }
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
  }: { projectsInfo: GetProjectsInfoResponse; productTypes: ProductType[] },
  type: ScopeType,
): Option[] => {
  const options: Option[] = []
  if (type === 'product') {
    productTypes.forEach(({ icon, name }) => {
      options.push({
        id: name,
        type: 'string',
        label: name,
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
            color: taskType.color,
            inverted: false,
            values: [],
            allowsCustomValues: false,
            pt: {
              style: {
                color: 'inherit',
              },
            },
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
            color: folderType.color,
            inverted: false,
            values: [],
            allowsCustomValues: false,
            pt: {
              style: {
                color: 'inherit',
              },
            },
          })
        }
      })
    })
  }

  return options
}

const getFormattedId = (
  base: string,
  fieldName: FilterFieldType,
  config?: FilterConfig,
  entityType?: string,
) => {
  const { prefixes, keys } = config || {}
  let result = base

  if (keys && fieldName in keys) {
    result = `${keys[fieldName]}`
  } else if (prefixes && fieldName in prefixes) {
    result = `${prefixes[fieldName]}${base}`
  }

  // Add scope prefix if provided
  if (entityType) {
    result = `${entityType}_${result}`
  }

  return result
}

const getOptionRoot = (
  fieldName: FilterFieldType,
  config?: FilterConfig,
  entityType?: string,
  shouldGroup = false,
) => {
  const getRootIdWithPrefix = (base: string) => getFormattedId(base, fieldName, config, entityType)

  let rootOption: Option | null = null
  switch (fieldName) {
    case 'taskType':
      rootOption = {
        id: getRootIdWithPrefix(`taskType`),
        type: 'string',
        label: 'Task Type',
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
        label: 'Folder Type',
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
        label: 'Product Type',
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
    case 'productBaseType':
      rootOption = {
        id: getRootIdWithPrefix(`productBaseType`),
        type: 'string',
        label: 'Product Base Type',
        icon: getAttributeIcon('product'),
        inverted: false,
        operator: 'OR',
        values: [],
        allowsCustomValues: true,
        allowHasValue: false,
        allowNoValue: false,
        allowExcludes: config?.enableExcludes,
        operatorChangeable: false,
      }
      break
    case 'productName':
      rootOption = {
        id: getRootIdWithPrefix(`productNames`),
        type: 'string',
        label: 'Product Name',
        icon: getAttributeIcon('productName', 'string'),
        inverted: false,
        operator: 'OR',
        values: [],
        allowsCustomValues: true,
        allowHasValue: false,
        allowNoValue: false,
        allowExcludes: false,
        operatorChangeable: true,
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
    case 'author':
      rootOption = {
        id: getRootIdWithPrefix('author'),
        type: 'string',
        label: 'Author',
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
    case 'version': // version: latest
      rootOption = {
        id: getRootIdWithPrefix('version'),
        type: 'string',
        label: 'Latest Version',
        icon: getAttributeIcon('latest'),
        inverted: false,
        operator: 'OR',
        values: [],
        allowsCustomValues: true,
        allowHasValue: false,
        allowNoValue: false,
        allowExcludes: false,
        operatorChangeable: false,
        singleSelect: true,
      }
      break
    case 'name':
      rootOption = {
        id: getRootIdWithPrefix('name'),
        type: 'string',
        label: 'Name',
        icon: 'text_fields',
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
        label: 'Has Reviewables',
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
    case 'createdAt':
      rootOption = {
        id: getRootIdWithPrefix('createdAt'),
        type: 'datetime',
        label: 'Created',
        icon: 'calendar_add_on',
        inverted: false,
        operator: 'OR',
        values: [],
        allowsCustomValues: false,
        allowHasValue: false,
        allowNoValue: false,
        allowExcludes: false,
        operatorChangeable: false,
        singleSelect: true,
      }
      break
    case 'updatedAt':
      rootOption = {
        id: getRootIdWithPrefix('updatedAt'),
        type: 'datetime',
        label: 'Updated',
        icon: 'edit_calendar',
        inverted: false,
        operator: 'OR',
        values: [],
        allowsCustomValues: false,
        allowHasValue: false,
        allowNoValue: false,
        allowExcludes: false,
        operatorChangeable: false,
        singleSelect: true,
      }
      break
    default:
      break

    // Note: attributes are handled separately
  }

  const entityLabel = upperFirst(entityType || '')
  const fieldNameWithEntityType = (label: string) =>
    entityType ? `${entityLabel} ${label}` : label

  if (shouldGroup && rootOption) {
    rootOption.group = {
      name: fieldName,
      label: fieldNameWithEntityType(rootOption.label),
      icon: getEntityTypeIcon(entityType || ''),
    }

    rootOption.search = {
      label: entityLabel,
    }
  }

  if (rootOption && entityType) {
    rootOption.tooltip = fieldNameWithEntityType(rootOption.label)
    rootOption.value = { icon: getEntityTypeIcon(entityType) }
  }

  return rootOption
}

const getAttributeFieldOptionRoot = (
  attribute: AttributeModel,
  config: FilterConfig & { allowsCustomValues: boolean },
  entityType?: string,
  shouldGroup = false,
): Option => {
  const label = attribute.data.title || attribute.name
  const scopeLabel = entityType ? `${upperFirst(entityType)} ` : ''
  const group = shouldGroup
    ? {
        name: attribute.name,
        label: `${scopeLabel}${label}`,
        icon: getEntityTypeIcon(entityType || ''),
      }
    : undefined

  const search = shouldGroup
    ? {
        label: scopeLabel,
      }
    : undefined

  return {
    id: getFormattedId(attribute.name, 'attributes', config, entityType),
    type: attribute.data.type,
    label,

    operator: 'OR',
    inverted: false,
    values: [],
    allowsCustomValues: config?.allowsCustomValues,
    allowHasValue: config.enableRelativeValues,
    allowNoValue: config.enableRelativeValues,
    allowExcludes: config?.enableExcludes,
    operatorChangeable: config?.enableOperatorChange,
    icon: getAttributeIcon(attribute.name, attribute.data.type, !!attribute.data.enum?.length),
    group,
    search,
    tooltip: entityType ? `${upperFirst(entityType)} ${label}` : undefined,
    value: entityType ? { icon: getEntityTypeIcon(entityType) } : undefined,
    singleSelect: ['boolean', 'datetime'].includes(attribute.data.type || ''),
  }
}

const getAttributeOptions = (
  values?: AttributeDataValue[],
  enums?: EnumItem[],
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
        icon: enumItem.icon as string,
        color: enumItem.color,
        pt: {
          style: { color: 'inherit' },
        },
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

const sortOptions = (
  options: Option[],
  attributeOptionNames: Map<string, string>,
  attributes: AttributeModel[],
) => {
  return [...options].sort((a, b) => {
    return compareOptionOrder(
      getOptionFieldName(a),
      attributeOptionNames.get(a.id),
      getOptionFieldName(b),
      attributeOptionNames.get(b.id),
      attributes,
    )
  })
}

const getOptionFieldName = (option: Option) => {
  if (option.group) {
    return typeof option.group === 'string' ? option.group : option.group.name
  }
  return option.id
}

const sortGroupOptions = (
  groupOptions: SearchFilterGroupOption[],
  options: Option[],
  attributeOptionNames: Map<string, string>,
  attributes: AttributeModel[],
) => {
  return [...groupOptions].sort((a, b) => {
    const aOption = options.find((option) => {
      const group = typeof option.group === 'string' ? option.group : option.group?.name
      return group === a.name
    })
    const bOption = options.find((option) => {
      const group = typeof option.group === 'string' ? option.group : option.group?.name
      return group === b.name
    })

    return compareOptionOrder(
      aOption ? getOptionFieldName(aOption) : a.name,
      aOption ? attributeOptionNames.get(aOption.id) : a.name,
      bOption ? getOptionFieldName(bOption) : b.name,
      bOption ? attributeOptionNames.get(bOption.id) : b.name,
      attributes,
    )
  })
}

const compareOptionOrder = (
  aId: string,
  aAttributeName: string | undefined,
  bId: string,
  bAttributeName: string | undefined,
  attributes: AttributeModel[],
) => {
  const attributeOrder = new Map(attributes.map((attribute, index) => [attribute.name, index]))
  const getFilterOrder = (id: string) => {
    let order = 0
    for (const filterType of FILTER_OPTIONS_ORDER) {
      if (id === filterType || id.endsWith(`_${filterType}`)) return order
      order++
    }
    return Number.MAX_SAFE_INTEGER
  }

  const aOrder = aAttributeName
    ? [1, attributeOrder.get(aAttributeName) ?? Number.MAX_SAFE_INTEGER]
    : [0, getFilterOrder(aId)]
  const bOrder = bAttributeName
    ? [1, attributeOrder.get(bAttributeName) ?? Number.MAX_SAFE_INTEGER]
    : [0, getFilterOrder(bId)]

  return aOrder[0] - bOrder[0] || aOrder[1] - bOrder[1]
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
    folder: { conditions: [], operator: combinedFilter?.operator || 'and' },
    product: { conditions: [], operator: combinedFilter?.operator || 'and' },
    task: { conditions: [], operator: combinedFilter?.operator || 'and' },
    user: { conditions: [], operator: combinedFilter?.operator || 'and' },
    version: { conditions: [], operator: combinedFilter?.operator || 'and' },
    unscoped: { conditions: [], operator: combinedFilter?.operator || 'and' },
  }

  if (!combinedFilter?.conditions || combinedFilter?.conditions.length === 0) {
    return result
  }

  // Helper to extract scope prefix from an ID
  const extractScopeAndRemovePrefix = (
    id: string,
  ): { scope: ScopeType | null; cleanId: string } => {
    // Check if ID starts with any scope prefix
    const scopeMatch = scopes.find((scope) => id.startsWith(`${scope}_`))

    if (scopeMatch) {
      // Remove scope prefix
      const cleanId = id.substring(`${scopeMatch}_`.length)
      return { scope: scopeMatch, cleanId }
    } else if (config?.fallbackScope) {
      // fallback to a default scope if provided in config
      return { scope: config.fallbackScope, cleanId: id }
    }

    // If no scope prefix, return null scope (shouldn't happen in multi-scope scenario)
    return { scope: null, cleanId: id }
  }

  // Helper to process a filter recursively and return results by scope
  const processFilter = (filter: any): Record<ScopeType | 'unscoped', any[]> => {
    const localResults: Record<ScopeType | 'unscoped', any[]> = {
      folder: [],
      product: [],
      task: [],
      user: [],
      version: [],
      unscoped: [],
    }

    if ('conditions' in filter && !('key' in filter)) {
      // Nested filter - process all children
      const childResults = (filter.conditions || []).map((f: any) => processFilter(f))

      // For each scope, group the results from children
      Object.keys(localResults).forEach((s) => {
        const scope = s as ScopeType | 'unscoped'
        const scopeConditions = childResults.flatMap((res: any) => res[scope])

        if (scopeConditions.length > 0) {
          // If there are multiple conditions, wrap them in the parent's operator
          // If there's only one, we still wrap it if there was an operator to preserve structure
          if (scopeConditions.length === 1 && !filter.operator) {
            localResults[scope].push(scopeConditions[0])
          } else {
            localResults[scope].push({
              conditions: scopeConditions,
              operator: filter.operator,
            })
          }
        }
      })
    } else if ('key' in filter) {
      // QueryCondition
      const { scope, cleanId } = extractScopeAndRemovePrefix(filter.key)

      if (scope) {
        localResults[scope].push({ ...filter, key: cleanId })
      } else {
        // No explicit scope prefix found, check filterIdToScopeMap
        const mappedScope = filterIdToScopeMap?.[filter.key]

        if (mappedScope) {
          localResults[mappedScope].push(filter)
        } else if (
          filter.key === SEARCH_FILTER_ID ||
          filter.key === 'name' ||
          filter.key?.endsWith('_name')
        ) {
          // Global search and name filters should be added to all requested scopes
          scopes.forEach((scopeName) => {
            localResults[scopeName].push(filter)
          })
        } else {
          localResults['unscoped'].push(filter)
        }
      }
    }

    return localResults
  }

  // Process all top-level conditions and populate the result
  const finalResults = (combinedFilter.conditions || []).map((f: any) => processFilter(f))

  Object.keys(result).forEach((s) => {
    const scope = s as ScopeType | 'unscoped'
    result[scope].conditions = finalResults.flatMap((res: any) => res[scope])
  })

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
