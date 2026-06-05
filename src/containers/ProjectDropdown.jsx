import { useMemo } from 'react'
import { useGlobalContext } from '@shared/context'
import { Dropdown } from '@ynput/ayon-react-components'

const ProjectDropdown = ({ projectName, setProjectName, disabled, style }) => {
  const { projects, isLoading, error } = useGlobalContext()

  const projectOptions = useMemo(() => {
    if (isLoading || error) return []
    return projects.active.map((i) => ({ value: i.name }))
  }, [projects.active, isLoading, error])

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
