import { expect, test } from '@playwright/test'
import { getLinkLabel } from '../../shared/src/components/MarkdownEditor/links/getLinkLabel'
import {
  ACTIVITY_LINK_LABEL,
  parseActivityLink,
} from '../../shared/src/components/MarkdownEditor/links/activityLinks'
import {
  getYouTubeEmbedUrl,
  parseYouTubeUrl,
} from '../../shared/src/components/MarkdownEditor/youtube/parseYouTubeUrl'

test.describe('link labels', () => {
  test('known sites get a short label made only from the url', () => {
    const labels: [string, string][] = [
      ['https://github.com/ynput/ayon-frontend/issues/2342', 'ayon-frontend #2342'],
      ['https://github.com/ynput/ayon-frontend/pull/2399/files', 'ayon-frontend #2399'],
      ['https://GitHub.com/ynput/ayon-frontend', 'ynput/ayon-frontend'],
      ['https://github.com/ynput', 'ynput'],
      ['https://github.com/ynput/ayon-frontend/issues', 'ayon-frontend issues'],
      ['https://github.com/ynput/ayon-frontend/commit/abcdef1234567890', 'ayon-frontend@abcdef1'],
      [
        'https://github.com/ynput/ayon-frontend/blob/main/src/App.tsx#L10-L20',
        'ayon-frontend/App.tsx:10-20',
      ],
      ['https://github.com/ynput/ayon-frontend/tree/develop', 'ayon-frontend@develop'],
      ['https://github.com/ynput/ayon-frontend/releases/tag/1.2.3', 'ayon-frontend 1.2.3'],
      ['https://github.com/o/r/wiki/%5BDraft%5D-Plan', 'r wiki: Draft Plan'],
      ['https://gitlab.com/group/sub/project/-/merge_requests/12', 'project !12'],
      ['https://gitlab.studio.local/pipeline/tools/-/issues/7', 'tools #7'],
      ['https://bitbucket.org/ws/repo/pull-requests/5', 'repo #5'],
      ['https://acme.atlassian.net/browse/PIPE-42', 'PIPE-42'],
      [
        'https://acme.atlassian.net/jira/software/projects/PIPE/boards/1?selectedIssue=PIPE-7',
        'PIPE-7',
      ],
      [
        'https://acme.atlassian.net/wiki/spaces/PIPE/pages/123/Release+Checklist',
        'Release Checklist',
      ],
      ['https://linear.app/ynput/issue/AY-12/fix-the-column-resize', 'AY-12 Fix the column resize'],
      [
        'https://www.notion.so/ynput/Release-Notes-0123456789abcdef0123456789abcdef',
        'Release Notes',
      ],
      ['https://www.figma.com/design/AbC123/My-Design-File?node-id=1-2', 'My Design File (Figma)'],
      ['https://trello.com/c/AbC/12-fix-render', 'Fix render'],
      ['https://studio.shotgrid.autodesk.com/detail/Shot/1234', 'Shot 1234'],
      ['https://studio.shotgunstudio.com/page/55#Asset_42', 'Asset 42'],
      ['https://stackoverflow.com/questions/123/how-to-x', 'How to x'],
      ['https://community.ynput.io/t/new-tray-launcher/987', 'New tray launcher'],
      ['https://docs.google.com/spreadsheets/d/abc/edit#gid=0', 'Google Sheet'],
      ['https://drive.google.com/drive/folders/xyz', 'Google Drive folder'],
      ['https://www.dropbox.com/scl/fi/abc/final%20cut.mov?rlkey=x', 'final cut.mov'],
    ]
    for (const [href, label] of labels) {
      expect.soft(getLinkLabel(href), href).toBe(label)
    }
  })

  test('urls without a known structure keep the url as their text', () => {
    for (const href of [
      'https://example.com/some/page',
      'https://github.com/settings/profile',
      'https://github.com/ynput/ayon-frontend/stargazers',
      'https://www.figma.com/files/recent',
      'ftp://github.com/ynput/ayon-frontend',
      'mailto:someone@example.com',
      'not a url',
      '',
    ]) {
      expect.soft(getLinkLabel(href), href).toBeNull()
    }
  })
})

