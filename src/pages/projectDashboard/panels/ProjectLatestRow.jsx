import React from 'react'
import { useEffect } from 'react'
import { useContext } from 'react'
import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router'
import styled from 'styled-components'
import EntityGridTile from '/src/components/EntityGridTile'
import { UtilContext } from '/src/context/utilsContext'
import { ayonApi } from '/src/services/ayon'
import { useGetEntityTilesQuery } from '/src/services/entity/getEntity'
import { useGetEventsByTopicQuery } from '/src/services/events/getEvents'
import { useGetProjectAnatomyQuery } from '/src/services/project/getProject'

const GridStyled = styled.div`
  /* 1 row, 3 columns */
  /* columns minWidth 150px, max width 250px */
  display: grid;
  position: relative;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  grid-template-rows: auto;
  grid-auto-rows: 0;
  overflow-y: clip;
  column-gap: 8px;

  /* span error message */
  & > span {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`

const ProjectLatestRow = ({
  projectName: projectNameInit,
  types = [],
  events = [],
  banTopics = [],
}) => {
  const { getFamilyField } = useContext(UtilContext) || {}
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [projectName, setProjectName] = useState(null)

  const [isLoadingWhole, setIsLoadingWhole] = useState(true)
  //   const { data = {}, isLoading, isError } = useGetProjectLatestQuery({ projectName })

  //   update project name state
  useEffect(() => {
    setIsLoadingWhole(true)
    setProjectName(projectNameInit)
  }, [projectNameInit])

  // TODO: clean up this mess up
  // get project anatomy for project name for status
  const { data: anatomy = {} } = useGetProjectAnatomyQuery(
    {
      projectName,
    },
    { skip: !projectName },
  )

  //   create topics array
  // topic = entity.[entity].[event]
  const topics = []
  for (const entity of types) {
    for (const event of events) {
      const topic = `entity.${entity}.${event}`
      if (banTopics.includes(topic)) continue
      topics.push(topic)
    }
  }

  // number of events to get state
  //   const [numEvents, setNumEvents] = useState()
  const numEvents = 4

  //  get latest events for project and topics
  const {
    data: eventsData = [],
    isLoading: isLoadingEvents,
    isError: isErrorEvents,
    isFetching: isFetchingEvents,
  } = useGetEventsByTopicQuery(
    {
      projects: [projectName],
      topics,
      last: numEvents,
    },
    { skip: !projectName || !topics.length },
  )

  // log the events
  // console.log({ eventsData })

  //   get summary.id for each event
  // events loading state
  const [isEventsLoading, setIsEventsLoading] = useState(true)
  // data state
  const [eventData, setEntityData] = useState([])

  // async func that gets the entity id for each event
  const getEntityIds = async (events) => {
    try {
      const eventsDataPromises = []
      for (const { id } of events) {
        const promises = dispatch(ayonApi.endpoints.getEventById.initiate({ id }))
        eventsDataPromises.push(promises)
      }

      const eventsData = await Promise.all(eventsDataPromises)
      return eventsData
    } catch (error) {
      console.error(error)
    }
  }

  // get event object for each event Id, we need to do this to get the entity id off summary
  useEffect(() => {
    if (!isLoadingEvents && !isErrorEvents && !isFetchingEvents && projectName) {
      setIsEventsLoading(true)
      getEntityIds(eventsData)
        .then((data) => {
          setEntityData(data)
          setIsEventsLoading(false)
        })
        .catch((error) => console.error(error))
    }
  }, [isLoadingEvents, isErrorEvents, isFetchingEvents, projectName])

  // create entityIds object with entity type as key and array of entity ids as value
  // { subset: [id1, id2, id3], version: [id1, id2, id3] }
  const entityIds = {}
  const uniqueEntityIds = []
  for (let { data } of eventData) {
    data = data || {}
    const { summary = {}, topic } = data
    const { entityId } = summary

    // check if entity id is unique
    if (entityId && uniqueEntityIds.includes(entityId)) continue

    uniqueEntityIds.push(entityId)

    if (entityId && topic) {
      // split topic to get type
      let [, type] = topic.split('.')
      // add to entityIds
      if (entityIds[type]) {
        entityIds[type].push(entityId)
      } else {
        entityIds[type] = [entityId]
      }
    }
  }

  // get entity tiles data for each entity type
  // [entity1, entity2, entity3]
  let {
    data = [{}, {}, {}],
    isError,
    isFetching,
  } = useGetEntityTilesQuery(
    {
      projectName,
      entities: entityIds,
    },
    { skip: isEventsLoading || isErrorEvents || !projectName || !entityIds },
  )

  // used to get icons and color
  function transformArrayToObject(anatomy, propertyName) {
    return anatomy?.[propertyName]?.reduce((acc, item) => {
      acc[item.name] = item
      return acc
    }, {})
  }

  // TODO: getting anatomy should set project redux state
  const statusObject = transformArrayToObject(anatomy, 'statuses')
  const folderTypesObject = transformArrayToObject(anatomy, 'folder_types')
  const taskTypesObject = transformArrayToObject(anatomy, 'task_types')

  data = data.map((entity) => {
    let { type, icon, status } = entity
    let typeIcon = ''

    if (type === 'subset' || type === 'version') {
      typeIcon = getFamilyField(icon, 'icon')
    } else if (type === 'folder') {
      typeIcon = folderTypesObject?.[icon]?.icon
    } else if (type === 'task') {
      typeIcon = taskTypesObject?.[icon]?.icon
    }

    const statusIcon = statusObject?.[status]?.icon
    const statusColor = statusObject?.[status]?.color

    return { ...entity, typeIcon, statusIcon, statusColor, projectName }
  })

  const isNoData = !data || data.length === 0 || (!isEventsLoading && !entityIds)
  //   if no data return 3 error tiles
  if (isNoData) {
    data = [
      {
        isError: true,
      },
      {
        isError: true,
      },
      {
        isError: true,
      },
    ]
  }

  //   if all data is loaded, setIsLoadingWhole to false
  useEffect(() => {
    if (!isEventsLoading && !isErrorEvents && !isFetchingEvents && !isError && !isFetching) {
      setIsLoadingWhole(false)
    }
  }, [isEventsLoading, isErrorEvents, isFetchingEvents, isError, isFetching, projectName])

  const handleClick = (ent) => {
    const path = `/projects/${projectName}/browser?entity=${ent.id}&type=${ent.type}`
    navigate(path)
  }

  return (
    <div>
      <GridStyled>
        {data.map((entity, index) => (
          <EntityGridTile
            key={`${entity.id}-${index}`}
            {...entity}
            subTitle={null}
            onClick={() => handleClick(entity)}
            isLoading={isLoadingWhole}
          />
        ))}
        {isNoData && <span>No Recent Data</span>}
      </GridStyled>
    </div>
  )
}

export default ProjectLatestRow
