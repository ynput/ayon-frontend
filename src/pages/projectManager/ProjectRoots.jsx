import ayonClient from '/src/ayon'
import { useState, useMemo, useEffect } from 'react'
import { useGetProjectQuery } from '/src/services/getProject'
import { useGetCustomRootsQuery, useSetCustomRootsMutation } from '/src/services/customRoots'
import {
  InputText,
  Button,
  FormLayout,
  FormRow,
  Panel,
  Section,
} from '@ynput/ayon-react-components'

const ProjectRootForm = ({ projectName, machineName, machineIdent, roots }) => {
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
        {machineName}{' '}
        <span style={{ fontWeight: 'normal', fontStyle: 'italic', float: 'right' }}>
          {machineIdent}
        </span>
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
            onClick={() => setCustomRoots({ projectName, machineIdent, data: rootValues })}
          />
        </FormRow>
      </FormLayout>
    </Panel>
  )
}

const ProjectRoots = ({ projectName }) => {
  const { data: project, isLoading: projectLoading } = useGetProjectQuery({ projectName })
  const { data: rootOverrides, isLoading: overridesLoading } = useGetCustomRootsQuery({
    projectName,
  })

  const forms = useMemo(() => {
    const forms = []
    for (const machine of ayonClient.settings.machines) {
      const roots = []
      for (const rootName in project?.config?.roots || {}) {
        const rootPath = project.config.roots[rootName][machine.platform]
        const customRootPath = rootOverrides?.[machine.ident]?.[rootName]
        roots.push({
          name: rootName,
          originalPath: rootPath,
          customPath: customRootPath,
        })
      }
      forms.push({
        projectName,
        machineIdent: machine.ident,
        machineName: machine.hostname,
        roots,
      })
    } // machines iter
    console.log(forms)
    return forms
  }, [project, rootOverrides])

  if (projectLoading || overridesLoading) return <>loading</>

  return (
    <Section className="invisible" style={{ maxWidth: 600 }}>
      {forms.map((form) => (
        <ProjectRootForm key={form.machineIdent} {...form} />
      ))}
    </Section>
  )
}

export default ProjectRoots
