import { FC, useState } from 'react'
import * as Styled from './ListDetailsPanel.styled'
import { Icon } from '@ynput/ayon-react-components'
import { upperFirst } from 'lodash'
import { getListIcon } from '@pages/ProjectListsPage/util'
import { ListAttributeForm, ListMetaData } from '@shared/components'
import { useGetEntityListQuery } from '@shared/api'
import { useQueryArgumentChangeLoading } from '@hooks/useQueryArgumentChangeLoading'
import { useListsDataContext } from '../../context/ListsDataContext'
import clsx from 'clsx'
import ListDetailsTabs, { ListDetailsTab } from '../ListDetailsTabs/ListDetailsTabs'
import { ListAccessForm } from '../ListAccessForm'

interface ListDetailsPanelProps {
  listId: string
  projectName: string
}

const ListDetailsPanel: FC<ListDetailsPanelProps> = ({ listId, projectName }) => {
  const {
    data: list,
    isFetching,
    isLoading,
  } = useGetEntityListQuery({ listId, projectName }, { skip: !listId })

  // Get lists data for category enum
  const { categoryEnum } = useListsDataContext()

  // Use custom hook to track loading state only when arguments change
  const isLoadingOnArgChange = useQueryArgumentChangeLoading({ listId, projectName }, isFetching)

  // Combine initial loading with argument change loading
  const isLoadingList = isLoading || isLoadingOnArgChange

  const isReview = list?.entityListType === 'review-session'

  const [selectedTab, setSelectedTab] = useState<ListDetailsTab>('access')

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
      </Styled.Header>
      <Styled.Scrollable>
        {selectedTab === 'details' && (
          <>
            <Styled.Section>
              <ListAttributeForm
                list={list}
                isLoading={isLoadingList}
                projectName={projectName}
                categoryEnum={categoryEnum}
              />
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
