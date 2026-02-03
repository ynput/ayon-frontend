import * as Styled from './Actions.styled'
import { MouseEvent, useState } from 'react'
import clsx from 'clsx'
import { toast } from 'react-toastify'
import { useMemo, useEffect } from 'react'
import { ActionContext, useExecuteActionMutation, useGetActionsFromContextQuery } from '@shared/api'
import { ActionsDropdown, ActionsDropdownProps } from './ActionsDropdown'
import ActionIcon from './ActionIcon'
import { ActionTriggersProps, useActionTriggers } from '@shared/hooks'
import { ActionConfigDialog } from './ActionConfigDialog'
import { InteractiveActionDialog, InteractiveForm } from './InteractiveActionDialog'

const placeholder = {
  identifier: 'placeholder',
  label: 'Featured action slot',
  isPlaceholder: true,
  icon: { type: 'material-symbols', name: 'sync' },
  groupLabel: '',
}

interface ActionsProps extends ActionTriggersProps {
  entities: { id: string; projectName: string; entitySubType?: string }[]
  entityType: ActionContext['entityType']
  entitySubTypes?: string[]
  isLoadingEntity: boolean
  projectActionsProjectName?: string
  featuredCount?: number
  isDeveloperMode: boolean
  align?: ActionsDropdownProps['align']
  pt?: {
    dropdown?: Partial<ActionsDropdownProps>
  }
}

