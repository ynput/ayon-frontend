import { FC } from 'react'
import * as Styled from './LinksManager.styled'

interface SearchingLoadingItemsProps {}

const SearchingLoadingItems: FC<SearchingLoadingItemsProps> = ({}) => {
  return Array.from({ length: 3 }, (_, index) => (
    <Styled.SearchItem key={`loading-${index}`} className="loading">
      <div className="icon">•</div>
      <div className="label">Loading...</div>
      <div className="type">•</div>
    </Styled.SearchItem>
  ))
}

export default SearchingLoadingItems
