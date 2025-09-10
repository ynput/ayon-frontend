import { FC, useState } from 'react'
import * as Styled from './ListDetailsPanel.styled'
import { Icon } from '@ynput/ayon-react-components'
import { upperFirst } from 'lodash'
import { getListIcon } from '@pages/ProjectListsPage/util'
import ListDetailsTabs, { ListDetailsTab } from '../ListDetailsTabs/ListDetailsTabs'
import { ListAttributeForm, ListMetaData } from '@shared/components'
import { useGetEntityListQuery } from '@shared/api'
import { useQueryArgumentChangeLoading } from '@hooks/useQueryArgumentChangeLoading'
import { useListsDataContext } from '../../context/ListsDataContext'
import clsx from 'clsx'

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

  const [selectedTab, setSelectedTab] = useState<ListDetailsTab>('details')

  return (
    <Styled.Panel>
      <Styled.Section className="border">
        <ListDetailsTabs selected={selectedTab} onChange={setSelectedTab} />
      </Styled.Section>
      <Styled.Scrollable>
        <Styled.Header>
          <h2 className={clsx('title', { loading: isLoadingList })}>
            {isLoadingList ? 'Loading...' : list?.label}
          </h2>
          <span className={clsx('type', { loading: isLoadingList })}>
            {list && <Icon icon={getListIcon(list)} />}
            {upperFirst(list?.entityType)}s {isReview && '(Review)'}
          </span>
        </Styled.Header>
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
      </Styled.Scrollable>
    </Styled.Panel>
  )
}

export default ListDetailsPanel
