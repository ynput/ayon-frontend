import { useMemo, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getRequestErrorString } from '@shared/util'
import { BASE_VIEW_ID } from '@shared/containers/Views'
import { useAppDispatch, useAppSelector } from '@state/store'
import { useNavAccess } from '../filterNavigation'
import { useActiveLayout, useNavLayout } from './useActiveLayout'
import type { LayoutMenuItem, LayoutMenuProps } from './types'

/** the open project, from the route: the header sits outside the project's routes */
const projectFromPath = (pathname: string) => {
  const match = pathname.match(/^\/projects\/([^/]+)/)
  return match ? decodeURIComponent(match[1]) : undefined
}

// the menu's actions say how they went: an addon's own toasts wouldn't show
const reported =
  <A extends unknown[]>(action: (...args: A) => Promise<unknown>, failed: string, done?: string) =>
  async (...args: A) => {
    try {
      await action(...args)
      if (done) toast.success(done)
    } catch (error) {
      toast.error(`${failed}: ${getRequestErrorString(error)}`)
    }
  }

/**
 * What the layout menu shows and does here (`LayoutMenuProps`); null without layouts (no Power
 * Pack licence) or until they have first loaded. A switch reloads the layout: the menu stays.
 */
export const useLayoutMenu = (): LayoutMenuProps | null => {
  const { pathname } = useLocation()
  const projectName = projectFromPath(pathname)
  const active = useActiveLayout(projectName)
  const { customize } = useNavLayout(projectName ? 'project' : 'studio', projectName)
  const access = useNavAccess()
  const userName = useAppSelector((state) => state.user?.name)
  const dispatch = useAppDispatch()

  const layouts = useMemo<LayoutMenuItem[]>(
    () =>
      (active.layouts ?? []).flatMap((view) =>
        // the studio default comes as `studioDefaultId`
        view.id && view.label !== BASE_VIEW_ID && view.id !== active.studioDefaultId
          ? [
              {
                id: view.id,
                label: view.label,
                owner: view.owner ?? undefined,
                working: view.working,
                accessLevel: view.accessLevel,
              },
            ]
          : [],
      ),
    [active.layouts, active.studioDefaultId],
  )

  const loaded = useRef(false)
  if (active.ready) loaded.current = true
  if (!active.enabled || !loaded.current || !userName) return null
  return {
    userName,
    ready: active.ready,
    layouts,
    activeId: active.id,
    activeName: active.name,
    activeSettings: active.layout,
    pickedId: active.picked || undefined,
    studioDefaultId: active.studioDefaultId,
    projectName,
    projectDefaultId: active.projectDefault || undefined,
    pick: reported(active.pick, "Couldn't switch the layout"),
    customize,
    setProjectDefault:
      projectName && access.manager
        ? (layoutId) =>
            reported(
              active.setProjectDefault,
              "Couldn't change the project's default layout",
              layoutId
                ? `Set as the default layout for ${projectName}`
                : `${projectName} has no default layout now`,
            )(layoutId)
        : undefined,
    setStudioDefault: access.admin
      ? (layoutId) =>
          reported(
            active.setStudioDefault,
            "Couldn't change the studio default",
            layoutId ? 'Set as the studio default layout' : 'The studio has no default layout now',
          )(layoutId)
      : undefined,
    dispatch,
  }
}
