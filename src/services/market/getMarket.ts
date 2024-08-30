import api from '@/api'
import PubSub from '@/pubsub'
import { DefinitionsFromApi, OverrideResultType, TagTypesFromApi } from '@reduxjs/toolkit/query'
import { AddonListItem2, MarketAddonListApiResponse } from '@/api/rest'
import { $Any } from '@/types'
import { GetMarketInstallEventsQuery } from '@/api/graphql'

type MarketAddonItemRes = AddonListItem2
export interface MarketAddonItem extends MarketAddonItemRes {
  isDownloaded: boolean
  isOfficial: boolean
  isProductionOutdated: boolean
  isVerified: boolean
}

export type MarketAddonList = MarketAddonItem[]

type MarketAddonInstallEvent = GetMarketInstallEventsQuery['events']['edges'][0]['node']

export type MarketAddonInstallEventList = MarketAddonInstallEvent[]

type Definitions = DefinitionsFromApi<typeof api>
type TagTypes = TagTypesFromApi<typeof api>

type UpdatedDefinitions = Omit<Definitions, 'marketAddonList'> & {
  marketAddonList: OverrideResultType<Definitions['marketAddonList'], MarketAddonList>
  GetMarketInstallEvents: OverrideResultType<
    Definitions['GetMarketInstallEvents'],
    MarketAddonInstallEventList
  >
}

export const enhancedMarketRest = api.enhanceEndpoints<TagTypes, UpdatedDefinitions>({
  endpoints: {
    marketAddonList: {
      providesTags: (addons: $Any) => [
        ...(addons?.map(({ id }: $Any) => ({ type: 'marketAddon', id })) || []),
        {
          type: 'marketAddon',
          id: 'LIST',
        },
      ],
      transformResponse: (response: MarketAddonListApiResponse) =>
        [...(response?.addons || [])]
          .map((addon: $Any) => {
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
    GetMarketInstallEvents: {
      transformResponse: (response: GetMarketInstallEventsQuery) =>
        response.events.edges.map(({ node }) => node).filter((e) => e.status !== 'finished'),
      async onCacheEntryAdded(_args, { updateCachedData, cacheEntryRemoved }) {
        let subscriptions = []
        try {
          const handlePubSub = (topic: string, message: $Any) => {
            if (topic === 'client.connected') {
              return
            }

            // update cache
            updateCachedData((draft) => {
              if (!draft) return (draft = [message])
              // find index of event
              const index = draft?.findIndex((e) => e.id === message.id)
              // replace event
              if (index !== -1) {
                draft[index] = message
              } else {
                // add event
                draft.push(message)
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

export const {
  useMarketAddonListQuery,
  useMarketAddonDetailQuery,
  useLazyMarketAddonDetailQuery,
  useLazyMarketAddonVersionDetailQuery,
  useGetMarketInstallEventsQuery,
} = enhancedMarketRest
