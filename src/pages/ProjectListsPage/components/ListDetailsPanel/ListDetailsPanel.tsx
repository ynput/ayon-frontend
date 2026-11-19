import { FC, MouseEvent, useEffect, useMemo } from 'react'
import * as Styled from './ListDetailsPanel.styled'
import { Icon } from '@ynput/ayon-react-components'
import { upperFirst } from 'lodash'
import { getListIcon } from '@shared/util'
import {
  ListAttributeForm,
  ListMetaData,
  PanelSlotTab,
  PanelTabHeader,
  PanelTabs,
  usePanelSlotTabs,
} from '@shared/components'
import { useGetEntityListQuery } from '@shared/api'
import { useQueryArgumentChangeLoading } from '@shared/hooks'
import clsx from 'clsx'
import type { PanelTab, PanelTabSlot } from '@shared/components'
import type { ListDetailsTabContext } from '@ynput/ayon-addon'
import { useListsContext } from '@pages/ProjectListsPage/context'
import { ListAccessForm } from '../ListAccessForm'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'

// a read-only detail cut short (the list id) shows its full value on hover
const showFullValueIfCut = (event: MouseEvent<HTMLElement>) => {
  const value = (event.target as HTMLElement).closest<HTMLElement>(
    '.with-padding > div:not(.field-row) > :nth-child(2)',
  )
  if (!value) return
  if (value.scrollWidth > value.clientWidth) value.dataset.tooltip = value.textContent || ''
  else delete value.dataset.tooltip
}

// the panel's own tabs, then the addons' (listDetails.tab slot, @ynput/ayon-addon), whose tab id is
// the contribution key, `<addon>.<id>`
const LIST_DETAILS_TABS: PanelTab[] = [
  { id: 'details', label: 'Details', icon: 'lists' },
  { id: 'access', label: 'Share', icon: 'share' },
]
const LIST_DETAILS_SLOT: PanelTabSlot<'listDetails.tab'> = { name: 'listDetails.tab' }

interface ListDetailsPanelProps {
  listId: string
  projectName: string
}

const ListDetailsPanel: FC<ListDetailsPanelProps> = ({ listId, projectName }) => {
  const {
    data: list,
    currentData: currentList,
    isFetching,
    isLoading,
    error,
  } = useGetEntityListQuery(
    { entityListId: listId, projectName, metadataOnly: true },
    { skip: !listId },
  )

  const { setListDetailsOpen, isReview } = useListsContext()

  // Use custom hook to track loading state only when arguments change
  const isLoadingOnArgChange = useQueryArgumentChangeLoading({ listId, projectName }, isFetching)

  // Combine initial loading with argument change loading
  const isLoadingList = isLoading || isLoadingOnArgChange

  const [selectedTab, setSelectedTab] = useQueryParam(
    'listTab',
    withDefault(StringParam, 'details'),
  )

  const { tabs: addonTabs, isLoading: isLoadingAddonTabs } = usePanelSlotTabs(LIST_DETAILS_SLOT)
  const ownTab = LIST_DETAILS_TABS.find((tab) => tab.id === selectedTab)
  // a tab in the URL whose addon is gone (known once the manifests have loaded)
  const isUnknownTab =
    !ownTab && !addonTabs.some((tab) => tab.key === selectedTab) && !isLoadingAddonTabs
  useEffect(() => {
    if (isUnknownTab) setSelectedTab('details')
  }, [isUnknownTab, setSelectedTab])

  // the selected list only (currentData): while another list loads, a tab must not act on the last one
  const addonTabContext = useMemo<ListDetailsTabContext | undefined>(
    () =>
      currentList?.id
        ? {
            projectName,
            list: {
              id: currentList.id,
              projectName,
              label: currentList.label,
              entityType: currentList.entityType,
              entityListType: currentList.entityListType,
            },
            scope: isReview ? 'reviews' : 'lists',
          }
        : undefined,
    [
      projectName,
      currentList?.id,
      currentList?.label,
      currentList?.entityType,
      currentList?.entityListType,
      isReview,
    ],
  )

  // derive error message
  let errorMessage: string | null = null
  if (error && 'status' in error) {
    const status = error.status
    if (status === 403) {
      errorMessage = 'You do not have access to this folder.'
    } else if (typeof status === 'number') {
      errorMessage = `Failed to load list (Error ${status}).`
    } else {
      errorMessage = 'Failed to load list.'
    }
  }

  if (errorMessage)
    return (
      <Styled.Panel>
        <Styled.CloseButton icon="close" variant="text" onClick={() => setListDetailsOpen(false)} />
        <Styled.Section>
          <p>{errorMessage}</p>
        </Styled.Section>
      </Styled.Panel>
    )

  return (
    <Styled.Panel data-testid="list-details-panel">
      <Styled.Header>
        <Styled.Titles>
          <h2 className={clsx('title', { loading: isLoadingList })}>
            {isLoadingList ? 'Loading...' : list?.label}
          </h2>
          <span className={clsx('type', { loading: isLoadingList })}>
            {list && <Icon icon={getListIcon(list)} />}
            {upperFirst(list?.entityType)}s {isReview && '(Review)'}
          </span>
        </Styled.Titles>
        <PanelTabs
          tabs={LIST_DETAILS_TABS}
          slot={LIST_DETAILS_SLOT}
          selected={selectedTab}
          onChange={setSelectedTab}
        />
        <Styled.CloseButton icon="close" variant="text" onClick={() => setListDetailsOpen(false)} />
      </Styled.Header>
      {/* an addon's tab, with its own header; it gets the selected list only */}
      <PanelSlotTab slot={LIST_DETAILS_SLOT} selected={selectedTab} context={addonTabContext} />
      {ownTab && (
        <>
          {/* the tab buttons are icons: the open tab is named here */}
          <PanelTabHeader title={ownTab.label} />
          <Styled.Scrollable>
            {ownTab.id === 'details' && (
              <>
                <Styled.Section>
                  <ListAttributeForm
                    list={list}
                    isLoading={isLoadingList}
                    projectName={projectName}
                  />
                </Styled.Section>
                <Styled.Section onMouseOver={showFullValueIfCut}>
                  <ListMetaData list={list} isLoading={isLoadingList} />
                </Styled.Section>
              </>
            )}
            {ownTab.id === 'access' && list && (
              <ListAccessForm
                list={list}
                projectName={projectName}
                isLoading={isLoadingList}
                isReview={isReview}
              />
            )}
          </Styled.Scrollable>
        </>
      )}
    </Styled.Panel>
  )
}

export default ListDetailsPanel
