import { ayonApi } from '@queries/ayon'
import { transformEntityData } from './userDashboardHelpers'
import { KAN_BAN_ASSIGNEES_QUERY, buildDetailsQuery } from './userDashboardQueries'
import API from '@api'

const getUserDashboard = ayonApi.injectEndpoints({
  endpoints: (build) => ({
    getProjectsInfo: build.query({
      async queryFn({ projects = [] }, { dispatch }) {
        try {
          // get project info for each project
          const projectInfo = {}
          for (const project of projects) {
            // hopefully this will be cached
            // it also allows for different combination of projects but still use the cache
            const response = await dispatch(
              API.rest.endpoints.getProjectAnatomy.initiate(
                { projectName: project },
                { forceRefetch: false },
              ),
            )

            if (response.status === 'rejected') {
              throw 'No projects found'
            }
            projectInfo[project] = response.data
          }

          return { data: projectInfo }
        } catch (error) {
          console.error(error)
          return { error }
        }
      },
    }),
    getKanBanAssignee: build.query({
      query: ({ projectName }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: KAN_BAN_ASSIGNEES_QUERY,
          variables: { projectName },
        },
      }),
      transformResponse: (res) =>
        res?.data?.users.edges.flatMap((u) => {
          if (!u.node) return []

          const n = u.node

          return {
            name: n.name,
            fullName: n.attrib?.fullName,
            avatarUrl: `/api/users/${n.name}/avatar`,
          }
        }),
    }),
    getKanBanUsers: build.query({
      async queryFn({ projects = [] }, { dispatch }) {
        try {
          // get users for each project
          const assignees = []
          const usersOnProjects = {}
          for (const project of projects) {
            // hopefully this will be cached
            // it also allows for different combination of projects but still use the cache
            const response = await dispatch(
              ayonApi.endpoints.getKanBanAssignee.initiate(
                { projectName: project },
                { forceRefetch: false },
              ),
            )

            if (response.status === 'rejected') {
              console.error('no projects found', project)
              throw new Error('No projects found', project)
            }
            response.data.forEach((assignee) => {
              const existingAssignee = assignees.find((a) => a.name === assignee.name)
              if (existingAssignee) {
                existingAssignee.projects.push(project)
              } else {
                assignees.push({
                  ...assignee,
                  avatarUrl: `/api/users/${assignee.name}/avatar`,
                  projects: [project],
                })
              }
            })

            usersOnProjects[project] = response.data.map((a) => a.name)
          }

          return { data: assignees }
        } catch (error) {
          console.error(error)
          return error
        }
      },
    }),
    // TODO, move to separate file getEntityPanel
    getDashboardEntityDetails: build.query({
      query: ({ projectName, entityId, entityType }) => ({
        url: '/graphql',
        method: 'POST',
        body: {
          query: buildDetailsQuery(entityType),
          variables: { projectName, entityId },
        },
      }),
      transformResponse: (response, meta, { entityType, projectName, projectInfo }) =>
        transformEntityData({
          projectName: projectName,
          entity: response?.data?.project && response?.data?.project[entityType],
          entityType,
          projectInfo,
        }),
      serializeQueryArgs: ({ queryArgs: { projectName, entityId, entityType } }) => ({
        projectName,
        entityId,
        entityType,
      }),
      providesTags: (res, error, { entityId, entityType }) =>
        res
          ? [
              { type: entityType, id: entityId },
              { type: entityType, id: 'LIST' },
            ]
          : [{ type: entityType, id: 'LIST' }],
    }),
    getDashboardEntitiesDetails: build.query({
      async queryFn({ entities = [], entityType, projectsInfo = {} }, { dispatch }) {
        try {
          const promises = entities.map((entity) =>
            dispatch(
              ayonApi.endpoints.getDashboardEntityDetails.initiate(
                {
                  projectName: entity.projectName,
                  entityId: entity.id,
                  entityType,
                  projectInfo: projectsInfo[entity.projectName],
                },
                { forceRefetch: false },
              ),
            ),
          )

          const res = await Promise.all(promises)

          const entitiesDetails = []
          for (const response of res) {
            if (response.status === 'rejected') {
              console.error('No entity found')
              continue
            }

            entitiesDetails.push(response.data)
          }

          return { data: entitiesDetails }
        } catch (error) {
          console.error(error)
          return error
        }
      },
      serializeQueryArgs: ({ queryArgs: { entities, entityType } }) => ({
        entities,
        entityType,
      }),
      providesTags: (res, error, { entities }) =>
        entities.map(({ id }) => ({ id, type: 'entities' })),
    }),
  }),
})

//

export const {
  useGetProjectsInfoQuery,
  useGetKanBanUsersQuery,
  useGetDashboardEntitiesDetailsQuery,
  useLazyGetDashboardEntitiesDetailsQuery,
} = getUserDashboard
