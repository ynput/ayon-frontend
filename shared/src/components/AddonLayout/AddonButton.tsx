// The host's button for header.item and projectTable.toolbarItem contributions (@ynput/ayon-addon).
// The addon picks what a click does; the host draws the button (renderButton), the dialog and the
// menu, so they look like AYON's own. Used by the app's header and toolbars and by the dev shell.
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ContributionView, prefetchPiece, runContribution } from '@ynput/ayon-addon'
import type { AddonMenuItem, AnyContribution, Contribution, SlotMap } from '@ynput/ayon-addon'
import { loadPiece, reportContributionError } from '@ynput/ayon-addon/host'
import { Menu } from '@shared/components/Menu/Menu'
import type { MenuItemType } from '@shared/components/Menu/Menu'
import { MenuContainer } from '@shared/components/Menu/MenuContainer'
import { useMenuContext } from '@shared/context'
import { AddonDialog } from './AddonDialog'
import { getButtonAction, toMenuItems } from './AddonButtonHelpers'
import type { ButtonSlot } from './AddonButtonHelpers'

export interface AddonButtonRenderProps {
  ref: (element: HTMLElement | null) => void
  /** its dialog or menu is open */
  active: boolean
  onClick: () => void
  onMouseEnter: () => void
}

export interface AddonButtonProps<S extends ButtonSlot> {
  contribution: Contribution<S>
  /** the slot's context, without `navigate` (the button adds it) */
  context: Omit<SlotMap[S]['context'], 'navigate'>
  /** the host's button; not called for a `component` item, which draws itself */
  renderButton: (props: AddonButtonRenderProps) => ReactNode
  /** dev shell: open the dialog right away */
  autoOpen?: boolean
  /** dev shell: the context the item's code gets */
  onContext?: (context: object) => void
}

export const AddonButton = <S extends ButtonSlot>({
  contribution,
  context,
  renderButton,
  autoOpen,
  onContext,
}: AddonButtonProps<S>) => {
  const any = contribution as unknown as AnyContribution
  const action = getButtonAction(any)
  const navigate = useNavigate()
  const actionContext = useMemo(
    () => ({ ...context, navigate: (to: string) => navigate(to) } as SlotMap[S]['context']),
    [context, navigate],
  )

  // dialog: the host's Dialog around the addon's content
  const [dialogOpen, setDialogOpen] = useState(!!autoOpen && action === 'dialog')
  const close = useCallback(() => setDialogOpen(false), [])
  const dialogContext = useMemo(() => ({ ...actionContext, close }), [actionContext, close])

  // menu: the shared Menu under the button, like the header's help menu
  const { menuOpen, setMenuOpen, toggleMenuOpen } = useMenuContext()
  // keys are unique per slot only: a header item and a toolbar item may share one
  const menuId = `addon:${any.slot}:${any.key}`
  const [menuItems, setMenuItems] = useState<MenuItemType[]>([])
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  useEffect(
    () => onContext?.(action === 'dialog' ? dialogContext : actionContext),
    [onContext, action, dialogContext, actionContext],
  )

  if (action === 'component') {
    return <ContributionView contribution={contribution} context={actionContext} />
  }

  const onClick = () => {
    if (action === 'to') navigate(any.to as string)
    else if (action === 'run') runContribution(contribution, actionContext)
    else if (action === 'dialog') setDialogOpen((open) => !open)
    else if (action === 'menu') {
      if (menuOpen === menuId) return setMenuOpen(false)
      // the items are built each time the menu opens, from the current context
      loadPiece(any.menu as never)
        .then((build) => {
          if (typeof build !== 'function') throw new Error('"menu" has no default export function')
          return (build as (ctx: object) => AddonMenuItem[] | Promise<AddonMenuItem[]>)(
            actionContext,
          )
        })
        .then((items) => {
          setMenuItems(toMenuItems(items, any))
          toggleMenuOpen(menuId)
        })
        .catch((error) => reportContributionError(any, error))
    }
  }

  return (
    <>
      {renderButton({
        ref: setAnchor,
        active: dialogOpen || menuOpen === menuId,
        onClick,
        onMouseEnter: () => action && prefetchPiece(any[action] as never),
      })}
      {action === 'dialog' && dialogOpen && (
        <AddonDialog contribution={contribution} context={dialogContext} />
      )}
      {action === 'menu' && (
        <MenuContainer id={menuId} target={anchor}>
          <Menu menu={menuItems} />
        </MenuContainer>
      )}
    </>
  )
}
