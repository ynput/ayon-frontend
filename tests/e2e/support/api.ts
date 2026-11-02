import { TestInfo } from '@playwright/test'
import { readFile } from 'fs/promises'
import path from 'path'
import { ApiError, AyonApi as BaseApi, apiAs as baseApiAs } from '@ynput/ayon-e2e'

/**
 * The REST client of @ynput/ayon-e2e (projects, entities, users, access groups) plus the endpoints
 * of the frontend's own areas. Tests should only use the UI for the behaviour they are testing;
 * everything around it goes through here.
 */

export type Reviewable = {
  fileId: string
  activityId: string
  filename: string
  label: string | null
  mimetype: string
  availability: 'unknown' | 'ready' | 'conversionRequired' | 'conversionRecommended'
  mediaInfo?: { width?: number; height?: number; duration?: number; codec?: string }
}

const MIME_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
}

export class AyonApi extends BaseApi {
  // ---------------------------------------------------------------------------
  // project anatomy
  // ---------------------------------------------------------------------------

  async getProjectAnatomy(project: string): Promise<Record<string, any>> {
    return this.get(`/api/projects/${project}/anatomy`)
  }

  async updateProjectAnatomy(
    project: string,
    update: (anatomy: Record<string, any>) => Record<string, any>,
  ) {
    const anatomy = await this.getProjectAnatomy(project)
    await this.post(`/api/projects/${project}/anatomy`, update(anatomy))
  }

  // ---------------------------------------------------------------------------
  // representations, workfiles, reviewables
  // ---------------------------------------------------------------------------

  async createRepresentation(
    project: string,
    data: { versionId: string; name: string; files: string[]; attrib?: Record<string, unknown> },
  ) {
    const { id } = await this.post(`/api/projects/${project}/representations`, {
      versionId: data.versionId,
      name: data.name,
      files: data.files.map((path, i) => ({ id: `${i}`.padStart(32, '0'), path, size: 0 })),
      attrib: data.attrib,
    })
    return id as string
  }

  async createWorkfile(project: string, data: { taskId: string; path: string }) {
    const { id } = await this.post(`/api/projects/${project}/workfiles`, data)
    return id as string
  }

  async workfileExists(project: string, id: string) {
    const res = await this.request.get(`/api/projects/${project}/workfiles/${id}`)
    return res.ok()
  }

  async uploadReviewable(
    project: string,
    versionId: string,
    filePath: string,
    options: { label?: string; contentType?: string } = {},
  ): Promise<Reviewable> {
    const url = `/api/projects/${project}/versions/${versionId}/reviewables`
    const contentType =
      options.contentType ?? MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'video/mp4'
    const res = await this.request.post(url, {
      data: await readFile(filePath),
      headers: { 'Content-Type': contentType, 'X-File-Name': path.basename(filePath) },
      params: options.label ? { label: options.label } : undefined,
    })
    return this.check('POST', url, res)
  }

  async listReviewables(project: string, versionId: string): Promise<Reviewable[]> {
    const res = await this.get(`/api/projects/${project}/versions/${versionId}/reviewables`)
    return res.reviewables
  }

  // ---------------------------------------------------------------------------
  // activities (comments)
  // ---------------------------------------------------------------------------

  async createComment(
    project: string,
    entityType: 'folder' | 'task' | 'version' | 'product',
    entityId: string,
    body: string,
    data?: { category?: string | null; [key: string]: unknown },
  ) {
    const { id } = await this.post(
      `/api/projects/${project}/${entityType}s/${entityId}/activities`,
      { activityType: 'comment', body, ...(data ? { data } : {}) },
    )
    return id as string
  }

  /** All activities of one entity (newest first) */
  async listActivities(
    project: string,
    entityType: 'folder' | 'task' | 'version' | 'product',
    entityId: string,
    activityTypes: string[] = ['comment'],
  ): Promise<any[]> {
    const data = await this.graphql(
      `query Activities($project: String!, $entityIds: [String!]!, $types: [String!]) {
        project(name: $project) {
          activities(entityIds: $entityIds, activityTypes: $types, last: 100) {
            edges { node { activityId activityType body category { name } reactions { reaction userName } } }
          }
        }
      }`,
      { project, entityIds: [entityId], types: activityTypes },
    )
    return data.project.activities.edges.map((e: any) => ({
      ...e.node,
      category: e.node.category?.name ?? null,
    }))
  }

  async uploadProjectFile(project: string, filePath: string, contentType?: string) {
    const url = `/api/projects/${project}/files`
    const ext = path.extname(filePath).toLowerCase()
    const type = MIME_TYPES[ext] ?? (ext === '.txt' ? 'text/plain' : 'application/octet-stream')
    const res = await this.request.post(url, {
      data: await readFile(filePath),
      headers: { 'Content-Type': contentType ?? type, 'X-File-Name': path.basename(filePath) },
    })
    const { id } = await this.check('POST', url, res)
    return id as string
  }

