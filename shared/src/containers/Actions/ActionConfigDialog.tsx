import { useMemo } from 'react'
import { toast } from 'react-toastify'
import { SimpleFormDialog } from '@shared/components'
import type { SimpleFormValueDict } from '@shared/components'

import { useGetActionConfigQuery, useSetActionConfigMutation } from '@shared/api'
import type { ActionContext, BaseActionManifest } from '@shared/api'

type ConfigData = Record<string, any>

interface ActionConfigDialogProps {
  action: BaseActionManifest
  context: ActionContext
  onClose: () => void
}

interface ActionConfigRequestQueryParams {
  addonName: string
  addonVersion: string
  variant?: string
  identifier: string
}

export const ActionConfigDialog = ({ action, onClose, context }: ActionConfigDialogProps) => {
  const requestParams: ActionConfigRequestQueryParams | null =
    useMemo<ActionConfigRequestQueryParams | null>(() => {
      if (!action) return null
      if (!(action.addonName && action.addonVersion)) return null // this should never happen
      return {
        addonName: action.addonName,
        addonVersion: action.addonVersion,
        variant: action.variant,
        identifier: action.identifier,
      }
    }, [action])

  const [configureAction] = useSetActionConfigMutation()

  // make typescript happily unknowing about the type
  // because even if we pass skip, arguments are still required in the right type. that's cursed
  const qp: any = { actionConfig: context, ...(requestParams || {}) }
  const { data: initValues } = useGetActionConfigQuery(qp, { skip: !requestParams })

  // it would be sooo cool if i could do this BEFORE the query and ommit that
  // qp thing, but i can't. because it would change the hook order. ffs
  if (!(initValues && action?.configFields && action && requestParams)) {
    return null
  }

  const handleSubmit = async (data: ConfigData) => {
    try {
      await configureAction({
        actionConfig: { ...context, value: data },
        ...requestParams,
      }).unwrap()
      onClose()
    } catch (error) {
      console.warn('Error configuring action', error)
      toast.error('Unable to set the action configuration')
    }
  }

  return (
    <SimpleFormDialog
      isOpen
      title={`Configure action ${action.label}`}
      fields={action.configFields}
      values={initValues as SimpleFormValueDict}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Save action config"
      cancelLabel="Cancel"
      submitIcon="check"
      cancelIcon="close"
    />
  )
}
