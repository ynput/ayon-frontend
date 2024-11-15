import { FC } from 'react'
import * as Styled from './Slicer.styled'
import SlicerTable from './SlicerTable'
import useHierarchyTable from './hooks/useHierarchyTable'
import { useAppSelector } from '@state/store'
import { useGetProjectQuery } from '@queries/project/getProject'

interface SlicerProps {}

const Slicer: FC<SlicerProps> = ({}) => {
  const projectName = useAppSelector((state) => state.project.name)

  const { data: project } = useGetProjectQuery(
    { projectName: projectName || '' },
    { skip: !projectName },
  )

  // project info
  const { data: hierarchyData = [] } = useHierarchyTable({
    projectName,
    folderTypes: project?.folderTypes || [],
  })

  return (
    <Styled.Container>
      <SlicerTable data={hierarchyData} />
    </Styled.Container>
  )
}

export default Slicer
