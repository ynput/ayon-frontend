import { useMemo } from 'react'
import SimpleFormDialog from '@/containers/SimpleFormDialog/SimpleFormDialog'
import {
  useGetActionConfigQuery,
  useSetActionConfigMutation,
} from '@/services/actions/actions'
import { ActionContext, BaseActionManifest } from '@api/rest/actions'


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


const ActionConfigDialog = ({ action, onClose, context }:ActionConfigDialogProps) => {
  const { configFields } = action 

  const requestParams = useMemo<ActionConfigRequestQueryParams | null>(() => {
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

  const { data: initValues } = useGetActionConfigQuery(
    { actionConfig: context, ...requestParams },
    { skip: !requestParams },
  )

  if (!(initValues && configFields && action)) {
    return null
  }


  const handleSubmit = async (data:ConfigData) => {
    await configureAction({actionConfig: { ...context, value: data }, ...requestParams}).unwrap()
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
