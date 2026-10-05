import { expect, Page, WebSocket } from '@playwright/test'
import { AyonApi } from '../support/api'

/**
 * How long a live update may take to show without a reload.
 * Production builds collect realtime events for up to 10 s before applying them
 * (`REALTIME_UPDATE_DEBOUNCE` in shared/src/util/realtimeUpdatesUtils.ts), then wait up to 1 s of
 * jitter before refetching. Nothing in the app polls or refetches on focus, so a page that only
 * updates on reload never shows the change within this time.
 */
export const LIVE_UPDATE = { timeout: 30_000 }

type Subscription = { topics: string[]; project: string | null }

/**
 * Follows what a page's websockets subscribed to, from the `auth` messages the app sends
 * (shared/src/context/websocket/WebsocketContext.tsx). Create it before the page navigates.
 *
 * The app only tells the server which topics it wants once a query that listens to them has
 * loaded, and the server only forwards events a client subscribed to. A change made before that
 * would never reach the page, so wait for `expectSubscribed` before making it.
 */
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

  /** Whether the server forwards an event to this page (rules of ayon_server/api/messaging.py) */
  private receives(topic: string, project: string) {
    for (const subscription of this.sockets.values()) {
      // clients on a project page only get that project's events, inbox messages excepted
      if (subscription.project && subscription.project !== project && topic !== 'inbox.message') {
        continue
      }
      if (subscription.topics.some((t) => t === '*' || topic.startsWith(t))) return true
    }
    return false
  }

  /** Wait until the server forwards events like `topic` (e.g. `entity.task.status_changed`) */
  async expectSubscribed(topic: string, project: string) {
    await expect
      .poll(() => this.receives(topic, project), {
        message: `the page subscribes to ${topic} events of ${project}`,
      })
      .toBe(true)
  }
}

// -----------------------------------------------------------------------------
// changes made "elsewhere", through the REST API
// -----------------------------------------------------------------------------

export const deleteFolder = (api: AyonApi, project: string, id: string) =>
  api.delete(`/api/projects/${project}/folders/${id}`)

export const deleteTask = (api: AyonApi, project: string, id: string) =>
  api.delete(`/api/projects/${project}/tasks/${id}`)

export const editComment = (api: AyonApi, project: string, activityId: string, body: string) =>
  api.patch(`/api/projects/${project}/activities/${activityId}`, { body })

export const deleteComment = (api: AyonApi, project: string, activityId: string) =>
  api.delete(`/api/projects/${project}/activities/${activityId}`)

/** `reaction` is the stored name, e.g. `thumb_up` for 👍 */
export const addReaction = (api: AyonApi, project: string, activityId: string, reaction: string) =>
  api.post(`/api/projects/${project}/activities/${activityId}/reactions`, { reaction })
