import { useListsDataContext } from '@pages/ProjectListsPage/context/ListsDataContext'
import { Filter, Option, SearchFilter, SearchFilterRef } from '@ynput/ayon-react-components'
import { FC, useEffect, useMemo, useRef, useState } from 'react'
import { entityTypeOptions } from '../NewListDialog/NewListDialog'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import { useListsContext } from '@pages/ProjectListsPage/context'
import { AttributeData, AttributeEnumItem, EntityList, useGetAttributeListQuery } from '@shared/api'
import { useProjectDataContext } from '@shared/containers/ProjectTreeTable'
import { getAttributeIcon } from '@shared/util'

// Helper function to aggregate attribute values from lists
const getAttributeValuesFromLists = (
  lists: EntityList[],
  attributeName: string,
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

const Dialog = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;

  & > * {
    max-width: 600px;
    position: absolute;
    top: 25%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`

interface ListsFiltersDialogProps {}

const ListsFiltersDialog: FC<ListsFiltersDialogProps> = ({}) => {
  const { listsFilters, setListsFilters, listsData } = useListsDataContext()
  const { listsFiltersOpen, setListsFiltersOpen } = useListsContext()
  const { projectInfo } = useProjectDataContext()

  const filtersRef = useRef<SearchFilterRef>(null)

  // Fetch list-scoped attributes
  const { data: allAttributes = [] } = useGetAttributeListQuery()

  useEffect(() => {
    if (listsFiltersOpen && filtersRef.current) {
      filtersRef.current.open()
    }
  }, [listsFiltersOpen, filtersRef])

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
              icon: 'radio_button_checked',
            },
            {
              id: 'false',
              label: 'No',
              icon: 'radio_button_unchecked',
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

  // keeps track of the filters whilst adding/removing filters
  const [filters, setFilters] = useState<Filter[]>(listsFilters)

  // update filters when it changes
  useEffect(() => {
    setFilters(listsFilters)
  }, [listsFilters, setFilters])

  //   on keydown, close the dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // only close if already open and not focused on an input
      if (e.key === 'Escape' && listsFiltersOpen && document.activeElement?.tagName !== 'INPUT') {
        setListsFiltersOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [setListsFiltersOpen, listsFiltersOpen])

  if (!listsFiltersOpen) return null

  return createPortal(
    <Dialog
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setListsFiltersOpen(false)
        }
      }}
    >
      <SearchFilter
        options={options}
        filters={filters}
        onChange={setFilters}
        onFinish={(v) => {
          setListsFilters(v) // update the filters in the context
          setListsFiltersOpen(false) // close the dialog
        }}
        ref={filtersRef}
      />
    </Dialog>,
    document.body,
  )
}

export default ListsFiltersDialog
