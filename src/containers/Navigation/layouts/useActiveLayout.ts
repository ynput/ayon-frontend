import { useCallback, useMemo } from 'react'
import {
  useCreateViewMutation,
  useGetBaseViewQuery,
  useGetProjectQuery,
  useGetViewQuery,
  useListViewsQuery,
  useSetFrontendPreferencesMutation,
  useUpdateViewMutation,
  viewsQueries,
} from '@shared/api'
import { generateViewId } from '@shared/containers/Views'
import { useAppDispatch, useAppSelector } from '@state/store'
import { updateUserPreferences } from '@state/user'
import { useUserLayout } from './useUserLayout'
import { resolveLayout, toNavLayout } from './applyLayout'
import { LAYOUT_KEY, LAYOUT_VIEW_TYPE, type LayoutSettings } from './types'

/** at least this access level changes a shared layout (owner, or shared with update rights) */
const UPDATE_ACCESS = 20

type LayoutChange = (layout: LayoutSettings | undefined) => LayoutSettings

// Changes to a named layout run one at a time, each on what the one before saved: updating a view
// puts its settings into the cache, where the next change reads them.
let namedQueue: Promise<unknown> = Promise.resolve()
// The copy being made of a layout the user can't change, by that layout's id: a change made
// before the copy is picked goes into it too, instead of making another one.
const copies = new Map<string, Promise<string>>()

/** a query that has answered for its current arguments, with data or an error */
const settled = (query: { currentData?: unknown; error?: unknown }) =>
  query.currentData !== undefined || query.error !== undefined

/**
 * The layout that applies here (`resolveLayout`: picked, the project's default, the studio
 * default, the user's own, or none) and how to change it. A change goes into that layout when the
 * user may change it; otherwise the first change saves a copy the user owns ("{name} (mine)") and
 * picks it. Needs the Power Pack licence; without it there is none.
 */
export const useActiveLayout = (projectName?: string) => {
  const own = useUserLayout()
  const { enabled } = own
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
    own: own.id,
  })
  const isOwn = !!id && id === own.id
  // the studio default is the layout base view, also when it is picked or a project's default
  const isBase = !!id && id === studioDefault?.id
  // any other layout: picked, or a project's default
  const named = id && !isOwn && !isBase ? id : undefined
  const namedQuery = useGetViewQuery(
    { viewType: LAYOUT_VIEW_TYPE, viewId: named ?? '' },
    { skip: !named },
  )

  // Everything that decides the layout has answered (the list and the project with data: without
  // them a picked or project layout would be skipped). Until then the layout may still switch, so
  // it isn't changed, and a switch isn't told from the first load.
  const ready =
    enabled &&
    own.ready &&
    layouts !== undefined &&
    settled(baseQuery) &&
    (!projectName || projectQuery.currentData !== undefined) &&
    (!named || settled(namedQuery))

  const layout: LayoutSettings | undefined = !enabled
    ? undefined
    : isOwn
    ? own.layout
    : isBase
    ? (studioDefault?.settings as LayoutSettings | undefined)
    : named
    ? (namedQuery.currentData?.settings as LayoutSettings | undefined)
    : undefined
  const listed = layouts?.find((view) => view.id === named)
  const canUpdate = isOwn || (!!named && (listed?.accessLevel ?? 0) >= UPDATE_ACCESS)

  const [updateView] = useUpdateViewMutation()
  const [createView] = useCreateViewMutation()
  const [setPreferences] = useSetFrontendPreferencesMutation()

  const pick = useCallback(
    async (layoutId: string) => {
      // saved first: the navigation switches once the choice is kept
      if (userName)
        await setPreferences({ userName, patchData: { [LAYOUT_KEY]: layoutId } }).unwrap()
      dispatch(updateUserPreferences({ [LAYOUT_KEY]: layoutId }))
    },
    [dispatch, setPreferences, userName],
  )

  const writeNamed = useCallback(
    (viewId: string, change: LayoutChange) => {
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
          genericViewPatchModel: { settings: change(view.settings as LayoutSettings) },
        }).unwrap()
        return viewId
      }
      const result = namedQueue.then(write)
      namedQueue = result.catch(() => undefined)
      return result
    },
    [dispatch, updateView],
  )

  const update = useCallback(
    async (change: LayoutChange): Promise<string> => {
      // a copy of this layout is being saved: the change goes into it
      const copying = id ? copies.get(id) : undefined
      if (copying) return writeNamed(await copying, change)
      if (!enabled) throw new Error('Layouts are not available')
      if (!ready) throw new Error("The layout hasn't loaded yet")
      if (isOwn || source === 'none') return own.update(change)
      if (named && canUpdate) return writeNamed(named, change)
      // the studio default, or a layout shared read-only: the change goes into a copy the user
      // owns, which is then picked
      if (!id || !layout) throw new Error("The layout couldn't be loaded")
      const name = isBase ? 'Studio default' : listed?.label || 'Layout'
      const copy = (async () => {
        const copyId = generateViewId()
        // a saved view: without `working: false` it would replace the user's own layout
        await createView({
          viewType: LAYOUT_VIEW_TYPE,
          genericViewPostModel: {
            id: copyId,
            label: `${name} (mine)`,
            working: false,
            settings: change(layout),
          },
        }).unwrap()
        await pick(copyId)
        return copyId
      })()
      copies.set(id, copy)
      copy.then(
        () => copies.delete(id),
        () => copies.delete(id),
      )
      return copy
    },
    [
      id,
      enabled,
      ready,
      isOwn,
      source,
      named,
      canUpdate,
      layout,
      isBase,
      listed,
      own,
      writeNamed,
      createView,
      pick,
    ],
  )

  return { enabled, ready, source, id, layout, canUpdate, update, pick }
}

/** The layout that applies to a context (a project, or Home), as the navigation applies it. */
export const useNavLayout = (context: 'project' | 'studio', projectName?: string) => {
  const { layout, id, ready } = useActiveLayout(projectName)
  const navLayout = useMemo(() => toNavLayout(layout, context), [layout, context])
  return { layout: navLayout, id, ready }
}
