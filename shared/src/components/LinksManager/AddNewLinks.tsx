import { FC, useState } from 'react'
import * as Styled from './LinksManager.styled'
import { Icon } from '@ynput/ayon-react-components'
import {
  supportedEntityTypes,
  useGetSearchedEntitiesLinksInfiniteQuery,
} from '@shared/api/queries/links/getLinks'
import { getEntityTypeIcon } from '@shared/util'

interface AddNewLinksProps {
  outputType: string
  projectName: string
}

const AddNewLinks: FC<AddNewLinksProps> = ({ projectName, outputType }) => {
  const [search, setSearch] = useState('')

  const {
    data: searchData,
    error,
    isFetching,
  } = useGetSearchedEntitiesLinksInfiniteQuery(
    {
      projectName,
      entityType: outputType,
      search,
    },
    { skip: !search || !supportedEntityTypes.includes(outputType) },
  )

  return (
    <Styled.AddLinksContainer>
      <Styled.Search>
        <Icon icon={'search'} />
        <Styled.SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search to add ${outputType}s...`}
          autoFocus
        />
      </Styled.Search>
      {search && searchData && (
        <Styled.SearchItems>
          {searchData?.pages.map((page) =>
            page.entities.map((entity) => (
              <Styled.SearchItem key={entity.id} onClick={() => console.log(`Add ${entity.name}`)}>
                <Icon icon={getEntityTypeIcon(entity.entityType)} />
                <span className="label">{entity.label || entity.name}</span>
                <Icon icon={'add'} className="add" />
              </Styled.SearchItem>
            )),
          )}
        </Styled.SearchItems>
      )}
      {!isFetching && error && <Styled.Error>{error.message}</Styled.Error>}
    </Styled.AddLinksContainer>
  )
}

export default AddNewLinks
