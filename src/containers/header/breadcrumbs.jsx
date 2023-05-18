import { useSelector } from 'react-redux'

import styled from 'styled-components'

const Crumbtainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  cursor: pointer;

  ul {
    list-style: none;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    margin: 0;
    padding: 0;

    & > li {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4em;

      &:not(:last-child) {
        &::after {
          margin: 0 5px;
          content: '/';
        }
      }
    }
  }
`
/*
const ProjectBreadcrumbs = ({ crumbData, projectName }) => {
  const [breadcrumbs, uri] = useMemo(() => {
    let crumbs = [projectName]
    let uri = `ayon://${projectName}/`
    for (const h of crumbData.parents || []) {
      crumbs.push(h)
      uri += `${h}/`
    }
    if (crumbData.folder) {
      crumbs.push(crumbData.folder)
      uri += crumbData.folder
    }

    if (crumbData.subset) {
      crumbs.push(crumbData.subset)
      uri += `?subset=${crumbData.subset}`
    }

    if (crumbData.version) {
      crumbs.push(crumbData.version)
      uri += `?version=${crumbData.version}`
    }

    if (crumbData.representation) {
      crumbs.push(crumbData.representation)
      uri += `?representation=${crumbData.representation}`
    }

    return [crumbs, uri]
  }, [
    crumbData.parents,
    crumbData.folder,
    crumbData.subset,
    crumbData.version,
    crumbData.representation,
    projectName,
  ])

  const copyURI = () => {
    navigator.clipboard.writeText(uri).then(
      () => {
        toast.success('URI copied')
      },
      (err) => {
        toast.error('Could not copy text: ', err)
      },
    )
  }

  if (!projectName) return <></>

  return (
    <Crumbtainer onClick={copyURI}>
      <ul>
        {breadcrumbs.map((crumb, index) => (
          <li key={index}>{crumb}</li>
        ))}
      </ul>
    </Crumbtainer>
  )
}

const SettingsBreadcrumbs = ({ crumbData }) => {
  let crumbs = []
  if (crumbData?.addonName && crumbData?.addonVersion) {
    crumbs.push(`${crumbData.addonName}@${crumbData.addonVersion}`)
  } else if (crumbData?.addonName) {
    crumbs.push(crumbData.addonName)
  }

  crumbs = [...crumbs, ...(crumbData.path || [])]

  const copyBreadcrumbs = () => {
    navigator.clipboard.writeText(crumbs.join('/')).then(
      () => toast.success('Breadcrumbs copied'),
      (err) => toast.error('Could not copy text: ', err),
    )
  }

  return (
    <Crumbtainer onClick={copyBreadcrumbs}>
      <ul>
        {crumbs.map((crumb, index) => (
          <li key={index}>{crumb}</li>
        ))}
      </ul>
    </Crumbtainer>
  )
}
*/
const Breadcrumbs = () => {
  /*
    Breadcrums component used in the browser view.

    Current location is taken from the redux store as an Object
    containing all the components of the current path.
    This allows to render the breadcrumbs as well as compile the
    op:// USD uri.
    */

  const uri = useSelector((state) => state.context.uri) || ''

  return <Crumbtainer>{uri}</Crumbtainer>

  /*

  const crumbData = useSelector((state) => state.context.breadcrumbs)
  const projectName = useSelector((state) => state.project.name)

  const scope = crumbData.scope

  if (scope === 'project') {
    return <ProjectBreadcrumbs crumbData={crumbData} projectName={projectName} />
  } else if (scope === 'settings') {
    return <SettingsBreadcrumbs crumbData={crumbData} />
  }

  return null
  // return JSON.stringify(crumbData)
 */
}

export default Breadcrumbs
