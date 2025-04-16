import ayonClient from '@/ayon'
import { useState, useMemo, useEffect } from 'react'
import { useGetProjectQuery } from '@queries/project/getProject'
import { useGetCustomRootsQuery, useSetCustomRootsMutation } from '@queries/customRoots'
import {
  InputText,
  FormLayout,
  FormRow,
  Panel,
  Section,
  SaveButton,
} from '@ynput/ayon-react-components'
import ProjectManagerPageLayout from './ProjectManagerPageLayout'
import { toast } from 'react-toastify'
import EmptyPlaceholder from '@shared/EmptyPlaceholder/EmptyPlaceholder'

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

const ProjectRoots = ({ projectName, projectList, userPermissions }) => {
  if (userPermissions && !userPermissions.assignedToProject(projectName)) {
    return (
      <ProjectManagerPageLayout {...{ projectList }}>
        <EmptyPlaceholder
          icon="settings_alert"
          message="You don't have permission to view this project's roots"
        />
      </ProjectManagerPageLayout>
    )
  }

  const {
    data: project,
    isLoading: isLoadingProject,
    isError,
  } = useGetProjectQuery({ projectName }, { skip: !projectName })
  const { data: rootOverrides } = useGetCustomRootsQuery({
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
    return forms
  }, [project, rootOverrides])

  return (
    <ProjectManagerPageLayout {...{ projectList }}>
      {(!isLoadingProject && isError) || !userPermissions.assignedToProject(projectName) ? (
        <EmptyPlaceholder
          icon="settings_alert"
          message="Something went wrong while fetching project roots data"
        />
      ) : forms.length === 0 ? (
        <EmptyPlaceholder icon="lists" message="No sites were found" />
      ) : (
        <div style={{ height: '100%', overflow: 'auto' }}>
          <Section className="invisible" style={{ maxWidth: 600 }}>
            {forms.map((form) => (
              <ProjectRootForm key={form.siteId} {...form} />
            ))}
          </Section>
        </div>
      )}
    </ProjectManagerPageLayout>
  )
}

export default ProjectRoots