  async createCommentWithFiles(
    project: string,
    entityType: 'folder' | 'task' | 'version',
    entityId: string,
    body: string,
    files: string[],
  ) {
    const { id } = await this.post(
      `/api/projects/${project}/${entityType}s/${entityId}/activities`,
      { activityType: 'comment', body, files },
    )
    return id as string
  }

  async listFeedActivities(
    project: string,
    entityId: string,
    options: { activityTypes?: string[]; referenceTypes?: string[] } = {},
  ): Promise<
    {
      activityId: string
      activityType: string
      referenceType: string
      body: string
      origin: { id: string; type: string; name: string } | null
      files: { id: string; name: string; mime: string; size: string }[]
    }[]
  > {
    const data = await this.graphql(
      `query Feed($project: String!, $ids: [String!]!, $types: [String!], $refs: [String!]) {
        project(name: $project) {
          activities(entityIds: $ids, activityTypes: $types, referenceTypes: $refs, last: 100) {
            edges { node {
              activityId activityType referenceType body
              origin { id type name }
              files { id name mime size }
            } }
          }
        }
      }`,
      {
        project,
        ids: [entityId],
        types: options.activityTypes ?? null,
        refs: options.referenceTypes ?? ['origin', 'mention', 'relation'],
      },
    )
    return data.project.activities.edges.map((e: any) => e.node)
  }

  async getWatchers(
    project: string,
    entityType: 'folder' | 'task' | 'version',
    entityId: string,
  ): Promise<string[]> {
    const res = await this.get(`/api/projects/${project}/${entityType}s/${entityId}/watchers`)
    return res.watchers
  }

  async setWatchers(
    project: string,
    entityType: 'folder' | 'task' | 'version',
    entityId: string,
    watchers: string[],
  ) {
    await this.post(`/api/projects/${project}/${entityType}s/${entityId}/watchers`, { watchers })
  }

  // ---------------------------------------------------------------------------
  // addon settings
  // ---------------------------------------------------------------------------

  /** Studio settings, or the project's settings (studio values with the project's overrides) */
  async getAddonSettings(addon: string, version: string, project?: string) {
    return this.get(`/api/addons/${addon}/${version}/settings${project ? `/${project}` : ''}`)
  }

  /** Saves project settings. Never call this without a project: tests must not change studio settings */
  async updateProjectAddonSettings(
    addon: string,
    version: string,
    project: string,
    update: (settings: Record<string, any>) => Record<string, any>,
  ) {
    const settings = await this.getAddonSettings(addon, version, project)
    await this.post(`/api/addons/${addon}/${version}/settings/${project}`, update(settings))
  }

  /** The project's comment categories this user can see, with their access level */
  async listActivityCategories(
    project: string,
  ): Promise<
    { name: string; color: string; access?: Record<string, number>; accessLevel: number }[]
  > {
    const res = await this.get(`/api/projects/${project}/activityCategories`)
    return res.categories
  }

  // ---------------------------------------------------------------------------
  // entity lists
  // ---------------------------------------------------------------------------

  async createEntityList(
    project: string,
    data: { label: string; entityType?: string; entityListType?: string },
  ): Promise<string> {
    const { id } = await this.post(`/api/projects/${project}/lists`, {
      entityType: 'task',
      entityListType: 'generic',
      ...data,
    })
    return id
  }

  /** Lists of a project with the ids of the entities in them */
  async listEntityLists(
    project: string,
  ): Promise<{ id: string; label: string; entityType: string; entityIds: string[] }[]> {
    const data = await this.graphql(
      `query Lists($project: String!) {
        project(name: $project) {
          entityLists(first: 500) {
            edges { node { id label entityType items(first: 500) { edges { node { id } } } } }
          }
        }
      }`,
      { project },
    )
    return data.project.entityLists.edges.map(({ node }: any) => ({
      id: node.id,
      label: node.label,
      entityType: node.entityType,
      entityIds: node.items.edges.map((e: any) => e.node.id),
    }))
  }

  async addEntityListItem(project: string, listId: string, entityId: string) {
    await this.post(`/api/projects/${project}/lists/${listId}/items`, { entityId })
  }

  async getEntityList(
    project: string,
    listId: string,
  ): Promise<{
    id: string
    label: string
    entityType: string
    entityListType: string
    entityListFolderId: string | null
    owner: string | null
    active: boolean
    access: Record<string, number>
    attrib: Record<string, any>
    items: { id: string; entityId: string; position: number; attrib: Record<string, any> }[]
  }> {
    return this.get(`/api/projects/${project}/lists/${listId}`)
  }

  async updateEntityList(project: string, listId: string, data: Record<string, unknown>) {
    await this.patch(`/api/projects/${project}/lists/${listId}`, data)
  }

  async getEntityListAttributes(
    project: string,
    listId: string,
  ): Promise<{ name: string; data: Record<string, any> }[]> {
    return this.get(`/api/projects/${project}/lists/${listId}/attributes`)
  }

  async setEntityListAttributes(
    project: string,
    listId: string,
    attributes: { name: string; data: Record<string, any> }[],
  ) {
    await this.put(`/api/projects/${project}/lists/${listId}/attributes`, attributes)
  }

