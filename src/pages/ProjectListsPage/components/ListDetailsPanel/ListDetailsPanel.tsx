import { FC } from 'react'
import * as Styled from './ListDetailsPanel.styled'
import { Icon } from '@ynput/ayon-react-components'
import { upperFirst } from 'lodash'
import { getListIcon } from '@pages/ProjectListsPage/util'
import { ListAttributeForm, ListMetaData } from '@shared/components'
import { useGetEntityListQuery } from '@shared/api'
import { useQueryArgumentChangeLoading } from '@shared/hooks'
import clsx from 'clsx'
import ListDetailsTabs, { ListDetailsTab } from '../ListDetailsTabs/ListDetailsTabs'
import { useListsContext } from '@pages/ProjectListsPage/context'
import { ListAccessForm } from '../ListAccessForm'
import { StringParam, useQueryParam, withDefault } from 'use-query-params'

interface ListDetailsPanelProps {
  listId: string
  projectName: string
}

const ListDetailsPanel: FC<ListDetailsPanelProps> = ({ listId, projectName }) => {
  const {
    data: list,
    isFetching,
    isLoading,
    error,
  } = useGetEntityListQuery({ listId, projectName }, { skip: !listId })

  const { setListDetailsOpen } = useListsContext()

  // Use custom hook to track loading state only when arguments change
  const isLoadingOnArgChange = useQueryArgumentChangeLoading({ listId, projectName }, isFetching)

  // Combine initial loading with argument change loading
  const isLoadingList = isLoading || isLoadingOnArgChange

  const isReview = list?.entityListType === 'review-session'

  const [selectedTab, setSelectedTab] = useQueryParam<ListDetailsTab>(
    'listTab',
    withDefault(StringParam, 'details') as unknown as any,
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
    <Styled.Panel>
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
        <ListDetailsTabs selected={selectedTab} onChange={setSelectedTab} />
        <Styled.CloseButton icon="close" variant="text" onClick={() => setListDetailsOpen(false)} />
      </Styled.Header>
      <Styled.Scrollable>
        {selectedTab === 'details' && (
          <>
            <Styled.Section>
              <ListAttributeForm list={list} isLoading={isLoadingList} projectName={projectName} />
            </Styled.Section>
            <Styled.Section>
              <ListMetaData list={list} isLoading={isLoadingList} />
            </Styled.Section>
          </>
        )}
        {selectedTab === 'access' && list && (
          <Styled.Section style={{ height: '100%' }}>
            <ListAccessForm list={list} projectName={projectName} isLoading={isLoadingList} />
          </Styled.Section>
        )}
      </Styled.Scrollable>
    </Styled.Panel>
  )
}

export default ListDetailsPanel
