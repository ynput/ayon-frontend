import { useMemo } from 'react'
import { Button } from '@ynput/ayon-react-components'
import type { IconType } from '@ynput/ayon-react-components'
import clsx from 'clsx'
import { useContributions } from '@ynput/ayon-addon'
import type { ProjectTablePage } from '@ynput/ayon-addon'
import { useProjectContext } from '@shared/context'
import { AddonButton } from '@shared/components/AddonLayout/AddonButton'

interface AddonToolbarItemsProps {
  page: ProjectTablePage
  // on Lists: the open list
  list?: { id: string; label: string; entityType: string }
}

// Items addons contribute to the project tables' toolbar (projectTable.toolbarItem slot,
// @ynput/ayon-addon), drawn like the toolbar's own buttons and placed before Customize.
// AddonButton does what the item asks on click, or renders the addon's own component.
const AddonToolbarItems = ({ page, list }: AddonToolbarItemsProps) => {
  const { projectName } = useProjectContext()
  const { contributions } = useContributions('projectTable.toolbarItem')
  const items = useMemo(
    () => contributions.filter((item) => !item.pages?.length || item.pages.includes(page)),
    [contributions, page],
  )
  const { id: listId, label: listLabel, entityType: listEntityType } = list || {}
  const context = useMemo(
    () => ({
      projectName,
      page,
      list:
        listId && listLabel !== undefined && listEntityType
          ? { id: listId, label: listLabel, entityType: listEntityType }
          : undefined,
    }),
    [projectName, page, listId, listLabel, listEntityType],
  )

  return (
    <>
      {items.map((item) => (
        <AddonButton
          key={item.key}
          contribution={item}
          context={context}
          renderButton={({ ref, active, onClick, onMouseEnter }) => (
            <Button
              ref={ref}
              // addons name any Material Symbols icon
              icon={item.icon as IconType}
              label={item.label}
              selected={active}
              className={clsx('addon-toolbar-item', { active })}
              data-tooltip={item.tooltip || (item.label ? undefined : item.id)}
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

export default AddonToolbarItems
