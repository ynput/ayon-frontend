import ayonClient from '/src/ayon'
import { useState, useMemo, useEffect } from 'react'
import { useGetProjectQuery } from '../../services/project/getProject'
import { useGetCustomRootsQuery, useSetCustomRootsMutation } from '/src/services/customRoots'
import {
  InputText,
  FormLayout,
  FormRow,
  Panel,
  Section,
  SaveButton,
} from '@ynput/ayon-react-components'
import { toast } from 'react-toastify'
import ProjectList from '/src/containers/projectList'

const ProjectRootForm = ({ projectName, siteName, siteId, roots }) => {
  const [setCustomRoots, { isLoading }] = useSetCustomRootsMutation()
  const [rootValues, setRootValues] = useState(null)

  const handleSave = async () => {
    try {
      await setCustomRoots({ projectName, siteId, data: rootValues }).unwrap()

      toast.success(`Roots saved`)
    } catch (error) {
      toast.error(`Error saving roots: ${error?.message}`)
    }
  }

  const isChange = useMemo(() => {
    if (!rootValues) return false
    for (const root of roots) {
      if (rootValues[root.name] !== root.customPath) return true
    }
    return false
  }, [rootValues, roots])

  useEffect(() => {
    const res = {}
    for (const root of roots) {
      res[root.name] = root.customPath
    }
    setRootValues(res)
  }, [roots])

  if (!rootValues) return <>loading</>

  return (
    <Panel>
      <h3 style={{ display: 'block' }}>
        {siteName}{' '}
        <span style={{ fontWeight: 'normal', fontStyle: 'italic', float: 'right' }}>{siteId}</span>
      </h3>
      <FormLayout>
        {roots.map((root) => (
          <FormRow key={root.name} label={root.name}>
            <InputText
              value={rootValues[root.name] || ''}
              placeholder={root.originalPath}
              onChange={(e) => setRootValues({ ...rootValues, [root.name]: e.target.value })}
            />
          </FormRow>
        ))}
        <FormRow>
          <SaveButton label="Save" onClick={handleSave} active={isChange} saving={isLoading} />
        </FormRow>
      </FormLayout>
    </Panel>
  )
}

const ProjectRoots = () => {
  const [selectedProject, setSelectedProject] = useState(null)

  console.log(selectedProject)

  const {
    data: project,
    isLoading: projectLoading,
    isError,
  } = useGetProjectQuery({ projectName: selectedProject }, { skip: !selectedProject })
  const { data: rootOverrides, isLoading: overridesLoading } = useGetCustomRootsQuery(
    {
      projectName: selectedProject,
    },
    { skip: !selectedProject },
  )

  const forms = useMemo(() => {
    const forms = []
    for (const site of ayonClient.settings.sites) {
      const roots = []
      for (const rootName in project?.config?.roots || {}) {
        const rootPath = project.config.roots[rootName][site.platform]
        const customRootPath = rootOverrides?.[site.id]?.[rootName]
        roots.push({
          name: rootName,
          originalPath: rootPath,
          customPath: customRootPath,
        })
      }
      forms.push({
        selectedProject,
        siteId: site.id,
        siteName: site.hostname,
        roots,
      })
    } // sites iter
    return forms
  }, [project, rootOverrides])

  if (projectLoading || overridesLoading) return <>loading</>

  if (isError) return <>Error loading project...</>

  // if (forms.length === 0) return <h1>No sites configured</h1>
  return (
    <main>
      <ProjectList
        styleSection={{ maxWidth: 300, minWidth: 300 }}
        autoSelect
        selection={selectedProject}
        onSelect={setSelectedProject}
      />
      <Section className="invisible" style={{ maxWidth: 600 }}>
        {forms.map((form) => (
          <ProjectRootForm key={form.siteId} {...form} />
        ))}
      </Section>
    </main>
  )
}

export default ProjectRoots