export const Actions = ({
  entities,
  entityType,
  entitySubTypes,
  isLoadingEntity,
  projectActionsProjectName,
  searchParams,
  featuredCount = 2,
  isDeveloperMode,
  onNavigate,
  onSetSearchParams,
  align,
  pt,
}: ActionsProps) => {
  // special triggers the actions can make to perform stuff on the client
  const { handleActionPayload } = useActionTriggers({ onNavigate, onSetSearchParams, searchParams })
  const [actionBeingConfigured, setActionBeingConfigured] = useState<any>(null)
  const [interactiveForm, setInteractiveForm] = useState<any>(null)

  const context: ActionContext | null = useMemo(() => {
    if (projectActionsProjectName) {
      return {
        entityType: 'project',
        projectName: projectActionsProjectName,
      }
    }
    if (!entities.length) return null
    if (!entities[0].projectName) return null

    // get a list of unique entity subtypes from loaded data
    const entitySubtypesLoaded = entities
      .filter((entity) => entity.entitySubType)
      .map((entity) => entity.entitySubType as string)
      .filter((value, index, self) => self.indexOf(value) === index && value)

    // try and use the passed in entitySubTypes, if not use the loaded ones
    const entitySubTypesToUse = entitySubTypes?.length ? entitySubTypes : entitySubtypesLoaded

    // all types except version/representation should have subtypes
    if (
      !entitySubTypesToUse?.length &&
      entityType !== 'version' &&
      entityType !== 'representation'
    ) {
      console.warn('No entity subtypes found')
      return null
    }

    return {
      projectName: entities[0].projectName,
      entityType: entityType,
      entityIds: entities.map((entity) => entity.id),
      entitySubtypes: entitySubTypesToUse,
    }
  }, [entities, entityType])

  useEffect(() => {
    setInteractiveForm(null)
  }, [context])

  const { data, isFetching: isFetchingActions } = useGetActionsFromContextQuery(
    { mode: 'simple', actionContext: context as ActionContext },
    { skip: !context },
  )

  const actions = data?.actions || []

  const categoryOrder = ['application', 'admin', 'workflow']
  // group actions by category
  // sort by hardcoded category, this will changing the future
  const groupedActions = useMemo(() => {
    // Step 1: Group actions by category
    const grouped = actions.reduce((acc: { [key: string]: any[] }, action) => {
      const category = action.category || 'uncategorized'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(action)
      return acc
    }, {})

    // Step 5: Return the ordered groups
    return grouped
  }, [actions])

  // get categories that don't have a specific order (not in categoryOrder)
  // then sort them alphabetically
  const unorderedCategories = useMemo(
    () => [
      ...new Set(
        Object.keys(groupedActions)
          .filter((category) => !categoryOrder.includes(category))
          .sort((a, b) => a.localeCompare(b)),
      ),
    ],
    [groupedActions],
  )

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
        label: action.groupLabel ? action.groupLabel + ' ' + action.label : action.label,
        icon: action.icon,
        hasConfig: !!action.configFields,
        description: action.description,
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

  const featuredActions = useMemo(() => {
    // Filter and sort to get initial featured actions
    let tempFeaturedActions = actions
      .filter((action) => action.featured)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .slice(0, featuredCount)

    // Check if we need to add more actions to reach featuredCount
    if (tempFeaturedActions.length < featuredCount) {
      categories.forEach((category) => {
        if (tempFeaturedActions.length >= featuredCount) return
        const actions = groupedActions[category]
        if (!actions || !actions.length) return

        for (let i = tempFeaturedActions.length; i < featuredCount; i++) {
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

  const handleExecuteAction = async (
    identifier: string,
    e?: MouseEvent<HTMLElement> | null,
    formData?: InteractiveForm,
  ) => {
    e?.preventDefault()
    const action = actions.find((option) => option.identifier === identifier)

    if (!action) {
      toast.error('Action not found')
      console.warn('Action not found', identifier)
      return
    }

    const params = {
      addonName: action.addonName as string,
      addonVersion: action.addonVersion as string,
      variant: action.variant,
      identifier: action.identifier,
    }

    const actionContext = { ...context }
    if (formData) {
      actionContext.formData = formData
    }

    let response = null

    try {
      response = await executeAction({ actionContext, ...params }).unwrap()
    } catch (error: any) {
      console.error('Error executing action', error)
      toast.error(error?.data?.detail || 'Error executing action')
      return
    }

    try {
      // Toast the message if it is available
      if (response?.message) {
        if (response?.success) {
          toast.success(response.message, { autoClose: 2000 })
        } else {
          toast.error(response.message, { autoClose: 2000 })
        }
      }

      // Even if response?.success is false, we still want to handle the payload
      // as it may contain useful information - complex error messages in form,
      // redirect to another page etc. If the action just needs to abort,
      // it raises exception instead of returning a response with success: false

      // Use the new hook to handle payload
      if (response?.payload) {
        if (response.type === 'form') {
          // action requests additional information from the user.
          // we show a dialog with the form and when the user submits it we call the action again

          // It probably does not make sense to move to the useActionTriggers hook
          // as it need contexts and the dialog
          const intf = {
            identifier,
            // @ts-expect-error
            title: response.payload['title'],
            // @ts-expect-error
            fields: response.payload['fields'],
            // @ts-expect-error
            submitLabel: response.payload['submit_label'],
            // @ts-expect-error
            cancelLabel: response.payload['cancel_label'],
            // @ts-expect-error
            submitIcon: response.payload['submit_icon'],
            // @ts-expect-error
            cancelIcon: response.payload['cancel_icon'],
          }
          setInteractiveForm(intf)
        } else {
          handleActionPayload(response.type as string, response.payload)
        }
      }
    } catch (error) {
      // got response, but failed to process it
      console.warn('Error during action response processing', error)
      toast.error('Error occured during action processing')
    }
  }

  const handleConfigureAction = (identifier: string) => {
    const action = actions.find((data) => data.identifier === identifier)
    if (!action) return
    setActionBeingConfigured(action)
  }

  const handleSubmitInteractiveForm = async (identifier: string, formData: InteractiveForm) => {
    handleExecuteAction(identifier, null, formData)
  }

  const loadingActions = useMemo(
    () => Array(featuredCount).fill(placeholder),
    [featuredCount, placeholder],
  )

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
          data-tooltip={action.groupLabel ? action.groupLabel + ' ' + action.label : action.label}
          disabled={action.isPlaceholder}
          onClick={(e) => handleExecuteAction(action.identifier, e)}
        >
          {/* @ts-ignore */}
          <ActionIcon icon={action.icon} isExecuting={executingAction === action.identifier} />
        </Styled.FeaturedAction>
      ))}
      <ActionsDropdown
        options={dropdownOptions}
        isLoading={isLoading && featuredCount > 0}
        onAction={handleExecuteAction}
        onConfig={handleConfigureAction}
        isDeveloperMode={isDeveloperMode}
        align={align}
        {...pt?.dropdown}
      />
      <ActionConfigDialog
        action={actionBeingConfigured}
        // @ts-expect-error
        context={context}
        onClose={() => setActionBeingConfigured(null)}
      />
      <InteractiveActionDialog
        interactiveForm={interactiveForm}
        onClose={() => setInteractiveForm(null)}
        // @ts-expect-error
        onSubmit={handleSubmitInteractiveForm}
      />
    </Styled.Actions>
  )
}
