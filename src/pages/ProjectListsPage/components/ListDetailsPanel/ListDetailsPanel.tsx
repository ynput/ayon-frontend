import { FC, MouseEvent, useMemo, useState } from 'react'
import * as Styled from './ListDetailsPanel.styled'
import { Icon } from '@ynput/ayon-react-components'
import { upperFirst } from 'lodash'
import { getListIcon } from '@shared/util'
import { ListAttributeForm, ListMetaData, PanelTabSearch, TabbedPanel } from '@shared/components'
import { useGetEntityListQuery } from '@shared/api'
import { useQueryArgumentChangeLoading } from '@shared/hooks'
import clsx from 'clsx'
import type { PanelTabSlot, TabbedPanelTab } from '@shared/components'
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

  // the Details tab's search: it stays while another list is selected
  const [detailsSearch, setDetailsSearch] = useState('')

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
  const addonTabSlot = useMemo<PanelTabSlot<'listDetails.tab'>>(
    () => ({ name: 'listDetails.tab', context: addonTabContext }),
    [addonTabContext],
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

  // the panel's own tabs, then the addons' (listDetails.tab slot, @ynput/ayon-addon), whose tab id is
  // the contribution key, `<addon>.<id>`
  const tabs: TabbedPanelTab[] = [
    {
      id: 'details',
      label: 'Details',
      icon: 'lists',
      header: {
        searchActive: !!detailsSearch,
        search: (
          <PanelTabSearch
            value={detailsSearch}
            onChange={setDetailsSearch}
            placeholder="Search attributes and details..."
          />
        ),
      },
      render: () => (
        <Styled.Scrollable>
          <Styled.Section>
            <ListAttributeForm
              list={list}
              isLoading={isLoadingList}
              projectName={projectName}
              search={detailsSearch}
            />
          </Styled.Section>
          <Styled.Section onMouseOver={showFullValueIfCut}>
            <ListMetaData list={list} isLoading={isLoadingList} search={detailsSearch} />
          </Styled.Section>
        </Styled.Scrollable>
      ),
    },
    {
      id: 'access',
      label: 'Share',
      icon: 'share',
      render: () => (
        <Styled.Scrollable>
          {list && (
            <ListAccessForm
              list={list}
              projectName={projectName}
              isLoading={isLoadingList}
              isReview={isReview}
            />
          )}
        </Styled.Scrollable>
      ),
    },
  ]

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
      <TabbedPanel
        title={
          <Styled.Titles>
            <h2 className={clsx('title', { loading: isLoadingList })}>
              {isLoadingList ? 'Loading...' : list?.label}
            </h2>
            <span className={clsx('type', { loading: isLoadingList })}>
              {list && <Icon icon={getListIcon(list)} />}
              {upperFirst(list?.entityType)}s {isReview && '(Review)'}
            </span>
          </Styled.Titles>
        }
        onClose={() => setListDetailsOpen(false)}
        tabs={tabs}
        // the addon tabs get the selected list only: while another list loads, they must not act
        // on the last one
        slot={addonTabSlot}
        selected={selectedTab}
        onChange={setSelectedTab}
        // a tab in the URL whose addon is gone
        fallbackTab="details"
        tabTestId={(id) => `list-details-tab-${id}`}
        // few tabs: each is named, the addons' too (icons only past 3)
        showLabels
      />
    </Styled.Panel>
  )
}

export default ListDetailsPanel
