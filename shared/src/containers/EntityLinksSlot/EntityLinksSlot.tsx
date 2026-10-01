// Press G anywhere with an entity selected to see everything linked to it.
// The links dialog is part of the Power Pack and loaded from it as a remote
// module ("links/EntityLinksDialog"); without the Power Pack, G shows what the
// Power Pack offers. This slot owns the shortcut and the selection, the module
// owns the dialog.

import { FC, useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { detailsPanelEntityTypes } from '@shared/api'
import type { DetailsPanelEntityType } from '@shared/api'
import { usePowerpack } from '@shared/context/PowerpackContext'
import { useRemoteModules } from '@shared/context/RemoteModulesContext'
import { useDetailsPanelContext } from '@shared/context/DetailsPanelContext'
import { useGlobalContext } from '@shared/context/GlobalContext'
import { useGetProductionAddon } from '@shared/hooks/useGetProductionAddon'
import { useLoadModule } from '@shared/hooks/useLoadModule'
import { getActiveEntities, shouldBlockShortcuts } from '@shared/util'
import type { ActiveEntity } from '@shared/util'

export const ENTITY_LINKS_SHORTCUT = 'g'

// the Power Pack version that has the links dialog
const POWERPACK_MIN_VERSION = '1.6.7'
// the Node Graph understands ?entity=type:id deep links from 0.4
const NODEGRAPH_MIN_VERSION = '0.4.0'

/** What the host passes to the links dialog module. */
export interface EntityLinksDialogProps {
  /** entities selected when G was pressed; the dialog starts with the first */
  entities: ActiveEntity[]
  onClose: () => void
  /** open an entity in the details slide-out (details panel entity types only) */
  onOpenDetails: (entity: ActiveEntity) => void
  /** open an entity in the Node Graph; missing when Node Graph 0.4+ is not installed */
  onOpenInNodegraph?: (entity: ActiveEntity) => void
  /** guests can only look at links */
  readOnly: boolean
}

// Without the Power Pack, G opens the Power Pack dialog on the links feature.
const EntityLinksDialogFallback: FC<EntityLinksDialogProps> = ({ onClose }) => {
  const { setPowerpackDialog } = usePowerpack()
  useEffect(() => {
    setPowerpackDialog('entityLinks')
    onClose()
  }, [setPowerpackDialog, onClose])
  return null
}

const isTextTarget = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement | null
  return (
    !!target &&
    (target.isContentEditable ||
      target.getAttribute?.('role') === 'textbox' ||
      !!target.closest?.('.ql-editor'))
  )
}

/** Mounted once at app level, inside the details panel and Power Pack providers. */
export const EntityLinksSlot: FC = () => {
  const [entities, setEntities] = useState<ActiveEntity[] | null>(null)
  const [EntityLinksDialog, { isLoaded, isLoading, outdated }] = useLoadModule({
    addon: 'powerpack',
    remote: 'links',
    module: 'EntityLinksDialog',
    fallback: EntityLinksDialogFallback,
    minVersion: POWERPACK_MIN_VERSION,
  })
  // the Power Pack offers the dialog, so not having it means it failed to load
  const { modules } = useRemoteModules()
  const failedToLoad =
    !isLoaded && !!modules.find((m) => m.addonName === 'powerpack')?.modules?.links
  const { openSlideOut, useNavigate } = useDetailsPanelContext()
  const navigate = useNavigate()
  const { getProductionAddon } = useGetProductionAddon()
  const hasNodegraph = !!getProductionAddon('nodegraph', { minVersion: NODEGRAPH_MIN_VERSION })
  const { user } = useGlobalContext()

  const isOpen = !!entities
  const close = useCallback(() => setEntities(null), [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== ENTITY_LINKS_SHORTCUT || e.repeat) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (shouldBlockShortcuts(e) || isTextTarget(e)) return
      // until the module has loaded we would show the fallback by mistake
      if (isLoading) return
      e.preventDefault()
      if (isOpen) return close()
      const active = getActiveEntities()
      if (!active.length) {
        toast.info('Select an entity to see its links', { autoClose: 2000 })
        return
      }
      // the Power Pack is there but too old for the links dialog
      if (outdated) {
        toast.info(`The links dialog needs Power Pack ${outdated.required} or newer`)
        return
      }
      if (failedToLoad) {
        toast.error('The links dialog could not be loaded, see the browser console')
        return
      }
      setEntities(active)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, isLoading, outdated, failedToLoad, close])

  const openDetails = useCallback(
    (entity: ActiveEntity) => {
      if (!detailsPanelEntityTypes.includes(entity.entityType as DetailsPanelEntityType)) return
      openSlideOut({
        entityId: entity.id,
        entityType: entity.entityType as DetailsPanelEntityType,
        projectName: entity.projectName,
      })
      close()
    },
    [openSlideOut, close],
  )

  const openInNodegraph = useCallback(
    (entity: ActiveEntity) => {
      navigate(
        `/projects/${encodeURIComponent(entity.projectName)}/addon/nodegraph?entity=${
          entity.entityType
        }:${entity.id}`,
      )
      close()
    },
    [navigate, close],
  )

  if (!entities) return null

  return (
    <EntityLinksDialog
      entities={entities}
      onClose={close}
      onOpenDetails={openDetails}
      onOpenInNodegraph={hasNodegraph ? openInNodegraph : undefined}
      readOnly={!!user?.data?.isGuest}
    />
  )
}
