import React from 'react'
import * as Styled from './Actions.styled'
import { classNames } from 'primereact/utils'
import { toast } from 'react-toastify'
import { useMemo } from 'react'
import { useExecuteActionMutation, useGetActionsFromContextQuery } from '@/services/actions/actions'

const Actions = ({ entities, entityType, entitySubTypes }) => {
  // console.log(entities)

  const context = useMemo(() => {
    if (!entities.length) return null
    if (!entities[0].projectName) return null

    // get a list of unique entity subtypes from loaded data
    const entitySubtypesLoaded = entities
      .map((entity) => entity.entitySubType)
      .filter((value, index, self) => self.indexOf(value) === index)

    // try and use the passed in entitySubTypes, if not use the loaded ones
    const entitySubtypes = entitySubTypes || entitySubtypesLoaded || []

    // all types except version should have subtypes
    if (!entitySubTypes?.length && entityType !== 'version') return

    return {
      projectName: entities[0].projectName,
      entityType: entityType,
      entityIds: entities.map((entity) => entity.id),
      entitySubtypes: entitySubtypes,
    }
  }, [entities, entityType])

  const { data, isFetching: isFetchingActions } = useGetActionsFromContextQuery(
    { mode: 'simple', actionContext: context },
    { skip: !context },
  )
  const actions = data?.actions || []

  const [executeAction] = useExecuteActionMutation()

  const handleExecuteAction = async (identifier) => {
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
        window.location.href = response.uri
      }
    } catch (error) {
      console.warn('Error executing action', error)
      toast.error(error || 'Error executing action')
    }
  }

  return (
    <Styled.Actions className={classNames('actions', { isLoading: isFetchingActions })}>
      {actions.map((option) => (
        <Styled.PinnedAction key={option.identifier}>
          <img
            src={option.icon}
            title={option.label}
            onClick={() => handleExecuteAction(option.identifier)}
          />
        </Styled.PinnedAction>
      ))}

      <Styled.More options={actions} placeholder="" value={[]} />
    </Styled.Actions>
  )
}

export default Actions
