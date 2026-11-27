import { useCallback, useMemo, useRef } from 'react'
import {
  useCreateViewMutation,
  useDeleteViewMutation,
  useGetBaseViewQuery,
  useGetProjectQuery,
  useGetViewQuery,
  useListViewsQuery,
  useSetFrontendPreferencesMutation,
  useUpdateProjectMutation,
  useUpdateViewMutation,
  viewsQueries,
} from '@shared/api'
import { toast } from 'react-toastify'
import { usePowerpack } from '@shared/context'
import { BASE_VIEW_ID, generateViewId } from '@shared/containers/Views'
import { useAppDispatch, useAppSelector } from '@state/store'
import { updateUserPreferences } from '@state/user'
import { resolveLayout, toNavLayout } from './applyLayout'
import { getLayoutEdit, startEditing, useLayoutEdit } from './layoutEditor'
import { LAYOUT_KEY, LAYOUT_VIEW_TYPE, type LayoutSettings } from './types'

/** at least this access level changes a shared layout (owner, or shared with update rights) */
const UPDATE_ACCESS = 20

type LayoutChange = (layout: LayoutSettings | undefined) => LayoutSettings

// Changes to a named layout run one at a time, each on what the one before saved: updating a view
// puts its settings into the cache, where the next change reads them.
let namedQueue: Promise<unknown> = Promise.resolve()
// The layout being made for a change to one the user can't change, by that layout's id ('' for
// none): a change made before it is picked goes into it too, instead of making another one.
const copies = new Map<string, Promise<string>>()

const isNotFound = (error: unknown) => (error as { status?: unknown })?.status === 404

/**
 * The layout that applies here (`resolveLayout`: picked, the project's default, the studio
 * default, or none) and how to change it. A change goes into that layout when the user may change
 * it; otherwise the first change saves a layout the user owns and picks it: a copy ("{name}
 * (mine)"), or "My layout" when none applied. Needs the Power Pack licence; without it there is
 * none.
 */
