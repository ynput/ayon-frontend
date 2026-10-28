import { useContributions } from '@ynput/ayon-addon'
import type { IconType } from '@ynput/ayon-react-components'
import { useAppSelector } from '@state/store'
import clsx from 'clsx'
import { useMemo } from 'react'
import HeaderButton from './HeaderButton'
import { AddonPopupItem } from '@/remote/AddonPopupItem'

// Buttons addons contribute to the header (header.item slot, @ynput/ayon-addon). Left items
// show their label like Home; right items are icons like chat and help.
const AddonHeaderItems = ({ placement }: { placement: 'left' | 'right' }) => {
  const { contributions } = useContributions('header.item')
  const projectName = (useAppSelector((state) => state.project.openProject) as string | null) || null
  const context = useMemo(() => ({ projectName }), [projectName])

  const items = useMemo(
    () =>
      contributions
        .filter((item) => (item.placement === 'left' ? 'left' : 'right') === placement)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [contributions, placement],
  )

  return (
    <>
      {items.map((item) => (
        <AddonPopupItem
          key={item.key}
          contribution={item}
          context={context}
          renderButton={({ ref, active, onClick, onMouseEnter }) => (
            <HeaderButton
              ref={ref}
              // addons name any Material Symbols icon
              icon={item.icon as IconType}
              label={placement === 'left' ? item.label : undefined}
              variant="nav"
              className={clsx('addon-header-item', { active })}
              data-tooltip={item.tooltip || (placement === 'left' ? undefined : item.label)}
              data-addon-item={item.key}
              onClick={onClick}
              onMouseEnter={onMouseEnter}
            />
          )}
        />
      ))}
    </>
  )
}

export default AddonHeaderItems
