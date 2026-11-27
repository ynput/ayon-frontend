import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import clsx from 'clsx'
import { Button, Icon, InputText, SaveButton } from '@ynput/ayon-react-components'
import {
  useGetShareOptionsQuery,
  useGetViewQuery,
  useUpdateViewMutation,
  viewsQueries,
} from '@shared/api'
import { useGlobalContext } from '@shared/context'
import { useLoadModule } from '@shared/hooks/useLoadModule'
import ViewFormDialogFallback from '@shared/containers/Views/ViewsDialogContainer/ViewFormDialogFallback'
import { getRequestErrorString } from '@shared/util'
import { useAppDispatch } from '@state/store'
import Type from '@/theme/typography.module.css'
import { applyEdits, setIconsOnly } from './applyLayout'
import {
  changeDraft,
  isEditChanged,
  layoutRenamed,
  renameEdit,
  saveEdit,
  stopEditing,
  useLayoutEdit,
  type LayoutEdit,
} from './layoutEditor'
import { getPins } from './pins'
import { LAYOUT_VIEW_TYPE } from './types'
import * as Styled from './LayoutEditPanel.styled'

type Position = { left: number; top: number }

/**
 * The panel floating over the app while a layout is edited, on every page: the layout's name,
 * sharing it, its options, how to change the sidebar and the tab rows, Cancel and Save. Save puts
 * the sidebar, the tab rows, the pins, the options and the name into the layout (or the user's
 * copy of it). It opens in the middle of the window; drag it by its header when it covers
 * something.
 */
const LayoutEditPanel = () => {
  const edit = useLayoutEdit()
  return edit ? <Panel edit={edit} /> : null
}

const Panel = ({ edit }: { edit: LayoutEdit }) => {
  const { pathname, search } = useLocation()
  const navigate = useNavigate()

  const panelRef = useRef<HTMLElement>(null)
  const [position, setPosition] = useState<Position | null>(null)
  // always the whole panel in the window, also after the window got smaller
  const clamp = useCallback((next: Position): Position => {
    const panel = panelRef.current
    if (!panel) return next
    const fit = (value: number, room: number) => Math.round(Math.min(Math.max(value, 0), room))
    return {
      left: fit(next.left, window.innerWidth - panel.offsetWidth),
      top: fit(next.top, window.innerHeight - panel.offsetHeight),
    }
  }, [])
  // in the middle of the window when editing starts
  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    setPosition(
      clamp({
        left: (window.innerWidth - panel.offsetWidth) / 2,
        top: (window.innerHeight - panel.offsetHeight) / 2,
      }),
    )
    const onResize = () => setPosition((current) => current && clamp(current))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [clamp])

  // dragged by its header; the pointer is captured, so the drag goes on over an addon's iframe
  const drag = useRef<{ x: number; y: number; from: Position } | null>(null)
  const [dragging, setDragging] = useState(false)
  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || !position) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, from: position }
    setDragging(true)
  }
  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const start = drag.current
    if (!start) return
    setPosition(
      clamp({
        left: start.from.left + e.clientX - start.x,
        top: start.from.top + e.clientY - start.y,
      }),
    )
  }
  const onPointerUp = () => {
    drag.current = null
    setDragging(false)
  }

  const cancel = () => {
    stopEditing()
    // a tab pinned in this edit goes with it: when it is open, back to the page with its own view,
    // as after Unpin
    const params = new URLSearchParams(search)
    const open = params.get('view')
    const pinned = (layout: typeof edit.draft) => getPins(layout).some((pin) => pin.id === open)
    if (!open || !pinned(edit.draft) || pinned(edit.initial)) return
    params.delete('view')
    const rest = params.toString()
    navigate(rest ? `${pathname}?${rest}` : pathname)
  }

  const save = () =>
    saveEdit(applyEdits).catch((error) =>
      toast.error(`Couldn't save the layout: ${getRequestErrorString(error)}`),
    )
  const named = !!edit.label.trim()

  const iconsOnly = !!edit.draft.iconsOnly
  const showIcons = (on: boolean) => changeDraft((draft) => setIconsOnly(draft, on))

  // sharing: the views form, as for any saved view (with the layout's name and Delete)
  const [sharing, setSharing] = useState(false)
  const shareable = !!edit.layoutId && edit.owned

  return (
    <Styled.Panel
      ref={panelRef}
      aria-label="Editing layout"
      data-layout-edit-panel=""
      style={position ?? { visibility: 'hidden' }}
    >
      <Styled.Header
        className={clsx({ dragging })}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <Icon icon="dashboard_customize" />
        <h2 className={Type.titleMedium}>Editing layout</h2>
        <Icon icon="drag_indicator" className="handle" data-tooltip="Drag to move" />
      </Styled.Header>
      <Styled.Hint className={Type.bodyMedium}>
        Hide or show sidebar items and tabs with the eye, drag them to reorder.
      </Styled.Hint>
      <Styled.Rows>
        {/* what Save calls it: its name, or the user's copy's */}
        <Styled.Row>
          <label className={Type.labelLarge} htmlFor="layout-edit-name">
            Name
          </label>
          <InputText
            id="layout-edit-name"
            value={edit.label}
            disabled={edit.saving}
            onChange={(e) => renameEdit(e.target.value)}
          />
        </Styled.Row>
        {!edit.layoutId && (
          <Styled.Note className={Type.bodySmall}>
            Saving makes it your own layout, under this name.
          </Styled.Note>
        )}
        <Styled.Row>
          <span className={Type.labelLarge}>Sharing</span>
          <Button
            icon="share"
            label="Share…"
            variant="text"
            disabled={!shareable || edit.saving}
            onClick={() => setSharing(true)}
            data-tooltip={
              shareable
                ? undefined
                : edit.layoutId
                ? 'Only its owner can share it'
                : 'Save it first: then it is yours to share'
            }
          />
        </Styled.Row>
        {/* the sidebar's items with their names, or their icons only (names on hover) */}
        <Styled.Row>
          <span className={Type.labelLarge}>Sidebar</span>
          <Styled.Choice role="group" aria-label="Sidebar">
            <button
              type="button"
              aria-pressed={!iconsOnly}
              disabled={edit.saving}
              onClick={() => showIcons(false)}
            >
              <Icon icon="view_sidebar" />
              Names
            </button>
            <button
              type="button"
              aria-pressed={iconsOnly}
              disabled={edit.saving}
              onClick={() => showIcons(true)}
            >
              <Icon icon="left_panel_close" />
              Icons only
            </button>
          </Styled.Choice>
        </Styled.Row>
      </Styled.Rows>
      <Styled.Footer>
        <Button variant="text" label="Cancel" disabled={edit.saving} onClick={cancel} />
        <SaveButton
          label="Save layout"
          active={named && isEditChanged(edit) && !edit.saving}
          saving={edit.saving}
          onClick={save}
        />
      </Styled.Footer>
      {sharing && edit.layoutId && (
        <ShareDialog edit={edit} layoutId={edit.layoutId} onClose={() => setSharing(false)} />
      )}
    </Styled.Panel>
  )
}