export const useActiveLayout = (projectName?: string) => {
  const { powerLicense } = usePowerpack()
  const enabled = !!powerLicense
  const dispatch = useAppDispatch()
  const userName = useAppSelector((state) => state.user?.name)
  // the user preferences' slice isn't typed for this key
  const picked = useAppSelector(
    (state) =>
      (state.user?.data?.frontendPreferences as Record<string, unknown> | undefined)?.[
        LAYOUT_KEY
      ] as string | undefined,
  )

  const projectQuery = useGetProjectQuery(
    { projectName: projectName ?? '' },
    { skip: !enabled || !projectName },
  )
  const projectDefault = (projectQuery.currentData?.data as Record<string, unknown> | undefined)?.[
    LAYOUT_KEY
  ] as string | undefined
  const listQuery = useListViewsQuery({ viewType: LAYOUT_VIEW_TYPE }, { skip: !enabled })
  const layouts = listQuery.currentData
  const baseQuery = useGetBaseViewQuery({ viewType: LAYOUT_VIEW_TYPE }, { skip: !enabled })
  const studioDefault = baseQuery.currentData

  // the studio default is readable by everyone, also when the list leaves it out
  const readable = useMemo(
    () => [
      ...(layouts ?? []).flatMap((view) => (view.id ? [view.id] : [])),
      ...(studioDefault?.id ? [studioDefault.id] : []),
    ],
    [layouts, studioDefault?.id],
  )
  const { source, id } = resolveLayout({
    picked,
    projectDefault,
    readable,
    studioDefault: studioDefault?.id,
  })
  // the studio default is the layout base view, also when it is picked or a project's default
  const isBase = !!id && id === studioDefault?.id
  // any other layout: picked, or a project's default
  const named = id && !isBase ? id : undefined
  const namedQuery = useGetViewQuery(
    { viewType: LAYOUT_VIEW_TYPE, viewId: named ?? '' },
    { skip: !named },
  )

  // Everything that decides the layout has answered with data, or that there is no studio default
  // (404): after another error the layout would be a fallback. Until then the layout may still
  // switch, so it isn't changed, and a switch isn't told from the first load.
  const ready =
    enabled &&
    layouts !== undefined &&
    (studioDefault !== undefined || isNotFound(baseQuery.error)) &&
    (!projectName || projectQuery.currentData !== undefined) &&
    (!named || namedQuery.currentData !== undefined)

  const layout: LayoutSettings | undefined = !enabled
    ? undefined
    : isBase
    ? (studioDefault?.settings as LayoutSettings | undefined)
    : named
    ? (namedQuery.currentData?.settings as LayoutSettings | undefined)
    : undefined
  const listed = layouts?.find((view) => view.id === named)
  const canUpdate = !!named && (listed?.accessLevel ?? 0) >= UPDATE_ACCESS
  // the user's own: they may share it
  const owned = !!named && !!userName && listed?.owner === userName
  // what the user sees it called
  const name = isBase ? 'Studio default' : named ? listed?.label || 'Layout' : 'Default'
  // what the user's copy of it is called, when a change can't go into it
  const copyName = id ? `${name} (mine)` : 'My layout'

  const [updateView] = useUpdateViewMutation()
  const [createView] = useCreateViewMutation()
  const [deleteView] = useDeleteViewMutation()
  const [setPreferences] = useSetFrontendPreferencesMutation()
  const [updateProject] = useUpdateProjectMutation()

  /** picks a layout for the user, everywhere; `null` follows the defaults again */
  const pick = useCallback(
    async (layoutId: string | null) => {
      // saved first: the navigation switches once the choice is kept
      if (userName)
        await setPreferences({ userName, patchData: { [LAYOUT_KEY]: layoutId } }).unwrap()
      dispatch(updateUserPreferences({ [LAYOUT_KEY]: layoutId }))
    },
    [dispatch, setPreferences, userName],
  )

  /** the project's default layout (managers); `null` removes it */
  const setProjectDefault = useCallback(
    async (layoutId: string | null) => {
      if (!projectName) throw new Error('No project is open')
      // project data is patched one key at a time: null removes the key
      await updateProject({
        projectName,
        projectPatchModel: { data: { [LAYOUT_KEY]: layoutId } },
      }).unwrap()
    },
    [projectName, updateProject],
  )

  /**
   * Makes a layout the studio default (admins): the base view gets a copy of its settings, so
   * later changes to that layout don't change the default. `null` removes it.
   */
  const setStudioDefault = useCallback(
    async (layoutId: string | null) => {
      if (!layoutId) {
        if (studioDefault?.id)
          await deleteView({ viewType: LAYOUT_VIEW_TYPE, viewId: studioDefault.id }).unwrap()
        return
      }
      const view = await dispatch(
        viewsQueries.endpoints.getView.initiate(
          { viewType: LAYOUT_VIEW_TYPE, viewId: layoutId },
          { subscribe: false },
        ),
      ).unwrap()
      const settings = (view.settings ?? {}) as LayoutSettings
      if (studioDefault?.id) {
        await updateView({
          viewType: LAYOUT_VIEW_TYPE,
          viewId: studioDefault.id,
          genericViewPatchModel: { settings },
        }).unwrap()
        // a settings-only update leaves the base view's cache as it was
        dispatch(viewsQueries.util.invalidateTags([{ type: 'view', id: studioDefault.id }]))
      }
      // the base view's label makes it one; the server gives it its id
      else
        await createView({
          viewType: LAYOUT_VIEW_TYPE,
          genericViewPostModel: { label: BASE_VIEW_ID, working: false, settings },
        }).unwrap()
    },
    [dispatch, studioDefault?.id, updateView, createView, deleteView],
  )

  const writeNamed = useCallback(
    (viewId: string, change: LayoutChange, label?: string) => {
      const write = async () => {
        // the layout as last saved: from the cache, else from the server
        const view = await dispatch(
          viewsQueries.endpoints.getView.initiate(
            { viewType: LAYOUT_VIEW_TYPE, viewId },
            { subscribe: false },
          ),
        ).unwrap()
        await updateView({
          viewType: LAYOUT_VIEW_TYPE,
          viewId,
          genericViewPatchModel: {
            settings: change(view.settings as LayoutSettings),
            ...(label ? { label } : {}),
          },
        }).unwrap()
        return viewId
      }
      const result = namedQueue.then(write)
      namedQueue = result.catch(() => undefined)
      return result
    },
    [dispatch, updateView],
  )

  /** saves a change, and a new name when given one, into the layout or the user's copy of it */
  const update = useCallback(
    async (change: LayoutChange, label?: string): Promise<string> => {
      // a layout for this change is being saved: the change goes into it
      const key = id ?? ''
      const copying = copies.get(key)
      if (copying) return writeNamed(await copying, change, label)
      if (!enabled) throw new Error('Layouts are not available')
      if (!ready) throw new Error("The layout hasn't loaded yet")
      if (named && canUpdate) return writeNamed(named, change, label)
      // none, the studio default, or a layout shared read-only: the change goes into a layout
      // the user owns, which is then picked
      if (id && !layout) throw new Error("The layout couldn't be loaded")
      const copy = (async () => {
        const copyId = generateViewId()
        // a saved view: `working: true` would make it the user's working view of this type
        await createView({
          viewType: LAYOUT_VIEW_TYPE,
          genericViewPostModel: {
            id: copyId,
            label: label || copyName,
            working: false,
            settings: change(layout),
          },
        }).unwrap()
        await pick(copyId)
        return copyId
      })()
      copies.set(key, copy)
      copy.then(
        () => copies.delete(key),
        () => copies.delete(key),
      )
      return copy
    },
    [id, enabled, ready, named, canUpdate, layout, copyName, writeNamed, createView, pick],
  )

  /** deletes a layout the user owns; when it was their pick, the defaults apply again */
  const remove = useCallback(
    async (layoutId: string) => {
      await deleteView({ viewType: LAYOUT_VIEW_TYPE, viewId: layoutId }).unwrap()
      if (layoutId === picked) await pick(null)
    },
    [deleteView, picked, pick],
  )

  return {
    enabled,
    ready,
    source,
    id,
    name,
    copyName,
    owned,
    layout,
    canUpdate,
    update,
    remove,
    pick,
    /** the layouts the user can read, as listed (the studio default may be one of them) */
    layouts,
    picked,
    projectDefault,
    studioDefaultId: studioDefault?.id,
    setProjectDefault,
    setStudioDefault,
  }
}