test.describe('links to comments on this server', () => {
  const origin = 'http://localhost:3000'
  const activityId = 'a'.repeat(32)
  const entityId = 'b'.repeat(32)
  const globals = globalThis as { window?: unknown }

  // parseActivityLink compares with window.location.origin, which does not exist in node
  test.beforeAll(() => {
    globals.window = { location: { origin } }
  })
  test.afterAll(() => {
    delete globals.window
  })

  test('a copied comment link is parsed and labelled as a comment', () => {
    const href = `${origin}/projects/demo/overview?activity=${activityId}&id=${entityId}`
    expect(parseActivityLink(href)).toEqual({
      projectName: 'demo',
      activityId,
      entityId,
      isSource: false,
      url: href,
    })
    expect(getLinkLabel(href)).toBe(ACTIVITY_LINK_LABEL)
  })

  test('relative links resolve against this server and decode the project name', () => {
    expect(parseActivityLink(`/projects/my%20proj/browser?activity=${activityId}`)).toMatchObject({
      projectName: 'my proj',
      entityId: null,
      url: `${origin}/projects/my%20proj/browser?activity=${activityId}`,
    })
    expect(parseActivityLink(`/projects/bad%E0%A4%A/x?activity=${activityId}`)).toMatchObject({
      projectName: 'bad%E0%A4%A',
    })
  })

  test('links to other servers, without a project or with a bad activity id stay links', () => {
    for (const href of [
      `https://other.example/projects/demo/overview?activity=${activityId}`,
      `${origin}/settings?activity=${activityId}`,
      `${origin}/projects/demo/overview?activity=${activityId.toUpperCase()}`,
      `${origin}/projects/demo/overview?activity=123`,
      `${origin}/projects/demo/overview`,
    ]) {
      expect.soft(parseActivityLink(href), href).toBeNull()
    }
    expect(parseActivityLink(null)).toBeNull()
  })
})

test.describe('YouTube urls', () => {
  const id = 'dQw4w9WgXcQ'

  test('watch, short, embed and live urls give the video and its start time', () => {
    const videos: [string, { id: string; start?: number }][] = [
      [`https://www.youtube.com/watch?v=${id}`, { id }],
      [`  https://youtu.be/${id}?t=90  `, { id, start: 90 }],
      [`https://m.youtube.com/watch?v=${id}&t=1m30s`, { id, start: 90 }],
      [`https://music.youtube.com/watch?v=${id}&t=1h2m3s`, { id, start: 3723 }],
      [`https://youtube.com/shorts/${id}`, { id }],
      [`https://www.youtube.com/embed/${id}?start=30`, { id, start: 30 }],
      [`https://www.youtube.com/live/${id}?t=45s`, { id, start: 45 }],
      [`https://www.youtube-nocookie.com/embed/${id}`, { id }],
      [`http://youtu.be/${id}/extra?t=0`, { id }],
      [`https://youtu.be/${id}?t=soon`, { id }],
    ]
    for (const [url, video] of videos) {
      expect.soft(parseYouTubeUrl(url), url).toEqual(video)
    }
  })

  test('anything else is not a YouTube video', () => {
    for (const url of [
      `youtube.com/watch?v=${id}`,
      `https://www.youtube.com/watch?v=short`,
      `https://www.youtube.com/watch?v=${id}x`,
      'https://www.youtube.com/channel/UC1234567890',
      `https://www.youtube.com/playlist?list=${id}`,
      `https://notyoutube.com/watch?v=${id}`,
      `https://youtube.com.evil.example/watch?v=${id}`,
      `javascript:alert('${id}')`,
      'https://youtu.be/',
      `https://vimeo.com/${id}`,
    ]) {
      expect.soft(parseYouTubeUrl(url), url).toBeNull()
    }
  })

  test('embeds use the no-cookie domain and keep the start time', () => {
    expect(getYouTubeEmbedUrl({ id })).toBe(`https://www.youtube-nocookie.com/embed/${id}`)
    expect(getYouTubeEmbedUrl({ id, start: 90 })).toBe(
      `https://www.youtube-nocookie.com/embed/${id}?start=90`,
    )
  })
})
