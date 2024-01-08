import { useMemo } from 'react'
import { Dropdown } from '@ynput/ayon-react-components'
import { useGetAllProjectsQuery } from '/src/services/project/getProject'

const ProjectDropdown = ({ projectName, setProjectName, disabled }) => {
  const { data, isLoading, isError } = useGetAllProjectsQuery({ showInactive: false })

  const projectOptions = useMemo(() => {
    if (isLoading || isError) return []
    return data.map((i) => ({ value: i.name }))
  }, [data])

  return (
    <Dropdown
      value={projectName ? [projectName] : null}
      options={projectOptions}
      onChange={(e) => setProjectName(e[0])}
      placeholder="Select a project"
      style={{ flexGrow: 1 }}
      disabled={disabled}
    />
  )
}

export default ProjectDropdown