  async createEntityListFolder(
    project: string,
    data: { label: string; parentId?: string; scope?: string[] },
  ): Promise<string> {
    const { id } = await this.post(`/api/projects/${project}/entityListFolders`, {
      label: data.label,
      parentId: data.parentId,
      data: { scope: data.scope ?? ['generic'] },
    })
    return id
  }

  async listEntityListFolders(
    project: string,
  ): Promise<{ id: string; label: string; parentId: string | null }[]> {
    const { folders } = await this.get(`/api/projects/${project}/entityListFolders`)
    return folders.map((f: any) => ({ id: f.id, label: f.label, parentId: f.parentId ?? null }))
  }

  async getWorkingViewSettings(viewType: string, project: string): Promise<any | null> {
    const url = `/api/views/${viewType}/working`
    const res = await this.request.get(url, { params: { project_name: project } })
    if (res.status() === 404) return null
    const view = await this.check('GET', url, res)
    return view.settings
  }

  async setWorkingViewColumns(viewType: string, project: string, columns: string[]) {
    await this.post(`/api/views/${viewType}?project_name=${project}`, {
      label: 'Working',
      working: true,
      settings: { columns: columns.map((name) => ({ name, visible: true })) },
    })
  }

  async setWorkingViewSettings(viewType: string, project: string, settings: Record<string, any>) {
    await this.post(`/api/views/${viewType}?project_name=${project}`, {
      label: 'Working',
      working: true,
      settings,
    })
  }

  // FLAG (backend): a manager's or admin's inbox reads every project, use a regular user
  async listInboxMessages(filter: { important?: boolean; active?: boolean } = {}): Promise<
    {
      activityId: string
      activityType: string
      body: string
      read: boolean
      active: boolean
      projectName: string
      originId: string | null
    }[]
  > {
    const data = await this.graphql(
      `query Inbox($important: Boolean, $active: Boolean) {
        inbox(last: 100, showImportantMessages: $important, showActiveMessages: $active) {
          edges { node { activityId activityType body read active projectName origin { id } } }
        }
      }`,
      { important: filter.important ?? null, active: filter.active ?? null },
    )
    return data.inbox.edges
      .map(({ node }: any) => ({
        activityId: node.activityId,
        activityType: node.activityType,
        body: node.body,
        read: node.read,
        active: node.active,
        projectName: node.projectName,
        originId: node.origin?.id ?? null,
      }))
      .reverse()
  }

  // ---------------------------------------------------------------------------
  // teams
  // ---------------------------------------------------------------------------

  async createTeam(
    project: string,
    name: string,
    members: { name: string; roles?: string[]; leader?: boolean }[] = [],
  ) {
    await this.put(`/api/projects/${project}/teams/${name}`, {
      name,
      members: members.map((m) => ({ roles: [], leader: false, ...m })),
    })
  }

  async listTeams(project: string): Promise<{ name: string; members: { name: string }[] }[]> {
    return this.get(`/api/projects/${project}/teams`)
  }

  async getTeamMembers(
    project: string,
    team: string,
  ): Promise<{ name: string; leader: boolean; roles: string[] }[] | undefined> {
    const teams: { name: string; members: { name: string; leader: boolean; roles: string[] }[] }[] =
      await this.get(`/api/projects/${project}/teams`, { show_members: true })
    return teams.find((t) => t.name === team)?.members
  }

  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // secrets and anatomy presets
  // ---------------------------------------------------------------------------

  async setSecret(name: string, value: string) {
    await this.put(`/api/secrets/${name}`, { name, value })
  }

  async getSecretValue(name: string): Promise<string | undefined> {
    const res = await this.request.get(`/api/secrets/${name}`)
    if (res.status() === 404) return undefined
    const secret = await this.check('GET', `/api/secrets/${name}`, res)
    return secret.value
  }

  async listSecretNames(): Promise<string[]> {
    const secrets: { name: string }[] = await this.get('/api/secrets')
    return secrets.map((s) => s.name)
  }

  async deleteSecret(name: string) {
    const res = await this.request.delete(`/api/secrets/${name}`)
    if (!res.ok() && res.status() !== 404) {
      throw new ApiError('DELETE', `/api/secrets/${name}`, res.status(), await res.text())
    }
  }

  async createAnatomyPreset(name: string) {
    const anatomy = await this.get('/api/anatomy/presets/__builtin__')
    await this.put(`/api/anatomy/presets/${name}`, anatomy)
  }

  async listAnatomyPresets(): Promise<{ name: string; primary: boolean }[]> {
    const res = await this.get('/api/anatomy/presets')
    return res.presets
  }

  async deleteAnatomyPreset(name: string) {
    const res = await this.request.delete(`/api/anatomy/presets/${name}`)
    if (!res.ok() && res.status() !== 404) {
      throw new ApiError('DELETE', `/api/anatomy/presets/${name}`, res.status(), await res.text())
    }
  }
}

/** A REST client acting as another user (e.g. one the test created), with the frontend's endpoints */
export const apiAs = (testInfo: TestInfo, name: string, password: string) =>
  baseApiAs(testInfo, name, password, AyonApi)
