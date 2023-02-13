import ayonClient from '/src/ayon'
import { useState, useMemo, useEffect } from 'react'
import { useGetProjectQuery } from '../../services/project/getProject'
import { useGetCustomRootsQuery, useSetCustomRootsMutation } from '/src/services/customRoots'
import {
  InputText,
  Button,
  FormLayout,
  FormRow,
  Panel,
  Section,
} from '@ynput/ayon-react-components'

const ProjectRootForm = ({ projectName, siteName, siteId, roots }) => {
  const [setCustomRoots] = useSetCustomRootsMutation()
  const [rootValues, setRootValues] = useState(null)

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
          <Button
            label="Save"
            onClick={() => setCustomRoots({ projectName, siteId, data: rootValues })}
          />
        </FormRow>
      </FormLayout>
    </Panel>
  )
}

const ProjectRoots = ({ projectName }) => {
  const {
    data: project,
    isLoading: projectLoading,
    isError,
  } = useGetProjectQuery({ projectName }, { skip: !projectName })
  const { data: rootOverrides, isLoading: overridesLoading } = useGetCustomRootsQuery({
    projectName,
  })

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
        projectName,
        siteId: site.id,
        siteName: site.hostname,
        roots,
      })
    } // sites iter
    console.log(forms)
    return forms
  }, [project, rootOverrides])

  if (projectLoading || overridesLoading) return <>loading</>

  if (isError) return <>error</>

  return (
    <Section className="invisible" style={{ maxWidth: 600 }}>
      {forms.map((form) => (
        <ProjectRootForm key={form.siteId} {...form} />
      ))}
    </Section>
  )
}

export default ProjectRoots
