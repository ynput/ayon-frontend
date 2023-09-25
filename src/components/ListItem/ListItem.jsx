import React from 'react'
import * as Styled from './ListItem.styled'
// import StatusSelect from '../status/statusSelect'
import { Icon } from '@ynput/ayon-react-components'

const ListItem = ({ task = {}, none, isLast, isFirst, selected, ...props }) => {
  const pathDepth = 3
  const paths = task.path.split('/')
  // get the end of the path based on the depth
  const pathEnds = paths.slice(-pathDepth)
  // are there more paths than the depth?
  const hasMorePaths = paths.length > pathDepth

  return (
    <Styled.Item
      $isLast={isLast}
      $isFirst={isFirst}
      className={selected ? 'selected' : undefined}
      tabIndex={0}
      id={task.id}
      {...props}
    >
      {none ? (
        'No Tasks Found'
      ) : (
        <>
          {/* <StatusSelect options={[]} value={task.status} size="icon" /> */}
          <Styled.ItemThumbnail src={task.thumbnailUrl} icon={task.taskIcon} />
          <Styled.Path>
            <Styled.PathItem>{task.projectCode}</Styled.PathItem>
            {
              <Styled.PathItem style={{ marginLeft: hasMorePaths ? 0 : -4 }}>
                {hasMorePaths ? '...' : ''}
              </Styled.PathItem>
            }
            {pathEnds.map((pathEnd, i, a) => (
              <Styled.PathItem key={i} className={i === a.length - 1 ? 'last' : undefined}>
                {pathEnd}
              </Styled.PathItem>
            ))}
            <Styled.Name>
              <Icon icon={task.taskIcon} />
              <span>{task.name}</span>
            </Styled.Name>
          </Styled.Path>
        </>
      )}
    </Styled.Item>
  )
}

export default ListItem
