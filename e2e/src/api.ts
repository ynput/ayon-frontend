import { expect, APIRequestContext, APIResponse, request, TestInfo } from '@playwright/test'
import { randomBytes } from 'crypto'
import { addonDev } from './env'
import { uniqueName } from './names'

/**
 * Thin REST client used to set up and check test data.
 * Tests use the UI only for the behaviour they are testing; everything around it goes through here.
 * A suite extends it with the endpoints of its own area (`class Api extends AyonApi`).
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

/** a client class: AyonApi or a suite's subclass of it */
export type ApiClass<T extends AyonApi> = new (request: APIRequestContext, token: string) => T

// in a test, a new request context inherits the signed-in browser's `accessToken` cookie, which the
// server prefers over the Bearer token: clients start without one
const NO_SESSION = { cookies: [], origins: [] }

/** Log in with name and password and return a client of class `Client` authorised as that user */
export const login = async <T extends AyonApi>(
  Client: ApiClass<T>,
  baseURL: string,
  name: string,
  password: string,
) => {
  const anonymous = await request.newContext({ baseURL, storageState: NO_SESSION })
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
    storageState: NO_SESSION,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  })
  return { api: new Client(ctx, token), token: token as string, user }
}

/** A REST client acting as another user, e.g. one the test created. Dispose it when done. */
export const apiAs = async <T extends AyonApi = AyonApi>(
  testInfo: TestInfo,
  name: string,
  password: string,
  Client: ApiClass<T> = AyonApi as unknown as ApiClass<T>,
) => (await login(Client, testInfo.project.use.baseURL!, name, password)).api

export class AyonApi {
  constructor(public readonly request: APIRequestContext, public readonly token: string) {}

  /** Log in with name and password and return a client (of this class) authorised as that user */
  static async login<T extends AyonApi>(this: ApiClass<T>, baseURL: string, name: string, password: string) {
    return login(this, baseURL, name, password)
  }

  async dispose() {
    await this.request.dispose()
  }

  // ---------------------------------------------------------------------------
  // generic helpers
  // ---------------------------------------------------------------------------

  protected async check(method: string, url: string, res: APIResponse) {
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

  /** the status of a request that may fail, for tests of what the server refuses */
  async status(method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE', url: string, data?: unknown) {
    const res = await this.request.fetch(url, { method, data })
    return res.status()
  }

  async graphql<T = any>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
    const res = await this.post('/graphql', { query, variables })
    if (res.errors?.length) throw new Error(`GraphQL error: ${JSON.stringify(res.errors)}`)
    return res.data
  }

  /** for features that come from an addon's frontend modules */
  async hasAddon(name: string): Promise<boolean> {
    const { addons } = await this.get('/api/addons')
    return addons.some((a: any) => a.name === name && a.productionVersion)
  }

  /** whether this version of the addon (its server code) is installed, active or not */
  async hasAddonVersion(name: string, version: string): Promise<boolean> {
    const { addons } = await this.get('/api/addons')
    return addons.some((a: any) => a.name === name && version in (a.versions ?? {}))
  }

  // ---------------------------------------------------------------------------
  // projects
  // ---------------------------------------------------------------------------

  /** Creates a project from the default anatomy preset and returns its name */
  async createProject(options: { name?: string; code?: string; library?: boolean } = {}) {
    const name = options.name ?? uniqueName('project')
    const code = options.code ?? `e2e${Math.random().toString(36).slice(2, 9)}`
    await this.post('/api/projects', { name, code, library: !!options.library })
    // FLAG (backend race, fixed in ynput/ayon-backend#1173): the cached project list can miss a new project
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
  // access groups (studio level, project "_")
  // ---------------------------------------------------------------------------

  async createAccessGroup(name: string, permissions: Record<string, unknown> = {}) {
    await this.put(`/api/accessGroups/${name}/_`, permissions)
  }

  async listAccessGroupNames(): Promise<string[]> {
    const groups: { name: string }[] = await this.get('/api/accessGroups/_')
    return groups.map((g) => g.name)
  }

  async deleteAccessGroup(name: string) {
    for (let attempt = 1; ; attempt++) {
      const res = await this.request.delete(`/api/accessGroups/${name}/_`)
      if (res.ok() || res.status() === 404) return
      const body = await res.text()
      // FLAG (backend): it touches every project's tables, so it can deadlock with a project
      // dropped by another worker
      if (attempt < 3 && body.includes('deadlock')) continue
      throw new ApiError('DELETE', `/api/accessGroups/${name}/_`, res.status(), body)
    }
  }

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
      /** lets AYON load an addon from its dev server; on by default in an addon's suite */
      developerMode?: boolean
    } = {},
  ) {
    const name = options.name ?? uniqueName('user')
    const password = options.password ?? `pw_${randomBytes(12).toString('hex')}A1!`
    const userPool = options.licensed ? await this.getValidUserPool() : undefined
    const developerMode = options.developerMode ?? !!addonDev()
    await this.put(`/api/users/${name}`, {
      attrib: {
        fullName: options.fullName ?? name,
        email: options.email ?? `${name}@e2e.test`,
        ...(developerMode ? { developerMode } : {}),
      },
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
