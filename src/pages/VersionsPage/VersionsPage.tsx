import { useGetVersionsInfiniteQuery } from '@shared/api'
import { flattenInfiniteVersionsData } from '@shared/api/queries/versions/versionsUtils'
import { FC } from 'react'

interface VersionsPageProps {
  projectName: string
}

const VersionsPage: FC<VersionsPageProps> = ({ projectName }) => {
  const { data } = useGetVersionsInfiniteQuery({ projectName })
  const allVersions = flattenInfiniteVersionsData(data)
  console.log(allVersions)

  return <div>VersionsPage</div>
}

export default VersionsPage
