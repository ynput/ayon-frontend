import { Section, Panel } from '@ynput/ayon-react-components'
import { PathField } from '/src/containers/fieldFormat'
import Thumbnail from '/src/containers/thumbnail'
import AttributeTable from '/src/containers/attributeTable'
import { useState } from 'react'
import { useSelector } from 'react-redux'
import { useGetWorkfileByIdQuery } from '/src/services/getWorkfiles'
import { useGetSiteRootsQuery } from '/src/services/customRoots'
import { toast } from 'react-toastify'
import SiteDropdown from '/src/containers/SiteDropdown'

const getCurrentPlatform = () => {
  const platform = window.navigator.userAgent.toLowerCase()

  if (platform.includes('win')) {
    return 'windows'
  } else if (platform.includes('mac')) {
    return 'darwin'
  } else if (platform.includes('linux')) {
    return 'linux'
  } else {
    return 'other'
  }
}

const replaceRoot = (inputStr, replacements) => {
  if (!inputStr) return inputStr
  return inputStr.replace(/\{root\[(.*?)\]\}/g, function (match, p1) {
    //TODO: fix eslint error
    //eslint-disable-next-line
    if (replacements.hasOwnProperty(p1)) {
      return replacements[p1]
    }
    return match
  })
}

const WorkfileDetail = ({ workfileId, style }) => {
  const projectName = useSelector((state) => state.project.name)
  const [selectedSite, setSelectedSite] = useState(null)

  const {
    data = {},
    isLoading,
    isError,
    error,
  } = useGetWorkfileByIdQuery({ projectName, id: workfileId }, { skip: !workfileId })

  const platform = getCurrentPlatform()
  const { data: rootsData = {} } = useGetSiteRootsQuery({
    projectName,
    siteId: selectedSite,
    platform,
  })

  if (isError) {
    // log and toast error
    console.error(error)
    toast.error(error.message)
    toast.error('Error fetching workfile details')

    return <div>Error</div>
  }

  let path = Object.keys(rootsData).length ? replaceRoot(data?.path, rootsData) : data?.path

  return (
    <Section style={style}>
      <Panel>
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <>
            <Thumbnail
              projectName={projectName}
              entityType="workfile"
              entityId={workfileId}
              entityUpdatedAt={data?.updatedAt}
            />

            <AttributeTable
              entityType="workfile"
              data={data?.attrib || {}}
              additionalData={[
                {
                  title: 'Path for site',
                  value: <SiteDropdown value={selectedSite} onChange={setSelectedSite} allowNull />,
                },
                {
                  title: 'Path',
                  value: <PathField value={path} />,
                },
              ]}
            />
          </>
        )}
      </Panel>
    </Section>
  )
}

export default WorkfileDetail
