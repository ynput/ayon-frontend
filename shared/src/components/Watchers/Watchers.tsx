import { useGetEntitiesWatchersQuery, useSetEntitiesWatchersMutation } from '@shared/api'
import { DropdownRef, WatcherSelect, WatcherSelectProps } from '@ynput/ayon-react-components'
import { forwardRef } from 'react'
import { toast } from 'react-toastify'

interface WatchersProps extends Omit<WatcherSelectProps, 'currentUser' | 'value'> {
  entities: { id: string; projectName: string }[]
  entityType: string
  onWatchersUpdate?: (added: any[], removed: any[]) => void
  userName: string
}

export const Watchers = forwardRef<DropdownRef, WatchersProps>(
  ({ entities, entityType, onWatchersUpdate, userName, ...props }, ref) => {
    const entitiesQuery = entities.map((entity) => ({
      entityId: entity.id,
      entityType,
      projectName: entity.projectName,
    }))

    const { data: watchers = [] } = useGetEntitiesWatchersQuery(
      {
        entities: entitiesQuery,
      },
      { skip: !entities.length },
    )

    // merge all watchers into a single unique array
    const uniqueWatchers = Array.from(new Set(watchers.flatMap((watcher) => watcher.watchers)))

    const [setEntitiesWatchers] = useSetEntitiesWatchersMutation()

    const handleChange = async (value: string[]) => {
      //   find the difference between the current watchers and the new watchers
      // which users were added and which were removed
      const added = value.filter((watcher) => !uniqueWatchers.includes(watcher))
      const removed = uniqueWatchers.filter((watcher) => !value.includes(watcher))

      // for each entity, add or remove the watchers
      // we do this to preserve the unique watchers for each entity (rather than setting the same watchers for all entities)
      const updatedEntities = watchers.map((entity) => {
        // first remove
        const newWatchers = entity.watchers.filter((watcher) => !removed.includes(watcher))
        // then add
        newWatchers.push(...added)

        return {
          ...entity,
          watchers: newWatchers,
        }
      })

      //   update
      try {
        await setEntitiesWatchers({ entities: updatedEntities }).unwrap()
        onWatchersUpdate && onWatchersUpdate(added, removed)
      } catch (error) {
        toast.error('Failed to update watchers')
      }
    }

    return (
      <WatcherSelect
        align="right"
        {...props}
        value={uniqueWatchers}
        currentUser={userName}
        onChange={handleChange}
        ref={ref}
        // @ts-expect-error
        buttonProps={{ 'data-tooltip': 'Watchers' }}
      />
    )
  },
)
