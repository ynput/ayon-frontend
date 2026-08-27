import { useMemo } from 'react'
import { Option } from '@ynput/ayon-react-components'
import { AttributeData, EnumItem, EntityList, useGetAttributeListQuery } from '@shared/api'
import { useProjectContext } from '@shared/context'
import { getAttributeIcon } from '@shared/util'
import { useListsDataContext } from '@pages/ProjectListsPage/context/ListsDataContext'
import { entityTypeOptions } from '../components/NewListDialog/NewListDialog'

// Helper function to aggregate attribute values from lists
const getAttributeValuesFromLists = (
  lists: EntityList[],
  attributeName: string,
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
        icon: enumItem.icon,
        color: enumItem.color,
      })
    })
  }

  // aggregate values from all lists
  lists.forEach((list) => {
    const value = list.attrib?.[attributeName]

    // no value? skip
    if (value === null || value === undefined) return

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

const useListsFilterOptions = (): Option[] => {
  const { listsData } = useListsDataContext()
  const projectInfo = useProjectContext()

  // Fetch list-scoped attributes
  const { data: allAttributes = [] } = useGetAttributeListQuery()

  const options = useMemo<Option[]>(() => {
    const opts: Option[] = [
      {
        id: 'entityType',
        label: 'Entity Type',
        type: 'string',
        icon: 'check_circle',
        values: entityTypeOptions.map((option) => ({ ...option, id: option.value })),
      },
    ]

    // Add tags option based on project anatomy
    const projectTags = projectInfo?.tags || []

    if (projectTags.length > 0) {
      // Create tag count map from current lists
      const tagCounts = new Map<string, number>()
      listsData.forEach((list) => {
        if (list.tags && Array.isArray(list.tags)) {
          list.tags.forEach((tag) => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
          })
        }
      })

      const tagValues = projectTags
        .map((tag) => ({
          id: tag.name,
          label: tag.name,
          type: 'string' as const,
          values: [],
          color: tag.color || null,
          count: tagCounts.get(tag.name) || 0,
        }))
        .sort((a, b) => b.count - a.count)

      opts.push({
        id: 'tags',
        label: 'Tags',
        type: 'list_of_strings',
        icon: getAttributeIcon('tags'),
        operator: 'OR',
        values: tagValues,
        allowsCustomValues: true,
      })
    }

    // Add attribute options
    const listScopedAttributes = allAttributes.filter((attr) => attr.scope?.includes('list'))

    const unsupportedTypes: AttributeData['type'][] = ['datetime', 'dict']
    const attributeOptions: Option[] = listScopedAttributes
      .filter((attr) => !unsupportedTypes.includes(attr.data.type))
      .map((attr) => {
        const hasEnum = !!attr.data.enum?.length
        const option: Option = {
          id: `attrib.${attr.name}`,
          label: attr.data.title || attr.name,
          type: attr.data.type || 'string',
          icon: getAttributeIcon(attr.name, attr.data.type, hasEnum),
          allowsCustomValues: true,
          values: [],
        }

        // if the attribute type is boolean, add yes/no options
        if (attr.data.type === 'boolean') {
          option.singleSelect = true
          option.values = [
            {
              id: 'true',
              label: 'Yes',
            },
            {
              id: 'false',
              label: 'No',
            },
          ]
        } else {
          // Get aggregated values from lists data
          const aggregatedValues = getAttributeValuesFromLists(
            listsData,
            attr.name,
            attr.data.enum,
            attr.data.type,
          )

          option.values = aggregatedValues
        }

        return option
      })

    opts.push(...attributeOptions)

    return opts
  }, [allAttributes, listsData, projectInfo])

  return options
}

export default useListsFilterOptions
