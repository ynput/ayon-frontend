import { FC, useCallback, useEffect, useState } from 'react'
import { Button, Dialog } from '@ynput/ayon-react-components'
import { toast } from 'react-toastify'
import { detailsPanelEntityTypes } from '@shared/api'
import type { DetailsPanelEntityType } from '@shared/api'
import { ProjectContextProvider } from '@shared/context'
import { useDetailsPanelContext } from '@shared/context/DetailsPanelContext'
import { useGetProductionAddon } from '@shared/hooks/useGetProductionAddon'
import { ActiveEntity, getActiveEntities, shouldBlockShortcuts } from '@shared/util'
import { EntityLinksPanel, LinkedEntityRef } from './EntityLinksPanel'
import { useEntityLinksEditAccess } from './useEntityLinksEditAccess'
import * as Styled from './EntityLinksDialog.styled'

export const ENTITY_LINKS_SHORTCUT = 'g'

// the node graph 0.4 understands ?entity=type:id deep links
const NODEGRAPH_MIN_VERSION = '0.4.0'

const isTextTarget = (e: KeyboardEvent) => {
  const target = e.target as HTMLElement | null
  return (
    !!target &&
    (target.isContentEditable ||
      target.getAttribute?.('role') === 'textbox' ||
      !!target.closest?.('.ql-editor'))
  )
}

/**
 * Press G anywhere with an entity selected to see everything linked to it.
 * Mounted once at app level.
 */
export const EntityLinksDialog: FC = () => {
  // entities that were selected when the dialog opened
  const [selection, setSelection] = useState<ActiveEntity[]>([])
  const [selectionIndex, setSelectionIndex] = useState(0)
  // entities visited by clicking links, the last one is shown
  const [trail, setTrail] = useState<ActiveEntity[]>([])
  const isOpen = trail.length > 0

  const access = useEntityLinksEditAccess()
  const { openSlideOut, useNavigate } = useDetailsPanelContext()
  const navigate = useNavigate()
  const { getProductionAddon } = useGetProductionAddon()
  const nodegraph = getProductionAddon('nodegraph', { minVersion: NODEGRAPH_MIN_VERSION })

  const close = useCallback(() => {
    setTrail([])
    setSelection([])
    setSelectionIndex(0)
  }, [])

  const open = useCallback(() => {
    const active = getActiveEntities()
    if (!active.length) {
      toast.info('Select an entity to see its links', { autoClose: 2000 })
      return
    }
    setSelection(active)
    setSelectionIndex(0)
    setTrail([active[0]])
  }, [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== ENTITY_LINKS_SHORTCUT || e.repeat) return
      if (e.ctrlKey || e.metaKey || e.altKey) return
      if (shouldBlockShortcuts(e) || isTextTarget(e)) return
      e.preventDefault()
      if (isOpen) close()
      else open()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, open, close])

  // Escape closes only the dialog. The details panel closes itself on Escape
  // from a window listener, so stop the event on document (React handlers,
  // including a nested picker dialog, have already run by then).
  useEffect(() => {
    if (!isOpen) return
    const onEscape = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      // a nested dialog (entity picker) handles its own Escape
      if (document.querySelectorAll('.dialog').length > 1) return
      close()
    }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [isOpen, close])

  if (!isOpen) return null

  const current = trail[trail.length - 1]
  const { projectName, entityType, id } = current

  const showSelection = (index: number) => {
    setSelectionIndex(index)
    setTrail([selection[index]])
  }

  const openEntity = (entity: LinkedEntityRef) =>
    setTrail((t) => [...t, { ...entity, projectName }])

  const canOpenDetails = detailsPanelEntityTypes.includes(entityType as DetailsPanelEntityType)
  const openDetails = () => {
    openSlideOut({ entityId: id, entityType: entityType as DetailsPanelEntityType, projectName })
    close()
  }

  const openNodegraph = () => {
    navigate(
      `/projects/${encodeURIComponent(projectName)}/addon/nodegraph?entity=${entityType}:${id}`,
    )
    close()
  }

  const header = (
    <Styled.Breadcrumbs>
      <span style={{ fontSize: 16, color: 'var(--md-sys-color-on-surface)' }}>Links</span>
      {selection.length > 1 && trail.length === 1 && (
        <>
          <Button
            icon="chevron_left"
            variant="text"
            disabled={selectionIndex === 0}
            onClick={() => showSelection(selectionIndex - 1)}
          />
          <span>
            {selectionIndex + 1} of {selection.length} selected
          </span>
          <Button
            icon="chevron_right"
            variant="text"
            disabled={selectionIndex >= selection.length - 1}
            onClick={() => showSelection(selectionIndex + 1)}
          />
        </>
      )}
      {trail.length > 1 && <button onClick={() => setTrail((t) => t.slice(0, -1))}>← Back</button>}
    </Styled.Breadcrumbs>
  )

  const footer = (
    <Styled.Footer>
      {!access.canEdit && (
        <span className="note">
          {access.reason === 'guest' ? (
            'Guests can only view links'
          ) : (
            <>
              <Styled.StudioChip>Studio</Styled.StudioChip>
              Editing links here is part of AYON Studio
            </>
          )}
        </span>
      )}
      <span className="grow" />
      {nodegraph && (
        <Button icon="hub" label="Open in Node Graph" variant="text" onClick={openNodegraph} />
      )}
      <Button label="Close" variant="filled" onClick={close} data-shortcut="G" />
    </Styled.Footer>
  )

  return (
    <Dialog isOpen onClose={close} header={header} footer={footer} size="lg">
      <ProjectContextProvider key={projectName} projectName={projectName}>
        <EntityLinksPanel
          key={`${entityType}:${id}`}
          projectName={projectName}
          entityType={entityType}
          entityId={id}
          canEdit={access.canEdit}
          onOpenEntity={openEntity}
          onOpenDetails={canOpenDetails ? openDetails : undefined}
        />
      </ProjectContextProvider>
    </Dialog>
  )
}
