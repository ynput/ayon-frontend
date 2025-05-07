import { useListProjectsQuery } from '@shared/api'
import { useMemo } from 'react'
import { Dropdown } from '@ynput/ayon-react-components'

const ProjectDropdown = ({ projectName, setProjectName, disabled, style }) => {
  const { data, isLoading, isError } = useListProjectsQuery({ active: true })

  const projectOptions = useMemo(() => {
    if (isLoading || isError) return []
    return data.map((i) => ({ value: i.name }))
  }, [data])

  let dropwdownStyle = {}
  if (style) dropwdownStyle = style
  else dropwdownStyle.flexGrow = 1

  return (
    <Dropdown
      value={projectName ? [projectName] : null}
      options={projectOptions}
      onChange={(e) => setProjectName(e[0])}
      placeholder="Select a project"
      style={dropwdownStyle}
      disabled={disabled}
    />
  )
}

export default ProjectDropdown
