import { Button } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'
import { useProjectTableContext } from '../context/project-table/ProjectTableContextInstance'

const LoadMore = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  padding: 4px;
  button {
    width: 100%;
  }
`

interface LoadMoreWidgetProps {
  id: string | undefined
  label?: string
  onLoadMore: (id?: string) => void
}

const LoadMoreWidget: FC<LoadMoreWidgetProps> = ({ label = 'Load more', id, onLoadMore }) => {
  const { isLoadingMoreGroups } = useProjectTableContext()

  return (
    <LoadMore id={`load-more-${id}`} className="load-more" data-group={id}>
      <Button
        icon={isLoadingMoreGroups ? 'progress_activity' : undefined}
        label={isLoadingMoreGroups ? 'Loading…' : label}
        disabled={isLoadingMoreGroups}
        onClick={(e) => {
          onLoadMore(id)
        }}
        variant="tonal"
      />
    </LoadMore>
  )
}

export default LoadMoreWidget
