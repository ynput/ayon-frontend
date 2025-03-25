import React from 'react'
import * as Styled from './Actions.styled'
import clsx from 'clsx'
import { toast } from 'react-toastify'
import { useMemo } from 'react'
import { useExecuteActionMutation, useGetActionsFromContextQuery } from '@/services/actions/actions'
import ActionsDropdown from '@/components/ActionsDropdown/ActionsDropdown'
import ActionIcon from './ActionIcon'
import customProtocolCheck from 'custom-protocol-check'

const placeholder = {
  identifier: 'placeholder',
  label: 'Featured action slot',
  isPlaceholder: true,
}

const Actions = ({ entities, entityType, entitySubTypes, isLoadingEntity }) => {
  const context = useMemo(() => {
    if (!entities.length) return null
    if (!entities[0].projectName) return null

    // get a list of unique entity subtypes from loaded data
    const entitySubtypesLoaded = entities
      .map((entity) => entity.entitySubType)
      .filter((value, index, self) => self.indexOf(value) === index && value)

    // try and use the passed in entitySubTypes, if not use the loaded ones
    const entitySubTypesToUse = entitySubTypes || entitySubtypesLoaded || []

    // all types except version should have subtypes
    if (!entitySubTypesToUse?.length && entityType !== 'version') return

    return {
      projectName: entities[0].projectName,
      entityType: entityType,
      entityIds: entities.map((entity) => entity.id),
      entitySubtypes: entitySubTypesToUse,
    }
  }, [entities, entityType])

  const { data, isFetching: isFetchingActions } = useGetActionsFromContextQuery(
    { mode: 'simple', actionContext: context },
    { skip: !context },
  )
  const actions = data?.actions || []

  const categoryOrder = ['application', 'admin', 'workflow']
  // group actions by category
  // sort by hardcoded category, this will changing the future
  const groupedActions = useMemo(() => {
    // Step 1: Group actions by category
    const grouped = actions.reduce((acc, action) => {
      if (!acc[action.category]) {
        acc[action.category] = []
      }
      acc[action.category].push(action)
      return acc
    }, {})

    // Step 5: Return the ordered groups
    return grouped
  }, [actions])

  // get categories that don't have a specific order (not in categoryOrder)
  // then sort them alphabetically
  const unorderedCategories = useMemo(() => [
    ...new Set(
      Object.keys(groupedActions)
        .filter((category) => !categoryOrder.includes(category))
        .sort((a, b) => a.localeCompare(b)),
    ),
  ])

  const categories = [...categoryOrder, ...unorderedCategories]

  // create the options for the dropdown, each category is separated by a divider and a title
  // for the divider we will use a custom dropdown item template
  const dropdownOptions = useMemo(() => {
    const options = []

    categories.forEach((category) => {
      if (!groupedActions[category] || !groupedActions[category].length) return

      options.push({
        label: category,
        header: true,
        value: category,
        disabled: true,
      })

      const groupOptions = groupedActions[category].map((action) => ({
        value: action.identifier,
        label: action.label,
        icon: action.icon,
      }))

      options.push(...groupOptions)
    })

    // if no actions, add placeholder
    if (!options.length) {
      options.push({
        label: 'No actions available',
        value: 'no-actions',
        disabled: true,
        header: true,
      })
    }

    return options
  }, [groupedActions, unorderedCategories, categoryOrder])

  const featuredNumber = 2

  const featuredActions = useMemo(() => {
    // Filter and sort to get initial featured actions
    let tempFeaturedActions = actions
      .filter((action) => action.featured)
      .sort((a, b) => a.order - b.order)
      .slice(0, featuredNumber)

    // Check if we need to add more actions to reach featuredNumber
    if (tempFeaturedActions.length < featuredNumber) {
      categories.forEach((category) => {
        if (tempFeaturedActions.length >= featuredNumber) return
        const actions = groupedActions[category]
        if (!actions || !actions.length) return

        for (let i = tempFeaturedActions.length; i < featuredNumber; i++) {
          const action = actions[i]
          if (!action) break
          if (!action.icon) continue
          tempFeaturedActions.push(action)
        }
      })
    }

    return tempFeaturedActions
  }, [actions, groupedActions, placeholder])

  const [executeAction, { isLoading: isLoadingExecution, originalArgs }] =
    useExecuteActionMutation()
  const executingAction = isLoadingExecution && originalArgs?.identifier

  const handleExecuteAction = async (identifier, e) => {
    e?.preventDefault()
    const action = actions.find((option) => option.identifier === identifier)

    const params = {
      addonName: action.addonName,
      addonVersion: action.addonVersion,
      variant: action.variant,
      identifier: action.identifier,
    }

    try {
      const response = await executeAction({ actionContext: context, ...params }).unwrap()

      if (!response.success) throw new Error('Error executing action')

      toast.success(response?.message || 'Action executed successfully')
      if (response?.uri) {
        customProtocolCheck(
          response.uri,
          () => {},
          () => {},
          2000,
        )
      }
    } catch (error) {
      console.warn('Error executing action', error)
      toast.error(error || 'Error executing action')
    }
  }

  const loadingActions = [placeholder, placeholder, placeholder]

  const isLoading = isFetchingActions || isLoadingEntity
  const featuredActionsToDisplay = isLoading ? loadingActions : featuredActions

  return (
    <Styled.Actions className="actions">
      {featuredActionsToDisplay.map((action, i) => (
        <Styled.FeaturedAction
          key={action.identifier + '-' + i}
          className={clsx('action', {
            loading: isLoading,
            isPlaceholder: action.isPlaceholder,
          })}
          data-tooltip={action.label}
          disabled={action.isPlaceholder}
          onClick={(e) => handleExecuteAction(action.identifier, e)}
        >
          <ActionIcon icon={action.icon} isExecuting={executingAction === action.identifier} />
        </Styled.FeaturedAction>
      ))}
      <ActionsDropdown
        options={dropdownOptions}
        isLoading={isLoading}
        onAction={handleExecuteAction}
      />
    </Styled.Actions>
  )
}

export default Actions
