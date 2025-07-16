import { FC, useState } from 'react'
import * as Styled from './LinksManager.styled'
import { Icon } from '@ynput/ayon-react-components'
import { supportedEntityTypes, useGetSearchedEntitiesInfiniteQuery } from '@shared/api'

interface AddNewLinksProps {
  outputType: string
  projectName: string
}

const AddNewLinks: FC<AddNewLinksProps> = ({ projectName, outputType }) => {
  const [search, setSearch] = useState('')

  const { data: searchData } = useGetSearchedEntitiesInfiniteQuery(
    {
      projectName,
      entityType: outputType,
      search,
    },
    { skip: !search || !supportedEntityTypes.includes(outputType) },
  )

  console.log(searchData)

  return (
    <Styled.AddLinksContainer>
      <Styled.Search>
        <Icon icon={'search'} />
        <Styled.SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search to add ${outputType}s...`}
        />
      </Styled.Search>
    </Styled.AddLinksContainer>
  )
}

export default AddNewLinks
