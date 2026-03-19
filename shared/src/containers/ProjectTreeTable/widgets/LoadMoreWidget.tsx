import { Button } from '@ynput/ayon-react-components'
import { FC } from 'react'
import styled from 'styled-components'

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
  return (
    <LoadMore id={`load-more-${id}`} className="load-more">
      <Button
        label={label}
        onClick={(e) => {
          onLoadMore(id)
        }}
        variant="tonal"
      />
    </LoadMore>
  )
}

export default LoadMoreWidget
