import React from 'react'
import * as Styled from './Actions.styled'
import { classNames } from 'primereact/utils'
import { toast } from 'react-toastify'
import { useMemo } from 'react'
import { useExecuteActionMutation, useGetActionsFromContextQuery } from '@/services/actions/actions'

const Actions = ({ entities }) => {
  const context = useMemo(() => {
    if (!entities.length) return null
    if (!entities[0].projectName) return null
    if (!entities[0].entityType) return null

    // get a list of unique entity subtypes
    const entitySubtypes = entities
      .map((entity) => entity.entitySubType)
      .filter((value, index, self) => self.indexOf(value) === index)

    return {
      projectName: entities[0].projectName,
      entityType: entities[0].entityType,
      entityIds: entities.map((entity) => entity.id),
      entitySubtypes,
    }
  }, [entities])

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
