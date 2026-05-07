type ProjectLike = {
  name: string
  label?: string | null
}

export const getProjectDisplayName = (project: ProjectLike | null | undefined): string => {
  if (!project) return ''
  const label = project.label?.trim()
  return label || project.name
}