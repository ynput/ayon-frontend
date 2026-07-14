import { Button, ButtonProps } from '@ynput/ayon-react-components'
import { forwardRef, useState } from 'react'
import styled from 'styled-components'
import { OnSyncDataCallback, RTEntityUpdate, useSyncUpdates } from '@shared/context'

const StyledSync = styled(Button)`
  /* spin icon */
  &.syncing {
    .icon {
      animation: spin 1s linear infinite;
    }
  }
  .icon {
    /* flip */
    scale: -1 1;
    @keyframes spin {
      0% {
        transform: rotate(360deg);
      }
      100% {
        transform: rotate(0deg);
      }
    }
  }
`

interface SyncButtonProps extends Omit<ButtonProps, 'onClick'> {
  projectNames?: string[]
  topics: string[]
  onSync?: OnSyncDataCallback
  shouldSyncOnUpdate?: (update: RTEntityUpdate) => boolean
  hideWhenNoUpdates?: boolean
}

const formatUpdateType = (updateType: string, entityType: string, count: number) => {
  const entityLabel = `${entityType}${count === 1 ? '' : 's'}`
  if (updateType === 'created') return `new ${entityLabel}`
  if (updateType === 'deleted') return `${entityLabel} deleted`
  return `${count} ${entityLabel} ${updateType.replaceAll('_', ' ')}`
}

const getUpdatesTooltip = (updates: RTEntityUpdate[]) => {
  const groupedUpdates = new Map<
    string,
    { entityType: string; updateType: string; ids: Set<string> }
  >()

  updates.forEach((update) => {
    const [, entityType, updateType] = update.topic.split('.')
    if (!entityType || !updateType) return

    const key = `${entityType}.${updateType}`
    const group = groupedUpdates.get(key) || {
      entityType,
      updateType,
      ids: new Set<string>(),
    }
    group.ids.add(update.entityId || String(update.id))
    groupedUpdates.set(key, group)
  })

  const labels = Array.from(groupedUpdates.values()).map(({ entityType, updateType, ids }) =>
    formatUpdateType(updateType, entityType, ids.size),
  )

  return `${labels.join(', ')} since last sync`
}

export const SyncButton = forwardRef<HTMLButtonElement, SyncButtonProps>(
  (
    { projectNames, topics, onSync, shouldSyncOnUpdate, hideWhenNoUpdates = false, ...props },
    ref,
  ) => {
    const [isSyncing, setIsSyncing] = useState(false)
    const { updates, hasUpdates } = useSyncUpdates({
      projectNames,
      topics,
      isSyncing,
      shouldSyncOnUpdate,
    })

    if (hideWhenNoUpdates && !hasUpdates) return null

    const updatesTooltip = getUpdatesTooltip(updates)

    const handleSync = async () => {
      setIsSyncing(true)
      try {
        await onSync?.(updates)
      } finally {
        setIsSyncing(false)
      }
    }

    return (
      <StyledSync
        {...props}
        icon="sync"
        ref={ref}
        onClick={handleSync}
        className={isSyncing ? 'syncing' : ''}
        data-tooltip={hasUpdates ? updatesTooltip : 'Refresh data'}
        variant={hasUpdates ? 'filled' : 'surface'}
      />
    )
  },
)
