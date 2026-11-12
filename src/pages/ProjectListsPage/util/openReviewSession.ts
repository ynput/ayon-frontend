import { toast } from 'react-toastify'
import type { ActionContext, useExecuteActionMutation } from '@shared/api'

type OpenReviewSessionArgs = {
  executeAction: ReturnType<typeof useExecuteActionMutation>[0]
  projectName: string
  reviewAddonVersion: string
  entityType: NonNullable<ActionContext['entityType']>
  entityIds: string[]
}

/**
 * Opens the entities in an unsaved review session in a new tab, with the Review addon's
 * "Open in review" action.
 */
export const openReviewSession = async ({
  executeAction,
  projectName,
  reviewAddonVersion,
  entityType,
  entityIds,
}: OpenReviewSessionArgs) => {
  const loadingToast = toast.loading('Opening review session...')
  try {
    const result = await executeAction({
      identifier: `review-create-session-from-${entityType}s`,
      actionContext: { projectName, entityType, entityIds },
      addonName: 'review',
      addonVersion: reviewAddonVersion,
    }).unwrap()
    const payload = result.payload as { uri?: string; new_tab?: boolean } | undefined
    if (result.success && result?.type === 'redirect' && payload?.uri) {
      toast.update(loadingToast, {
        render: 'Review session created, redirecting...',
        type: 'success',
        isLoading: false,
        autoClose: 3000,
      })
      window.open(payload.uri, '_blank')
    } else {
      toast.update(loadingToast, {
        render: 'Unexpected response from review addon',
        type: 'error',
        isLoading: false,
        autoClose: 5000,
      })
    }
  } catch (error) {
    console.error('Error creating review session', error)
    toast.update(loadingToast, {
      render: 'Error creating review session',
      type: 'error',
      isLoading: false,
      autoClose: 5000,
    })
  }
}
