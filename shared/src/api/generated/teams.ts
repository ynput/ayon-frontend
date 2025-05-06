import { api } from '@shared/api/base'
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    getTeams: build.query<GetTeamsApiResponse, GetTeamsApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/teams`,
        params: {
          show_members: queryArg.showMembers,
        },
      }),
    }),
    updateTeams: build.mutation<UpdateTeamsApiResponse, UpdateTeamsApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/teams`,
        method: 'PATCH',
        body: queryArg.payload,
      }),
    }),
    saveTeam: build.mutation<SaveTeamApiResponse, SaveTeamApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/teams/${queryArg.teamName}`,
        method: 'PUT',
        body: queryArg.teamPutModel,
      }),
    }),
    deleteTeam: build.mutation<DeleteTeamApiResponse, DeleteTeamApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/teams/${queryArg.teamName}`,
        method: 'DELETE',
      }),
    }),
    saveTeamMember: build.mutation<SaveTeamMemberApiResponse, SaveTeamMemberApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/teams/${queryArg.teamName}/members/${queryArg.memberName}`,
        method: 'PUT',
        body: queryArg.teamMemberModel,
      }),
    }),
    deleteTeamMember: build.mutation<DeleteTeamMemberApiResponse, DeleteTeamMemberApiArg>({
      query: (queryArg) => ({
        url: `/api/projects/${queryArg.projectName}/teams/${queryArg.teamName}/members/${queryArg.memberName}`,
        method: 'DELETE',
      }),
    }),
  }),
  overrideExisting: false,
})
export { injectedRtkApi as api }
export type GetTeamsApiResponse = /** status 200 Successful Response */ TeamListItemModel[]
export type GetTeamsApiArg = {
  projectName: string
  showMembers?: boolean
}
export type UpdateTeamsApiResponse = unknown
export type UpdateTeamsApiArg = {
  projectName: string
  payload: TeamModel[]
}
export type SaveTeamApiResponse = unknown
export type SaveTeamApiArg = {
  teamName: string
  projectName: string
  teamPutModel: TeamPutModel
}
export type DeleteTeamApiResponse = unknown
export type DeleteTeamApiArg = {
  teamName: string
  projectName: string
}
export type SaveTeamMemberApiResponse = unknown
export type SaveTeamMemberApiArg = {
  teamName: string
  memberName: string
  projectName: string
  teamMemberModel: TeamMemberModel
}
export type DeleteTeamMemberApiResponse = unknown
export type DeleteTeamMemberApiArg = {
  teamName: string
  memberName: string
  projectName: string
}
export type TeamMemberModel = {
  name: string
  leader?: boolean
  roles?: string[]
}
export type TeamListItemModel = {
  /** Team name */
  name: string
  /** Number of members in the team */
  memberCount: number
  /** Team members */
  members?: TeamMemberModel[]
  /** Team leaders */
  leaders?: TeamMemberModel[]
}
export type ValidationError = {
  loc: (string | number)[]
  msg: string
  type: string
}
export type HttpValidationError = {
  detail?: ValidationError[]
}
export type TeamModel = {
  /** Team name */
  name: string
  /** Team members */
  members?: TeamMemberModel[]
}
export type TeamPutModel = {
  members: TeamMemberModel[]
}
