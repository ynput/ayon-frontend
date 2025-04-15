import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import SimpleFormDialog from '@/containers/SimpleFormDialog/SimpleFormDialog'
import {
  useGetActionConfigQuery,
  useSetActionConfigMutation,
} from '@/services/actions/actions'

const ActionConfigDialog = ({ action, onClose, context }) => {
  const { configFields } = action || {}

  const params = action && {
    addonName: action.addonName,
    addonVersion: action.addonVersion,
    variant: action.variant,
    identifier: action.identifier,
  }

  const [configureAction] = useSetActionConfigMutation()

  const { data: initValues } = useGetActionConfigQuery(
    { mode: 'simple', actionConfig: context, ...(params || {}) },
    { skip: !(context && action) },
  )

  if (!initValues) {
    return null
  }

  if (!action) return null

  const handleSubmit = async (data) => {
    await configureAction({actionConfig: { ...context, value: data }, ...params}).unwrap()
    onClose()
  }

  return (
    <SimpleFormDialog
      isOpen
      header={`Configure action ${action.label}`}
      fields={configFields}
      values={initValues}
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  )
}

export default ActionConfigDialog
