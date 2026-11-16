import { api } from '@shared/api/base'

type Group = { value: string; filter?: string; count?: number | null }
type GroupedArgs = { groups: Group[] }
type GroupedItem = { groups?: { value?: string }[] }

const serializeGroup = ({ value, filter, count }: Group) => JSON.stringify([value, filter, count])
const serializeRest = ({ groups, ...rest }: GroupedArgs) => JSON.stringify(rest)

// items of groups another cached permutation of the same grouped query has already loaded
export const getCachedGroupItems = <T extends GroupedItem>(
  state: any,
  endpointName: string,
  args: GroupedArgs,
  getItems: (data: any) => T[] | undefined,
): Map<string, T[]> => {
  const rest = serializeRest(args)
  const wanted = new Map(args.groups.map((group) => [serializeGroup(group), group.value]))
  const found = new Map<string, { items: T[]; fulfilled: number }>()

  for (const entry of Object.values<any>(state?.[api.reducerPath]?.queries || {})) {
    if (entry?.endpointName !== endpointName || entry.status !== 'fulfilled') continue
    const entryArgs = entry.originalArgs as GroupedArgs | undefined
    if (!entryArgs?.groups || serializeRest(entryArgs) !== rest) continue

    const items = getItems(entry.data) || []
    const fulfilled = entry.fulfilledTimeStamp || 0
    for (const group of entryArgs.groups) {
      const value = wanted.get(serializeGroup(group))
      if (value === undefined || (found.get(value)?.fulfilled ?? -1) >= fulfilled) continue
      found.set(value, {
        items: items.filter((item) => item.groups?.[0]?.value === value),
        fulfilled,
      })
    }
  }

  return new Map(Array.from(found, ([value, { items }]) => [value, items]))
}