/** The layout's views form: who it is shared with, its name (saved at once), Delete. */
const ShareDialog = ({
  edit,
  layoutId,
  onClose,
}: {
  edit: LayoutEdit
  layoutId: string
  onClose: () => void
}) => {
  const dispatch = useAppDispatch()
  const { user: currentUser } = useGlobalContext()
  const { data: view, isFetching } = useGetViewQuery({ viewType: LAYOUT_VIEW_TYPE, viewId: layoutId })
  // layouts are studio-wide: shared with anyone in the studio
  const { data: shareOptions } = useGetShareOptionsQuery({})
  const [updateView] = useUpdateViewMutation()
  const [ViewFormDialog] = useLoadModule({
    addon: 'powerpack',
    remote: 'views',
    module: 'ViewFormDialog',
    fallback: ViewFormDialogFallback,
    minVersion: '1.1.1',
  })

  return (
    <ViewFormDialog
      editingView={{ viewId: layoutId, ...(view ?? {}) }}
      setEditingView={(viewId) => {
        if (viewId === null) onClose()
      }}
      isLoading={isFetching}
      viewType={LAYOUT_VIEW_TYPE}
      viewAlias="Layout"
      currentUser={currentUser}
      shareOptions={shareOptions}
      setSelected={() => undefined}
      onCreateView={async () => undefined}
      onUpdateView={async (viewId, payload) => {
        await updateView({
          viewType: LAYOUT_VIEW_TYPE,
          viewId,
          genericViewPatchModel: payload as Record<string, unknown>,
        }).unwrap()
        // renamed in the form: that is its name now
        const label = (payload as { label?: string }).label
        if (label && label !== edit.name) layoutRenamed(label)
      }}
      onDeleteView={async (viewId) => {
        // the layout being edited is gone: so is the edit
        stopEditing()
        await edit.remove(viewId)
      }}
      api={viewsQueries}
      dispatch={dispatch}
    />
  )
}

export default LayoutEditPanel
