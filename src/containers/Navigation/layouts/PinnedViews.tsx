import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Button, Dialog, InputText, SaveButton } from '@ynput/ayon-react-components'
import { useCreateViewMutation, useUpdateViewMutation } from '@shared/api'
import { Menu, MenuContainer } from '@shared/components'
import { copyToClipboard } from '@shared/util'
import { generateViewId, ViewsProvider, type ViewSettings } from '@shared/containers/Views'
import { useAppDispatch } from '@state/store'
import LoadingPage from '@pages/LoadingPage'
import { pinnedViewPath, type VisiblePin } from './pins'
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
  const { views, listed, view, isFetching } = usePinnedView(projectName, viewType, viewId)
  const { drafts, mergeDraft } = usePinnedViewDrafts()
  const draft = drafts[viewId]

  useEffect(() => {
    // a view just saved may not be in the list yet
    if (views && !listed && !isFetching) {
      toast.warning("You can't open this view")
      navigate(fallbackPath, { replace: true })
    }
  }, [views, listed, isFetching, fallbackPath, navigate])

  const settings = useMemo(
    () => (view ? ({ ...(view.settings as ViewSettings), ...draft } as ViewSettings) : undefined),
    [view, draft],
  )
  const onChange = useCallback(
    (changed: ViewSettings) => mergeDraft(viewId, changed),
    [mergeDraft, viewId],
  )

  if (!settings) return <LoadingPage />

  return (
    <ViewsProvider
      controlled={{ settings, onChange }}
      projectName={projectName}
      dispatch={dispatch}
    >
      {children}
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
  rename: (id: string, label: string) => void
  move: (id: string, delta: number) => void
  unpin: (id: string) => void
  repoint: (id: string, view: PinnedView) => void
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
  const { drafts, clearDraft } = usePinnedViewDrafts()
  const [dialog, setDialog] = useState<null | { kind: 'rename' | 'saveAs'; pin: PinnedView }>(null)
  const [createView] = useCreateViewMutation()
  const [updateView] = useUpdateViewMutation()

  // the menu's tab, or the dialog's once the menu has closed
  const pin = target?.pin ?? dialog?.pin
  const index = pin ? pins.findIndex((item) => item.pin.id === pin.id) : -1
  const listed = index === -1 ? undefined : pins[index].view
  const isOpen = !!pin && pin.id === openViewId
  const draft = pin ? drafts[pin.id] : undefined

  // the open view's saved settings, already loaded by the page
  const { view, refetchList } = usePinnedView(
    projectName,
    pin?.viewType ?? 'overview',
    pin?.id ?? '',
  )
  const viewProject = listed?.scope === 'project' ? projectName : undefined
  const merged = view ? { ...(view.settings as ViewSettings), ...draft } : undefined
  const label = (pin && (pin.label || listed?.label)) || 'View'

  const saveChanges = async () => {
    if (!pin || !merged) return
    try {
      await updateView({
        viewType: pin.viewType,
        viewId: pin.id,
        projectName: viewProject,
        genericViewPatchModel: { settings: merged },
      }).unwrap()
      clearDraft(pin.id)
      toast.success(`Saved the changes to "${listed?.label ?? label}"`)
    } catch (error: any) {
      toast.error(error?.data?.detail || "Couldn't save the view")
    }
  }

  const saveAsNew = async (old: PinnedView, name: string) => {
    if (!merged) return
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
    // a studio view: creating it refreshes the studio list, not this project's, which holds it too
    await refetchList()
    const next: PinnedView = {
      id,
      viewType: old.viewType,
      scope: viewProject ? 'project' : 'studio',
      ...(viewProject ? { projectName: viewProject } : {}),
    }
    repoint(old.id, next)
    clearDraft(old.id)
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
          disabled: index === -1 || index >= pins.length - 1,
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
