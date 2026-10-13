export const projectBundleFromName = (name?: string) => {
  if (!name) return null
  const match = name.match(/^__project__(.+)__(\w+)$/)
  if (!match) return null
  return { bundleName: match[1], variant: match[2] }
}
