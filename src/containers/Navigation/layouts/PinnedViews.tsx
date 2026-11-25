import { Fragment, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button, Dialog, InputText, SaveButton } from '@ynput/ayon-react-components'
import { useCreateViewMutation, useUpdateViewMutation } from '@shared/api'
import { Menu, MenuContainer } from '@shared/components'
import { copyToClipboard } from '@shared/util'
import { generateViewId, ViewsProvider, type ViewSettings } from '@shared/containers/Views'
import { useAppDispatch } from '@state/store'
import LoadingPage from '@pages/LoadingPage'
import { applyDraft, pinnedViewPath, samePagePins, type VisiblePin } from './pins'
import { PINNED_PAGES, type PinnableViewType, type PinnedView } from './types'
import { UPDATE_ACCESS, usePinnedView, usePinnedViewDrafts } from './PinnedViewsHelpers'
import * as Styled from './PinnedViews.styled'

// ---------------------------------------------------------------------------------------------
// the page a pinned tab opens

interface PinnedViewPageProps {
  projectName: string
  viewType: PinnableViewType
  viewId: string
  /** where to go when the user can't open the view: the page without it */
  fallbackPath: string
  children: ReactNode
}

/**
 * The page with a saved view's settings, held here instead of in the user's selected view:
 * changes stay a draft for the session until saved, and the page's own view doesn't change.
 */
export const PinnedViewPage = ({
  projectName,
  viewType,
  viewId,
  fallbackPath,
  children,
}: PinnedViewPageProps) => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { views, listed, view, isFetching, isError } = usePinnedView(projectName, viewType, viewId)
  const { drafts, mergeDraft } = usePinnedViewDrafts()
  const draft = drafts[viewId]

  useEffect(() => {
    // a view just saved may not be in the list yet
    // a failed request only matters when there is nothing to show
    const failed = isError && !view
    if (failed || (views && !listed && !isFetching && !isError)) {
      toast.warning(failed ? "Couldn't open this view" : "You can't open this view")
      navigate(fallbackPath, { replace: true })
    }
  }, [views, listed, view, isFetching, isError, fallbackPath, navigate])

  // pages keep some settings in their own state (Products' grid, grouping, columns): they start
  // again from the view on another view, and when the draft is reverted or saved
  const [resets, setResets] = useState(0)
  const hadDraft = useRef(!!draft)
  useEffect(() => {
    if (hadDraft.current && !draft) setResets((count) => count + 1)
    hadDraft.current = !!draft
  }, [draft])

  const settings = useMemo(
    () => (view ? applyDraft(view.settings as ViewSettings, draft) : undefined),
    [view, draft],
  )
  const onChange = useCallback(
    (changed: ViewSettings) => mergeDraft(viewId, changed),
    [mergeDraft, viewId],
  )
  // "Reset filters" on a pinned tab clears the filters in its draft
  const onReset = useCallback(
    () => mergeDraft(viewId, { filter: undefined, folderFilter: undefined } as ViewSettings),
    [mergeDraft, viewId],
  )

  if (!settings) return <LoadingPage />

  return (
    <ViewsProvider
      controlled={{ settings, onChange, onReset }}
      projectName={projectName}
      dispatch={dispatch}
    >
      <Fragment key={`${viewId}:${resets}`}>{children}</Fragment>
    </ViewsProvider>
  )
}

// ---------------------------------------------------------------------------------------------
// a name: "Save as new view" and "Rename tab"

interface NameDialogProps {
  header: string
  initial: string
  submitLabel: string
  onSubmit: (name: string) => Promise<unknown> | void
  onClose: () => void
}

const NameDialog = ({ header, initial, submitLabel, onSubmit, onClose }: NameDialogProps) => {
  const [name, setName] = useState(initial)
  const [saving, setSaving] = useState(false)
  const submit = async () => {
    if (!name.trim() || saving) return
    setSaving(true)
    try {
      await onSubmit(name.trim())
      onClose()
    } catch {
      // the caller showed what failed; the dialog stays open to try again
    } finally {
      setSaving(false)
    }
  }
  return (
    <Dialog
      isOpen
      size="sm"
      header={header}
      onClose={onClose}
      footer={
        <>
          <Button label="Cancel" variant="text" onClick={onClose} />
          <SaveButton label={submitLabel} active={!!name.trim()} saving={saving} onClick={submit} />
        </>
      }
    >
      <InputText
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        style={{ width: '100%' }}
        aria-label={header}
      />
    </Dialog>
  )
}