export type NavLayoutState = ReturnType<typeof useNavLayout>

/**
 * The layout that applies to a context (a project, or Home), as the navigation applies it: while a
 * layout is being edited, its draft. `customize` starts editing the one that applies.
 */
export const useNavLayout = (context: 'project' | 'studio', projectName?: string) => {
  const { enabled, ready, id, name, copyName, owned, canUpdate, layout, update, remove } =
    useActiveLayout(projectName)
  const edit = useLayoutEdit()
  const settings = edit ? edit.draft : layout
  const navLayout = useMemo(() => toNavLayout(settings, context), [settings, context])
  // A menu may call Customize after the layout changed (a copy got picked meanwhile): it edits
  // the layout that applies when it is called.
  const latest = useRef({ ready, id, name, copyName, owned, canUpdate, layout, update, remove })
  latest.current = { ready, id, name, copyName, owned, canUpdate, layout, update, remove }
  const start = useCallback(() => {
    const now = latest.current
    if (getLayoutEdit()) return
    // a change is still being saved (into a copy, which then applies): edit what applies after
    if (!now.ready || copies.has(now.id ?? ''))
      return void toast.info('Saving your last change to the layout. Try again in a moment.')
    startEditing({
      name: now.name,
      // Save writes into it, or makes the user's copy of it
      label: now.canUpdate ? now.name : now.copyName,
      layoutId: now.canUpdate ? now.id : undefined,
      owned: now.owned,
      layout: now.layout,
      save: now.update,
      remove: now.remove,
    })
  }, [])
  const customize = enabled && ready && !edit ? start : undefined
  return { layout: navLayout, id, ready, editing: !!edit, customize }
}
