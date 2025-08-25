import { PubSub } from '@shared/util'
import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'

// VVV REST endpoints VVV
import { marketApi, MarketAddonListApiResponse } from '@shared/api'
import { PubSubMessage } from '@/types'

type MarketAddonItemRes = NonNullable<MarketAddonListApiResponse['addons']>[0]
export interface MarketAddonItem extends MarketAddonItemRes {
  isDownloaded: boolean
  isOfficial: boolean
  isProductionOutdated: boolean
  isVerified: boolean
}

export type MarketAddonList = MarketAddonItem[]

export type LicenseItem = {
  label: string
  subject: string
  value: boolean
  type: string
  subscription: string
  exp: number
  valid: boolean
  note: string
}

type DefinitionsRest = DefinitionsFromApi<typeof marketApi>
type TagTypesRest = TagTypesFromApi<typeof marketApi>

type UpdatedDefinitionsRest = Omit<DefinitionsRest, 'marketAddonList'> & {
  marketAddonList: OverrideResultType<DefinitionsRest['marketAddonList'], MarketAddonList>
  getLicenses: OverrideResultType<
    DefinitionsRest['getLicenses'],
    { syncedAt: number; licenses: LicenseItem[] }
  >
}

export const enhancedMarketRest = marketApi.enhanceEndpoints<TagTypesRest, UpdatedDefinitionsRest>({
  endpoints: {
    marketAddonList: {
      providesTags: (addons: MarketAddonListApiResponse['addons']) => [
        ...(addons?.map(({ id }) => ({ type: 'marketAddon', id })) || []),
        {
          type: 'marketAddon',
          id: 'LIST',
        },
      ],
      transformResponse: (response: MarketAddonListApiResponse) =>
        [...(response?.addons || [])]
          .map((addon) => {
            const isDownloaded = !!addon.currentLatestVersion
            const isOfficial = addon.orgName === 'ynput-official'
            const isProductionOutdated =
              addon.currentLatestVersion !== addon.currentProductionVersion

            return {
              ...addon,
              isOfficial,
              isDownloaded,
              isProductionOutdated,
              isVerified: false,
            }
          })
          .sort((a, b) => a.title.localeCompare(b.title)),
    },
    marketAddonDetail: {
      providesTags: (_r, _e, { addonName }) => [
        { type: 'marketAddon', id: addonName },
        { type: 'marketAddon', id: 'LIST' },
      ],
    },
    marketAddonVersionDetail: {
      providesTags: (_r, _e, { addonName }) => [
        { type: 'marketAddon', id: addonName },
        { type: 'marketAddon', id: 'LIST' },
      ],
    },
    getLicenses: {},
  },
})

export const {
  useMarketAddonListQuery,
  useMarketAddonDetailQuery,
  useLazyMarketAddonDetailQuery,
  useLazyMarketAddonVersionDetailQuery,
  useGetLicensesQuery,
} = enhancedMarketRest

// VVV GraphQL endpoints VVV
import { gqlApi, GetMarketInstallEventsQuery } from '@shared/api'

type MarketAddonInstallEvent = GetMarketInstallEventsQuery['events']['edges'][0]['node']

export type MarketAddonInstallEventList = MarketAddonInstallEvent[]

type DefinitionsGQL = DefinitionsFromApi<typeof gqlApi>
type TagTypesGQL = TagTypesFromApi<typeof gqlApi>

type UpdatedDefinitionsGQL = Omit<DefinitionsGQL, 'marketAddonList'> & {
  GetMarketInstallEvents: OverrideResultType<
    DefinitionsGQL['GetMarketInstallEvents'],
    MarketAddonInstallEventList
  >
}

export const enhancedMarketGQL = gqlApi.enhanceEndpoints<TagTypesGQL, UpdatedDefinitionsGQL>({
  endpoints: {
    GetMarketInstallEvents: {
      transformResponse: (response: GetMarketInstallEventsQuery) =>
        response.events.edges.map(({ node }) => node).filter((e) => e.status !== 'finished'),
      async onCacheEntryAdded(_args, { updateCachedData, cacheEntryRemoved }) {
        let subscriptions = []
        try {
          const handlePubSub = (topic: string, message: PubSubMessage) => {
            if (topic === 'client.connected') {
              return
            }

            // update cache
            updateCachedData((draft) => {
              if (!draft) return (draft = [message.data as MarketAddonInstallEvent])
              // find index of event
              const index = draft?.findIndex((e) => e.id === (message.data as MarketAddonInstallEvent).id)
              // replace event
              if (index !== -1) {
                draft[index] = message.data as MarketAddonInstallEvent
              } else {
                // add event
                draft.push(message.data as MarketAddonInstallEvent)
              }
            })
          }

          const sub = PubSub.subscribe('addon.install_from_url', handlePubSub)
          subscriptions.push(sub)
        } catch (error) {
          // no-op in case `cacheEntryRemoved` resolves before `cacheDataLoaded`,
          // in which case `cacheDataLoaded` will throw
          console.error(error)
        }
        await cacheEntryRemoved
        // unsubscribe from all topics
        subscriptions.forEach((sub) => PubSub.unsubscribe(sub))
      },
    },
  },
})

export const { useGetMarketInstallEventsQuery } = enhancedMarketGQL
