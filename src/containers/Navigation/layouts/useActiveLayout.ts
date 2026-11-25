import { useCallback, useMemo } from 'react'
import {
  useGetBaseViewQuery,
  useGetProjectQuery,
  useGetViewQuery,
  useListViewsQuery,
  useSetFrontendPreferencesMutation,
  useUpdateViewMutation,
} from '@shared/api'
import { useAppDispatch, useAppSelector } from '@state/store'
import { updateUserPreferences } from '@state/user'
import { useUserLayout } from './useUserLayout'
import { resolveLayout, toNavLayout } from './applyLayout'
import { LAYOUT_KEY, LAYOUT_VIEW_TYPE, type LayoutSettings } from './types'

/** at least this access level changes a shared layout (owner, or shared with update rights) */
const UPDATE_ACCESS = 20

/**
 * The layout that applies here (`resolveLayout`: picked, the project's default, the studio
 * default, the user's own, or none) and how to change it. A change goes into that layout when the
 * user may change it; otherwise the first change makes it the user's own layout ("My layout", a
 * copy with the change) and picks that. Needs the Power Pack licence; without it there is none.
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

  const { currentData: project } = useGetProjectQuery(
    { projectName: projectName ?? '' },
    { skip: !enabled || !projectName },
  )
  const projectDefault = (project?.data as Record<string, unknown> | undefined)?.[LAYOUT_KEY] as
    | string
    | undefined
  const { currentData: layouts } = useListViewsQuery(
    { viewType: LAYOUT_VIEW_TYPE },
    { skip: !enabled },
  )
  const { currentData: studioDefault } = useGetBaseViewQuery(
    { viewType: LAYOUT_VIEW_TYPE },
    { skip: !enabled },
  )

  const readable = useMemo(
    () => (layouts ?? []).flatMap((view) => (view.id ? [view.id] : [])),
    [layouts],
  )
  const { source, id } = resolveLayout({
    picked,
    projectDefault,
    readable,
    studioDefault: studioDefault?.id,
    own: own.id,
  })
  const isOwn = !!id && id === own.id
  // a named layout: picked, or the project's default
  const named = (source === 'picked' || source === 'project') && !isOwn ? id : undefined
  const { currentData: namedView } = useGetViewQuery(
    { viewType: LAYOUT_VIEW_TYPE, viewId: named ?? '' },
    { skip: !named },
  )

  const layout: LayoutSettings | undefined = isOwn
    ? own.layout
    : source === 'studio'
    ? (studioDefault?.settings as LayoutSettings | undefined)
    : named
    ? (namedView?.settings as LayoutSettings | undefined)
    : undefined
  const canUpdate =
    isOwn ||
    (!!named && (layouts?.find((view) => view.id === named)?.accessLevel ?? 0) >= UPDATE_ACCESS)

  const [updateView] = useUpdateViewMutation()
  const [setPreferences] = useSetFrontendPreferencesMutation()

  const pick = useCallback(
    async (layoutId: string) => {
      dispatch(updateUserPreferences({ [LAYOUT_KEY]: layoutId }))
      if (userName)
        await setPreferences({ userName, patchData: { [LAYOUT_KEY]: layoutId } }).unwrap()
    },
    [dispatch, setPreferences, userName],
  )

  const update = useCallback(
    async (change: (layout: LayoutSettings | undefined) => LayoutSettings) => {
      if (isOwn || source === 'none') return own.update(change)
      if (canUpdate && named) {
        await updateView({
          viewType: LAYOUT_VIEW_TYPE,
          viewId: named,
          genericViewPatchModel: { settings: change(layout) },
        }).unwrap()
        return named
      }
      // the studio default, or a layout shared read-only: the change makes it the user's own
      const ownId = await own.update(() => change(layout))
      await pick(ownId)
      return ownId
    },
    [isOwn, source, canUpdate, named, layout, own, updateView, pick],
  )

  return { enabled, source, id, layout, canUpdate, update, pick }
}

/** The layout that applies to a context (a project, or Home), as the navigation applies it. */
export const useNavLayout = (context: 'project' | 'studio', projectName?: string) => {
  const { layout, id } = useActiveLayout(projectName)
  const navLayout = useMemo(() => toNavLayout(layout, context), [layout, context])
  return { layout: navLayout, id }
}
