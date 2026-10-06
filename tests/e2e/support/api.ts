import { expect, APIRequestContext, APIResponse, request } from '@playwright/test'
import { randomBytes } from 'crypto'
import { readFile } from 'fs/promises'
import path from 'path'
import { uniqueName } from './names'

/**
 * Thin REST client used to set up and clean up test data.
 * Tests should only use the UI for the behaviour they are testing; everything around it goes through here.
 */

export type Folder = { id: string; name: string; folderType: string; parentId?: string | null }
export type Task = { id: string; name: string; taskType: string; folderId: string }
export type Product = { id: string; name: string; productType: string; folderId: string }
export type Version = { id: string; version: number; productId: string; taskId?: string | null }
/** A media file of a version, as the viewer gets it */
export type Reviewable = {
  fileId: string
  activityId: string
  filename: string
  label: string | null
  mimetype: string
  /** `ready` plays as is, `conversionRequired` needs a transcoder first */
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

export class ApiError extends Error {
  constructor(method: string, url: string, public status: number, body: string) {
    super(`${method} ${url} failed with ${status}: ${body.slice(0, 500)}`)
  }
}

export class AyonApi {
  constructor(public readonly request: APIRequestContext, public readonly token: string) {}

  /** Log in with name and password and return a client authorised as that user */
  static async login(baseURL: string, name: string, password: string) {
    const anonymous = await request.newContext({ baseURL })
    const res = await anonymous.post('/api/auth/login', { data: { name, password } })
    if (!res.ok()) {
      const body = await res.text()
      await anonymous.dispose()
      throw new ApiError('POST', '/api/auth/login', res.status(), body)
    }
    const { token, user } = await res.json()
    await anonymous.dispose()
    const ctx = await request.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: `Bearer ${token}` },
    })
    return { api: new AyonApi(ctx, token), token: token as string, user }
  }

  async dispose() {
    await this.request.dispose()
  }

  // ---------------------------------------------------------------------------
  // generic helpers
  // ---------------------------------------------------------------------------

  private async check(method: string, url: string, res: APIResponse) {
    if (!res.ok()) throw new ApiError(method, url, res.status(), await res.text())
    const text = await res.text()
    return text ? JSON.parse(text) : null
  }

  async get<T = any>(url: string, params?: Record<string, string | number | boolean>): Promise<T> {
    return this.check('GET', url, await this.request.get(url, { params }))
  }
  async post<T = any>(url: string, data?: unknown): Promise<T> {
    return this.check('POST', url, await this.request.post(url, { data }))
  }
  async put<T = any>(url: string, data?: unknown): Promise<T> {
    return this.check('PUT', url, await this.request.put(url, { data }))
  }
  async patch<T = any>(url: string, data?: unknown): Promise<T> {
    return this.check('PATCH', url, await this.request.patch(url, { data }))
  }
  async delete<T = any>(url: string): Promise<T> {
    return this.check('DELETE', url, await this.request.delete(url))
  }

  async graphql<T = any>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const res = await this.post('/graphql', { query, variables })
    if (res.errors?.length) throw new Error(`GraphQL error: ${JSON.stringify(res.errors)}`)
    return res.data
  }

  // ---------------------------------------------------------------------------
  // projects
  // ---------------------------------------------------------------------------

  /** Creates a project from the default anatomy preset and returns its name */
  async createProject(options: { name?: string; code?: string; library?: boolean } = {}) {
    const name = options.name ?? uniqueName('project')
    const code = options.code ?? `e2e${Math.random().toString(36).slice(2, 9)}`
    await this.post('/api/projects', { name, code, library: !!options.library })
    // FLAG (backend race, fixed in ynput/ayon-backend#1173): while other tests create and delete
    // projects, the server's cached project list can miss a just-created project ("Project ... not
    // found" on every request to it). Wait until the project resolves before a test uses it.
    await expect.poll(() => this.projectExists(name), { timeout: 30_000 }).toBe(true)
    return name
  }

  async getProject(name: string) {
    return this.get(`/api/projects/${name}`)
  }

  async projectExists(name: string) {
    const res = await this.request.get(`/api/projects/${name}`)
    return res.ok()
  }

  async deleteProject(name: string) {
    for (let attempt = 1; ; attempt++) {
      const res = await this.request.delete(`/api/projects/${name}`, { timeout: 60_000 })
      // already gone (e.g. the test deleted it through the UI) is fine
      if (res.ok() || res.status() === 404) return
      const body = await res.text()
      // FLAG (backend): dropping project schemas concurrently can deadlock in postgres
      if (attempt < 3 && body.includes('deadlock')) continue
      throw new ApiError('DELETE', `/api/projects/${name}`, res.status(), body)
    }
  }

  async listProjects(): Promise<{ name: string; active: boolean }[]> {
    const res = await this.get('/api/projects', { length: 1000 })
    return res.projects
  }

  /**
   * The anatomy of a project as the project anatomy editor shows it (snake_case sections:
   * `statuses`, `task_types`, `folder_types`, `tags`, `link_types`, `attributes`, `templates`, ...).
   * `getProject` returns the same data in camelCase.
   */
  async getProjectAnatomy(project: string): Promise<Record<string, any>> {
    return this.get(`/api/projects/${project}/anatomy`)
  }

  /**
   * Changes the anatomy of a project (only ever one the test created), the way "Save changes" on
   * the project anatomy page does, e.g. to add a status:
   * `updateProjectAnatomy(project, (a) => ({ ...a, statuses: [...a.statuses, { name: 'Waiting' }] }))`
   */
  async updateProjectAnatomy(
    project: string,
    update: (anatomy: Record<string, any>) => Record<string, any>,
  ) {
    const anatomy = await this.getProjectAnatomy(project)
    await this.post(`/api/projects/${project}/anatomy`, update(anatomy))
  }

  // ---------------------------------------------------------------------------
  // folders, tasks, products, versions
  // ---------------------------------------------------------------------------

  async createFolder(
    project: string,
    data: {
      name?: string
      folderType?: string
      parentId?: string | null
      [key: string]: unknown
    } = {},
  ): Promise<Folder> {
    const payload = {
      folderType: 'Folder',
      ...data,
      name: data.name ?? uniqueName('folder'),
    }
    const { id } = await this.post(`/api/projects/${project}/folders`, payload)
    return { id, name: payload.name, folderType: payload.folderType, parentId: data.parentId }
  }

  async getFolder(project: string, id: string) {
    return this.get(`/api/projects/${project}/folders/${id}`)
  }

  async updateFolder(project: string, id: string, data: Record<string, unknown>) {
    return this.patch(`/api/projects/${project}/folders/${id}`, data)
  }

  async listFolders(project: string): Promise<any[]> {
    const res = await this.get(`/api/projects/${project}/folders`, { attrib: false })
    return res.folders
  }

  async createTask(
    project: string,
    data: {
      folderId: string
      name?: string
      taskType?: string
      assignees?: string[]
      [key: string]: unknown
    },
  ): Promise<Task> {
    const payload = {
      taskType: 'Generic',
      ...data,
      name: data.name ?? uniqueName('task'),
    }
    const { id } = await this.post(`/api/projects/${project}/tasks`, payload)
    return { id, name: payload.name, taskType: payload.taskType, folderId: data.folderId }
  }

  async getTask(project: string, id: string) {
    return this.get(`/api/projects/${project}/tasks/${id}`)
  }

  async updateTask(project: string, id: string, data: Record<string, unknown>) {
    return this.patch(`/api/projects/${project}/tasks/${id}`, data)
  }

  /** Tasks inside one folder, via GraphQL because REST has no list endpoint */
  async listTasks(project: string, folderId: string): Promise<any[]> {
    const data = await this.graphql(
      `query Tasks($project: String!, $folderIds: [String!]) {
        project(name: $project) {
          tasks(folderIds: $folderIds, first: 500) { edges { node { id name label taskType status assignees active } } }
        }
      }`,
      { project, folderIds: [folderId] },
    )
    return data.project.tasks.edges.map((e: any) => e.node)
  }

  async createProduct(
    project: string,
    data: { folderId: string; name?: string; productType?: string },
  ): Promise<Product> {
    const payload = { productType: 'render', ...data, name: data.name ?? uniqueName('product') }
    const { id } = await this.post(`/api/projects/${project}/products`, payload)
    return { id, name: payload.name, productType: payload.productType, folderId: data.folderId }
  }

  async createVersion(
    project: string,
    data: { productId: string; version?: number; taskId?: string; [key: string]: unknown },
  ): Promise<Version> {
    const payload = { version: 1, ...data }
    const { id } = await this.post(`/api/projects/${project}/versions`, payload)
    return { id, version: payload.version, productId: data.productId, taskId: data.taskId }
  }

  async getVersion(project: string, id: string) {
    return this.get(`/api/projects/${project}/versions/${id}`)
  }

  /**
   * A representation (published files) of a version, listed in the "Version files" tab of the
   * details panel. File paths may use root templates like `{root[work]}/...`; nothing is stored.
   */
  async createRepresentation(
    project: string,
    data: { versionId: string; name: string; files: string[] },
  ) {
    const { id } = await this.post(`/api/projects/${project}/representations`, {
      versionId: data.versionId,
      name: data.name,
      files: data.files.map((path, i) => ({ id: `${i}`.padStart(32, '0'), path, size: 0 })),
    })
    return id as string
  }

  /** A workfile of a task; `path` may use root templates like `{root[work]}/...` */
  async createWorkfile(project: string, data: { taskId: string; path: string }) {
    const { id } = await this.post(`/api/projects/${project}/workfiles`, data)
    return id as string
  }

  async workfileExists(project: string, id: string) {
    const res = await this.request.get(`/api/projects/${project}/workfiles/${id}`)
    return res.ok()
  }

  // ---------------------------------------------------------------------------
  // reviewables (media files of a version, shown in the viewer)
  // ---------------------------------------------------------------------------

  /**
   * Uploads a local file (e.g. from `tests/e2e/media`) as a reviewable of a version.
   * The server probes it with ffprobe and rejects files it cannot read. The file is stored with
   * the project; deleting the project moves it to `<project>.<timestamp>.trash` in the server's
   * project storage.
   */
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

  /** Reviewables of a version, in the order the viewer lists them, with their availability */
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
  ) {
    const { id } = await this.post(
      `/api/projects/${project}/${entityType}s/${entityId}/activities`,
      { activityType: 'comment', body },
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
            edges { node { activityId activityType body reactions { reaction userName } } }
          }
        }
      }`,
      { project, entityIds: [entityId], types: activityTypes },
    )
    return data.project.activities.edges.map((e: any) => e.node)
  }

  // ---------------------------------------------------------------------------
  // activity feed in depth: attachments, references, watchers
  // ---------------------------------------------------------------------------

  /**
   * Uploads a local file to the project the way the comment box does (a comment attachment) and
   * returns its id. It belongs to no comment until one is created or updated with it.
   */
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

  /** A comment with attachments (file ids from `uploadProjectFile`) */
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

  /**
   * Activities in the feed of an entity, newest first: its own (`referenceType` "origin") and those
   * of other entities that mention it ("mention") or are related to it ("relation", e.g. comments on
   * the tasks of a folder). This is what the details panel feed shows.
   */
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

  /** User names watching an entity (notified of everything that happens to it) */
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

  /**
   * One list through REST, with its items in list order (by `position`).
   * `access` maps `__everyone__`, `user:<name>`, `group:<name>` and `team:<name>` to an access
   * level (0 none, 10 viewer, 20 editor, 30 admin); an empty `access` means everyone is an admin.
   */
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

  /** Patch a list, e.g. `{ access: { __everyone__: 0, 'user:jane': 10 } }` or `{ active: false }` */
  async updateEntityList(project: string, listId: string, data: Record<string, unknown>) {
    await this.patch(`/api/projects/${project}/lists/${listId}`, data)
  }

  /** Custom attributes of one list (shown as extra columns of its items) */
  async getEntityListAttributes(
    project: string,
    listId: string,
  ): Promise<{ name: string; data: Record<string, any> }[]> {
    return this.get(`/api/projects/${project}/lists/${listId}/attributes`)
  }

  /** Replace the custom attributes of one list, e.g. `[{ name: 'note', data: { type: 'string', title: 'Note' } }]` */
  async setEntityListAttributes(
    project: string,
    listId: string,
    attributes: { name: string; data: Record<string, any> }[],
  ) {
    await this.put(`/api/projects/${project}/lists/${listId}/attributes`, attributes)
  }

  /** List folders group lists on the lists page (a powerpack feature) */
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

  // ---------------------------------------------------------------------------
  // views (columns, grouping and filters of a page; per user and project)
  // ---------------------------------------------------------------------------

  /**
   * Settings of the working view (what the page currently shows) of the user this client is
   * logged in as, or null while the user has not changed anything in that project.
   */
  async getWorkingViewSettings(viewType: string, project: string): Promise<any | null> {
    const url = `/api/views/${viewType}/working`
    const res = await this.request.get(url, { params: { project_name: project } })
    if (res.status() === 404) return null
    const view = await this.check('GET', url, res)
    return view.settings
  }

  /**
   * Makes the working view of a page in a project show only these columns, in this order.
   * The view belongs to the user this client is logged in as and is dropped with the project.
   */
  async setWorkingViewColumns(viewType: string, project: string, columns: string[]) {
    await this.post(`/api/views/${viewType}?project_name=${project}`, {
      label: 'Working',
      working: true,
      settings: { columns: columns.map((name) => ({ name, visible: true })) },
    })
  }

  /**
   * Replaces the settings of the working view of a page in a project, e.g. to start a test with a
   * filter applied: `{ filter: { operator: 'and', conditions: [{ key: 'task_status', value: ['Approved'], operator: 'in' }] } }`.
   * The view belongs to the user this client is logged in as and is dropped with the project.
   */
  async setWorkingViewSettings(viewType: string, project: string, settings: Record<string, any>) {
    await this.post(`/api/views/${viewType}?project_name=${project}`, {
      label: 'Working',
      working: true,
      settings,
    })
  }

  // ---------------------------------------------------------------------------
  // inbox (of the user this client is logged in as)
  // ---------------------------------------------------------------------------

  /**
   * Inbox messages, newest first. `important` splits the "Important" and "Other" tabs,
   * `active: false` lists cleared messages. Leave a filter out to not filter on it.
   * FLAG (backend): a manager's or admin's inbox reads every project, use a regular user.
   */
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

  /** Members of one team with their roles and leader flag, or undefined if the team does not exist */
  async getTeamMembers(
    project: string,
    team: string,
  ): Promise<{ name: string; leader: boolean; roles: string[] }[] | undefined> {
    const teams: { name: string; members: { name: string; leader: boolean; roles: string[] }[] }[] =
      await this.get(`/api/projects/${project}/teams`, { show_members: true })
    return teams.find((t) => t.name === team)?.members
  }

  // ---------------------------------------------------------------------------
  // access groups (studio level, project "_")
  // ---------------------------------------------------------------------------

  async createAccessGroup(name: string, permissions: Record<string, unknown> = {}) {
    await this.put(`/api/accessGroups/${name}/_`, permissions)
  }

  async listAccessGroupNames(): Promise<string[]> {
    const groups = await this.get('/api/accessGroups/_')
    return groups.map((g: any) => g.name)
  }

  async deleteAccessGroup(name: string) {
    const res = await this.request.delete(`/api/accessGroups/${name}/_`)
    if (!res.ok() && res.status() !== 404) {
      throw new ApiError('DELETE', `/api/accessGroups/${name}/_`, res.status(), await res.text())
    }
  }

  /** Studio level permissions of an access group, e.g. `{ create: { enabled, access_list }, ... }` */
  async getAccessGroup(name: string): Promise<Record<string, any>> {
    return this.get(`/api/accessGroups/${name}/_`)
  }

  // ---------------------------------------------------------------------------
  // users
  // ---------------------------------------------------------------------------

  async createUser(
    options: {
      name?: string
      password?: string
      fullName?: string
      email?: string
      isAdmin?: boolean
      isManager?: boolean
      accessGroups?: Record<string, string[]>
      /** take a seat from the first valid license pool; unlicensed users can't be assigned to tasks */
      licensed?: boolean
    } = {},
  ) {
    const name = options.name ?? uniqueName('user')
    const password = options.password ?? `pw_${randomBytes(12).toString('hex')}A1!`
    const userPool = options.licensed ? await this.getValidUserPool() : undefined
    await this.put(`/api/users/${name}`, {
      attrib: { fullName: options.fullName ?? name, email: options.email ?? `${name}@e2e.test` },
      data: {
        isAdmin: !!options.isAdmin,
        isManager: !!options.isManager,
        accessGroups: options.accessGroups ?? {},
        ...(userPool ? { userPool } : {}),
      },
      password,
      active: true,
    })
    return { name, password }
  }

  /** id of a license pool with free seats, or undefined on servers without licensing */
  async getValidUserPool(): Promise<string | undefined> {
    const pools: { id: string; valid: boolean; max: number; used: number }[] = await this.get(
      '/api/auth/pools',
    )
    return pools.find((p) => p.valid && p.used < p.max)?.id
  }

  async getUser(name: string) {
    return this.get(`/api/users/${name}`)
  }

  async userExists(name: string) {
    const res = await this.request.get(`/api/users/${name}`)
    return res.ok()
  }

  async deleteUser(name: string) {
    const res = await this.request.delete(`/api/users/${name}`)
    if (!res.ok() && res.status() !== 404) {
      throw new ApiError('DELETE', `/api/users/${name}`, res.status(), await res.text())
    }
  }

  async listUserNames(): Promise<string[]> {
    const data = await this.graphql(`{ users(first: 2000) { edges { node { name } } } }`)
    return data.users.edges.map((e: any) => e.node.name)
  }

  // ---------------------------------------------------------------------------
  // secrets (studio wide, always use uniqueName and delete them again)
  // ---------------------------------------------------------------------------

  async setSecret(name: string, value: string) {
    await this.put(`/api/secrets/${name}`, { name, value })
  }

  /** The stored value, or undefined if there is no such secret */
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

  // ---------------------------------------------------------------------------
  // anatomy presets (studio wide, always use uniqueName and never make them primary)
  // ---------------------------------------------------------------------------

  /** Stores the built-in default anatomy as a preset */
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
