import { APIRequestContext, APIResponse, request } from '@playwright/test'
import { randomBytes } from 'crypto'
import { uniqueName } from './names'

/**
 * Thin REST client used to set up and clean up test data.
 * Tests should only use the UI for the behaviour they are testing; everything around it goes through here.
 */

export type Folder = { id: string; name: string; folderType: string; parentId?: string | null }
export type Task = { id: string; name: string; taskType: string; folderId: string }
export type Product = { id: string; name: string; productType: string; folderId: string }
export type Version = { id: string; version: number; productId: string; taskId?: string | null }

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
}