// ---------------------------------------------------------------------------------------------
// the pinned tab's menu: the open view's changes, then the tab itself

export interface PinnedTabMenuTarget {
  pin: PinnedView
  element: HTMLElement
}

interface PinnedTabMenuProps {
  projectName: string
  pins: VisiblePin[]
  /** the pinned view open on the page, if any */
  openViewId?: string | null
  target: PinnedTabMenuTarget | null
  onClose: () => void
  rename: (id: string, label: string) => Promise<unknown>
  move: (id: string, delta: -1 | 1) => Promise<unknown>
  unpin: (id: string) => Promise<unknown>
  repoint: (id: string, view: PinnedView) => Promise<unknown>
}

export const PinnedTabMenu = ({
  projectName,
  pins,
  openViewId,
  target,
  onClose,
  rename,
  move,
  unpin,
  repoint,
}: PinnedTabMenuProps) => {
  const navigate = useNavigate()
  const { drafts, clearDraft, clearSavedDraft } = usePinnedViewDrafts()
  const [dialog, setDialog] = useState<null | { kind: 'rename' | 'saveAs'; pin: PinnedView }>(null)
  const [createView] = useCreateViewMutation()
  const [updateView] = useUpdateViewMutation()

  // the menu's tab, or the dialog's once the menu has closed
  const pin = target?.pin ?? dialog?.pin
  const listed = pin ? pins.find((item) => item.pin.id === pin.id)?.view : undefined
  // a tab moves among the pins next to the same page
  const siblings = pin ? samePagePins(pins, pin.id) : []
  const index = pin ? siblings.findIndex((item) => item.pin.id === pin.id) : -1
  const isOpen = !!pin && pin.id === openViewId
  const draft = pin ? drafts[pin.id] : undefined

  // the open view's saved settings, already loaded by the page
  // the open view's saved settings, already loaded by the page; nothing while the menu is closed
  const { view, refetchList } = usePinnedView(
    projectName,
    pin?.viewType ?? 'overview',
    pin?.id ?? '',
    !pin,
  )
  const viewProject = listed?.scope === 'project' ? projectName : undefined
  const merged = view ? applyDraft(view.settings as ViewSettings, draft) : undefined
  const label = (pin && (pin.label || listed?.label)) || 'View'

  const saveChanges = async () => {
    if (!pin || !merged) return
    // edits made while it saves stay a draft
    const submitted = draft
    try {
      await updateView({
        viewType: pin.viewType,
        viewId: pin.id,
        projectName: viewProject,
        genericViewPatchModel: { settings: merged },
      }).unwrap()
      clearSavedDraft(pin.id, submitted)
      toast.success(`Saved the changes to "${listed?.label ?? label}"`)
    } catch (error: any) {
      toast.error(error?.data?.detail || "Couldn't save the view")
    }
  }

  const saveAsNew = async (old: PinnedView, name: string) => {
    if (!merged) return
    // edits made while it saves stay a draft of the old view
    const submitted = draft
    const id = generateViewId()
    try {
      await createView({
        viewType: old.viewType,
        projectName: viewProject,
        // a saved view: without `working: false` it would replace the user's working view
        genericViewPostModel: { id, label: name, working: false, settings: merged },
      }).unwrap()
    } catch (error: any) {
      toast.error(error?.data?.detail || "Couldn't save the view")
      throw error
    }
    const next: PinnedView = {
      id,
      viewType: old.viewType,
      scope: viewProject ? 'project' : 'studio',
      ...(viewProject ? { projectName: viewProject } : {}),
    }
    // a studio view: creating it refreshes the studio list, not this project's, which holds it too
    try {
      const refreshed = await refetchList().unwrap()
      if (!refreshed.some((item) => item.id === id)) throw new Error('not listed')
      await repoint(old.id, next)
    } catch {
      // the view is saved (trying again would save it twice): the tab and its draft stay
      toast.error(`Saved "${name}", but couldn't move the tab to it. Pin it from the views menu.`)
      return
    }
    clearSavedDraft(old.id, submitted)
    navigate(pinnedViewPath(projectName, next))
  }

  const items = !pin
    ? []
    : [
        ...(isOpen
          ? [
              {
                id: 'save',
                label: 'Save changes to view',
                icon: 'save',
                disabled: !draft || (listed?.accessLevel ?? 0) < UPDATE_ACCESS,
                onClick: saveChanges,
              },
              {
                id: 'save-as',
                label: 'Save as new view…',
                icon: 'add',
                onClick: () => setDialog({ kind: 'saveAs', pin }),
              },
              {
                id: 'revert',
                label: 'Revert changes',
                icon: 'undo',
                disabled: !draft,
                onClick: () => clearDraft(pin.id),
              },
              { id: 'divider' },
            ]
          : []),
        {
          id: 'rename',
          label: 'Rename tab…',
          icon: 'edit',
          onClick: () => setDialog({ kind: 'rename', pin }),
        },
        {
          id: 'left',
          label: 'Move left',
          icon: 'arrow_back',
          disabled: index <= 0,
          onClick: () => move(pin.id, -1),
        },
        {
          id: 'right',
          label: 'Move right',
          icon: 'arrow_forward',
          disabled: index === -1 || index >= siblings.length - 1,
          onClick: () => move(pin.id, 1),
        },
        { id: 'divider' },
        {
          id: 'copy',
          label: 'Copy link',
          icon: 'link',
          onClick: () => copyToClipboard(window.location.origin + pinnedViewPath(projectName, pin)),
        },
        {
          id: 'new-tab',
          label: 'Open in new browser tab',
          icon: 'open_in_new',
          onClick: () => window.open(pinnedViewPath(projectName, pin), '_blank'),
        },
        { id: 'divider' },
        {
          id: 'unpin',
          label: 'Unpin',
          icon: 'keep_off',
          onClick: () => {
            unpin(pin.id)
            // the open tab is gone: back to the page with its own view
            if (isOpen) navigate(`/projects/${projectName}/${PINNED_PAGES[pin.viewType].module}`)
          },
        },
      ]

  return (
    <>
      <MenuContainer
        id="pinned-tab"
        isOpen={!!target}
        onDismiss={onClose}
        target={target?.element ?? null}
        align="left"
      >
        <Menu menu={items} />
      </MenuContainer>
      {dialog && (
        <NameDialog
          header={dialog.kind === 'rename' ? 'Rename tab' : 'Save as new view'}
          initial={dialog.kind === 'rename' ? label : `${listed?.label ?? label} (copy)`}
          submitLabel={dialog.kind === 'rename' ? 'Rename' : 'Save view'}
          onSubmit={(name) =>
            dialog.kind === 'rename' ? rename(dialog.pin.id, name) : saveAsNew(dialog.pin, name)
          }
          onClose={() => setDialog(null)}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------------------------
// what a pinned tab adds after its name: a dot for unsaved changes, the menu on the open tab

interface PinnedTabEndProps {
  edited: boolean
  open: boolean
  /** opens the tab's menu, beside the tab */
  onMenu: (tab: HTMLElement) => void
}

export const PinnedTabEnd = ({ edited, open, onMenu }: PinnedTabEndProps) => (
  <>
    {edited && <Styled.EditedDot data-tooltip="Unsaved changes" />}
    {open && (
      <Styled.TabMenuIcon
        icon="expand_more"
        role="button"
        aria-label="Tab menu"
        onClick={(e) => {
          // the icon sits inside the tab's link
          e.preventDefault()
          e.stopPropagation()
          const tab = (e.currentTarget as HTMLElement).closest('li')
          if (tab) onMenu(tab)
        }}
      />
    )}
  </>
)
