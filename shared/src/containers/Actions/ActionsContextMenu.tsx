import { useCallback, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ActionContext,
  useExecuteActionMutation,
  useLazyGetActionsFromContextQuery,
  useListBundlesQuery,
} from '@shared/api'
import { useActionTriggers } from '@shared/hooks'
import { useGlobalContext } from '@shared/context'
import { BundleMode } from '@shared/util'
import { ActionConfigDialog } from './ActionConfigDialog'
import { InteractiveActionDialog, InteractiveForm } from './InteractiveActionDialog'
import { ContextMenuItemType } from '../ContextMenu'

type ActionEntity = { id: string; projectName: string; entitySubType?: string }

export const useActionsContextMenu = (bundleMode: BundleMode) => {
  const { user } = useGlobalContext()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { handleActionPayload } = useActionTriggers({
    onNavigate: navigate,
    onSetSearchParams: setSearchParams,
    searchParams,
  })
  const [loadActions] = useLazyGetActionsFromContextQuery()
  const [executeAction] = useExecuteActionMutation()
  const [actionBeingConfigured, setActionBeingConfigured] = useState<{
    action: any
    context: ActionContext
  } | null>(null)
  const [interactiveAction, setInteractiveAction] = useState<{
    form: InteractiveForm
    action: any
    context: ActionContext
  } | null>(null)
  const { data: bundlesData } = useListBundlesQuery(
    { archived: false },
    { skip: bundleMode !== 'developer' },
  )
  const actionsVariant = useMemo(() => {
    if (bundleMode !== 'developer') return bundleMode
    const bundles = bundlesData?.bundles?.filter((bundle) => bundle.isDev) || []
    return bundles.find((bundle) => bundle.activeUser === user?.name)?.name || bundles[0]?.name || 'developer'
  }, [bundleMode, bundlesData, user?.name])

  const execute = useCallback(
    async (action: any, context: ActionContext, formData?: Record<string, any>) => {
      try {
        const response = await executeAction({
          actionContext: formData ? { ...context, formData } : context,
          addonName: action.addonName,
          addonVersion: action.addonVersion,
          variant: action.variant,
          identifier: action.identifier,
        }).unwrap()
        if (response?.message) {
          response.success
            ? toast.success(response.message, { autoClose: 2000 })
            : toast.error(response.message, { autoClose: 2000 })
        }
        if (response?.payload) {
          if (response.type === 'form') {
            setInteractiveAction({
              form: {
                identifier: action.identifier,
                title: (response.payload as any).title,
                fields: (response.payload as any).fields,
                submitLabel: (response.payload as any).submit_label,
                cancelLabel: (response.payload as any).cancel_label,
                submitIcon: (response.payload as any).submit_icon,
                cancelIcon: (response.payload as any).cancel_icon,
              },
              action,
              context,
            })
          } else {
            handleActionPayload(response.type as string, response.payload)
          }
        }
      } catch (error: any) {
        console.error('Error executing action', error)
        toast.error(error?.data?.detail || 'Error executing action')
      }
    },
    [executeAction, handleActionPayload],
  )

  const getActionsMenuItem = useCallback(
    async (
      entities: ActionEntity[],
      entityType: ActionContext['entityType'],
      entitySubTypes?: string[],
    ): Promise<ContextMenuItemType | undefined> => {
      if (!entities.length || !entities[0].projectName) return
      const subTypes =
        entitySubTypes?.length
          ? entitySubTypes
          : [...new Set(entities.map((entity) => entity.entitySubType).filter(Boolean) as string[])]
      if (!subTypes.length && entityType !== 'version' && entityType !== 'representation') return
      const context: ActionContext = {
        projectName: entities[0].projectName,
        entityType,
        entityIds: entities.map((entity) => entity.id),
        entitySubtypes: subTypes,
      }
      let result
      try {
        result = await loadActions({
          mode: 'simple',
          variant: actionsVariant,
          actionContext: context,
        }).unwrap()
      } catch (error) {
        console.warn('Error loading actions', error)
        return
      }
      const actions = result.actions || []
      const categories = [...new Set(actions.map((action) => action.category || 'uncategorized'))].sort()
      const items = categories.flatMap((category) => [
        { label: category, disabled: true, header: true },
        ...actions
          .filter((action) => (action.category || 'uncategorized') === category)
          .map((action) => ({
            label: action.groupLabel ? `${action.groupLabel} ${action.label}` : action.label,
            icon: action.icon?.name,
            command: () => execute(action, context),
            ...(action.configFields
              ? { command: () => setActionBeingConfigured({ action, context }) }
              : {}),
          })),
      ])
      return {
        label: 'Actions',
        icon: 'play_circle',
        items: items.length
          ? items
          : [{ label: 'No actions available', disabled: true }],
      }
    },
    [actionsVariant, execute, loadActions],
  )

  const dialogs = (
    <>
      <ActionConfigDialog
        action={actionBeingConfigured?.action}
        context={actionBeingConfigured?.context as any}
        onClose={() => setActionBeingConfigured(null)}
      />
      <InteractiveActionDialog
        interactiveForm={interactiveAction?.form || null}
        onClose={() => setInteractiveAction(null)}
        onSubmit={(_identifier, formData) => {
          if (interactiveAction) void execute(interactiveAction.action, interactiveAction.context, formData)
          setInteractiveAction(null)
        }}
      />
    </>
  )

  return { getActionsMenuItem, dialogs }
}
