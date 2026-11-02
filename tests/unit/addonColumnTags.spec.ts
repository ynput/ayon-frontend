import { expect, test } from '@playwright/test'
// first: the api's client reads the page's address when it loads
import './support/browserGlobals'
import { api } from '../../shared/src/api/base/client'
import { createStandaloneStore } from '../../shared/src/api/base/store'
import { addonColumnTagsApi } from '../../shared/src/containers/ProjectTreeTable/addonColumns/addonColumnTags'
import type { TableColumnTag } from '../../addon/src/slots'

// An addon column's providesTags: the query ColumnValuesFetcher subscribes to runs again (a new
// number, which refreshes the column) when one of its tags is invalidated, by the addon or AYON.

const { addonColumnTags } = addonColumnTagsApi.endpoints

// an addon's own api, injected as addons do: a tag type of its own and a mutation invalidating it
const addonApi = api.enhanceEndpoints({ addTagTypes: ['myaddonLog'] }).injectEndpoints({
  endpoints: (build) => ({
    myaddonEditLog: build.mutation<null, { id: string }>({
      queryFn: () => ({ data: null }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'myaddonLog', id },
        { type: 'myaddonLog', id: 'LIST' },
      ],
    }),
  }),
})

// subscribes a column with these tags, as the column's hook does; `runs()` reads its number
const watch = async (store: ReturnType<typeof createStandaloneStore>, tags: TableColumnTag[]) => {
  const arg = { columnId: `addon__myaddon__${JSON.stringify(tags)}`, tags }
  const subscription = store.dispatch(addonColumnTags.initiate(arg))
  await subscription
  const runs = () => addonColumnTags.select(arg)(store.getState()).data
  const first = runs()
  return { refetched: () => runs() !== first, unsubscribe: subscription.unsubscribe }
}

// invalidation waits for running queries, then refetches
const settle = () => new Promise((resolve) => setTimeout(resolve, 20))

test("a column refreshes when one of its tag types is invalidated, not someone else's", async () => {
  const store = createStandaloneStore()
  const logs = await watch(store, ['myaddonLog'])
  const tasks = await watch(store, ['task'])

  store.dispatch(api.util.invalidateTags(['myaddonLog' as never]))
  await settle()
  expect(logs.refetched()).toBe(true)
  expect(tasks.refetched()).toBe(false)
})

test('a { type, id } tag refreshes columns listing that tag, as in RTK Query', async () => {
  const store = createStandaloneStore()
  const anyLog = await watch(store, ['myaddonLog'])
  const logList = await watch(store, [{ type: 'myaddonLog', id: 'LIST' }])

  // the addon's own mutation, which knows nothing about the column
  await store.dispatch(addonApi.endpoints.myaddonEditLog.initiate({ id: 'log1' }))
  await settle()
  expect(logList.refetched()).toBe(true)
  // a plain type follows invalidations of the whole type only
  expect(anyLog.refetched()).toBe(false)
})

test('host tags refresh a column too', async () => {
  const store = createStandaloneStore()
  const tasks = await watch(store, [{ type: 'task', id: 'task1' }])

  store.dispatch(api.util.invalidateTags(['task' as never]))
  await settle()
  expect(tasks.refetched()).toBe(true)
})
