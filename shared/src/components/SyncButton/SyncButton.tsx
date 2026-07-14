import { Button, ButtonProps, InputSwitch } from '@ynput/ayon-react-components'
import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
import styled from 'styled-components'
import {
  OnSyncDataCallback,
  RTEntityUpdate,
  useAutoSyncSettings,
  useSyncUpdates,
} from '@shared/context'
import { Menu, MenuContainer } from '../Menu'
import { useMenuContext } from '@shared/context'
import clsx from 'clsx'

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

  &.auto-sync:not(.syncing) {
    &,
    .icon {
      color: var(--md-sys-color-primary);
    }
  }
`

const SyncSettings = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  padding: 12px 16px;
  min-width: 180px;

  .setting {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    color: var(--md-sys-color-on-surface);
    white-space: nowrap;
  }

  .global {
    padding-bottom: 8px;
    border-bottom: 1px solid var(--md-sys-color-surface-container-highest);
    font-weight: 600;
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
    const [autoSyncSettings, updateAutoSyncSettings] = useAutoSyncSettings()
    const { setMenuOpen } = useMenuContext()
    const buttonRef = useRef<HTMLButtonElement | null>(null)
    const closeTimeout = useRef<ReturnType<typeof setTimeout>>()
    const menuId = useId()

    useEffect(() => {
      return () => {
        const timeout = closeTimeout.current
        closeTimeout.current = undefined
        if (timeout !== undefined) {
          clearTimeout(timeout)
        }
      }
    }, [])
    useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement, [])

    const { updates, hasUpdates } = useSyncUpdates({
      projectNames,
      topics,
      isSyncing,
      shouldSyncOnUpdate,
    })

    if (hideWhenNoUpdates && !hasUpdates) return null

    const updatesTooltip = getUpdatesTooltip(updates)
    const isAutoSyncEnabled = Object.values(autoSyncSettings).some(Boolean)
    const isGlobalAutoSyncEnabled = Object.values(autoSyncSettings).every(Boolean)

    const cancelMenuClose = () => {
      if (closeTimeout.current) clearTimeout(closeTimeout.current)
    }

    const openSettingsMenu = () => {
      cancelMenuClose()
      setMenuOpen(menuId)
    }

    const closeSettingsMenu = () => {
      cancelMenuClose()
      closeTimeout.current = setTimeout(() => setMenuOpen(false), 100)
    }

    const handleSync = async () => {
      setIsSyncing(true)
      try {
        await onSync?.(updates)
      } finally {
        setIsSyncing(false)
      }
    }

    return (
      <>
        <StyledSync
          {...props}
          icon="sync"
          ref={buttonRef}
          onClick={handleSync}
          onMouseEnter={openSettingsMenu}
          onMouseLeave={closeSettingsMenu}
          className={clsx(props.className, {
            syncing: isSyncing,
            'auto-sync': isAutoSyncEnabled,
          })}
          data-tooltip={hasUpdates ? updatesTooltip : 'Refresh data'}
          variant={hasUpdates ? 'filled' : 'surface'}
        />
        <MenuContainer
          id={menuId}
          target={buttonRef.current}
          align="right"
          onMouseEnter={cancelMenuClose}
          onMouseLeave={closeSettingsMenu}
        >
          <Menu
            menu={[
              {
                id: 'sync-settings',
                node: (
                  <SyncSettings
                    key="sync-settings"
                    onClick={(e) => e.stopPropagation()}
                    onMouseEnter={cancelMenuClose}
                    onMouseLeave={closeSettingsMenu}
                  >
                    <div
                      className="setting global"
                      data-tooltip={
                        isGlobalAutoSyncEnabled
                          ? 'New entities and updates will be automatically synced'
                          : 'Auto updates are disabled. Click the sync button to manually refresh data.'
                      }
                    >
                      <span>Auto updates</span>
                      <InputSwitch
                        checked={isGlobalAutoSyncEnabled}
                        onChange={() =>
                          updateAutoSyncSettings({ global: !isGlobalAutoSyncEnabled })
                        }
                      />
                    </div>
                    {(['create', 'update', 'delete'] as const).map((setting) => (
                      <div className="setting" key={setting}>
                        <span>{setting[0].toUpperCase() + setting.slice(1)}</span>
                        <InputSwitch
                          checked={autoSyncSettings[setting]}
                          onChange={() =>
                            updateAutoSyncSettings({
                              settings: { [setting]: !autoSyncSettings[setting] },
                            })
                          }
                        />
                      </div>
                    ))}
                  </SyncSettings>
                ),
              },
            ]}
          />
        </MenuContainer>
      </>
    )
  },
)
