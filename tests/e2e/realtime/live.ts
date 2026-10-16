import { expect, Locator, Page, WebSocket } from '@playwright/test'
import { AyonApi } from '../support/api'

// production builds debounce realtime events for up to 10 s (REALTIME_UPDATE_DEBOUNCE) plus 1 s jitter
export const LIVE_UPDATE = { timeout: 30_000 }

type Subscription = { topics: string[]; project: string | null }

export class LiveUpdates {
  private readonly sockets = new Map<WebSocket, Subscription>()

  constructor(readonly page: Page) {
    page.on('websocket', (ws) => {
      if (!new URL(ws.url()).pathname.endsWith('/ws')) return
      ws.on('framesent', ({ payload }) => {
        let message: any
        try {
          message = JSON.parse(String(payload))
        } catch {
          return
        }
        if (message?.topic !== 'auth') return
        this.sockets.set(ws, {
          topics: Array.isArray(message.subscribe) ? message.subscribe : [],
          project: message.project ?? null,
        })
      })
      ws.on('close', () => this.sockets.delete(ws))
    })
  }

  // mirrors the forwarding rules of ayon_server/api/messaging.py
  private receives(topic: string, project: string) {
    for (const subscription of this.sockets.values()) {
      if (subscription.project && subscription.project !== project && topic !== 'inbox.message') {
        continue
      }
      if (subscription.topics.some((t) => t === '*' || topic.startsWith(t))) return true
    }
    return false
  }

  // the app subscribes once a listening query has loaded; a change made before never reaches the page
  async expectSubscribed(topic: string, project: string) {
    await expect
      .poll(() => this.receives(topic, project), {
        message: `the page subscribes to ${topic} events of ${project}`,
      })
      .toBe(true)
  }
}

export const graphqlResponse = (page: Page, operationName: string) =>
  page.waitForResponse((response) => {
    if (new URL(response.url()).pathname !== '/graphql') return false
    try {
      return response.request().postDataJSON()?.operationName === operationName
    } catch {
      return false
    }
  })

// the toolbar's sync button; the hierarchy slicer shows a second one while new folders are pending
export const syncButton = (table: Locator) =>
  table.locator(
    'xpath=ancestor::*[.//button[@data-shortcut="Shift+R"]][1]//button[@data-shortcut="Shift+R"]',
  )

export const expectSyncHighlighted = async (button: Locator, updates: RegExp) => {
  await expect(button).toHaveClass(/has-updates/, LIVE_UPDATE)
  await expect(button).toHaveAttribute('data-tooltip', updates)
}

export const deleteFolder = (api: AyonApi, project: string, id: string) =>
  api.delete(`/api/projects/${project}/folders/${id}`)

export const deleteTask = (api: AyonApi, project: string, id: string) =>
  api.delete(`/api/projects/${project}/tasks/${id}`)

export const updateVersion = (
  api: AyonApi,
  project: string,
  id: string,
  data: Record<string, unknown>,
) => api.patch(`/api/projects/${project}/versions/${id}`, data)

export const editComment = (api: AyonApi, project: string, activityId: string, body: string) =>
  api.patch(`/api/projects/${project}/activities/${activityId}`, { body })

export const deleteComment = (api: AyonApi, project: string, activityId: string) =>
  api.delete(`/api/projects/${project}/activities/${activityId}`)

export const addReaction = (api: AyonApi, project: string, activityId: string, reaction: string) =>
  api.post(`/api/projects/${project}/activities/${activityId}/reactions`, { reaction })
