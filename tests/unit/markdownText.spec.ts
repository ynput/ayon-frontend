import { expect, test } from '@playwright/test'
import { markdownToPlainText } from '../../shared/src/components/MarkdownEditor/markdown/plainText'
import {
  getInlineMediaFileIds,
  getMediaKind,
  getProjectFileId,
  isMediaFile,
} from '../../shared/src/components/MarkdownEditor/media/mediaUtils'

test.describe('markdownToPlainText', () => {
  const expectPlain = (cases: [string, string][]) => {
    for (const [markdown, plain] of cases) {
      expect.soft(markdownToPlainText(markdown), JSON.stringify(markdown)).toBe(plain)
    }
  }

  test('mentions, links and media blocks become their label', () => {
    expectPlain([
      [
        '[Sons of thunder](team:Sons%20of%20thunder) and [@Ann](@user:ann)',
        'Sons of thunder and @Ann',
      ],
      ['see [the docs](https://ayon.app)', 'see the docs'],
      ['![clip.mp4](/api/projects/p/files/f1 "video/mp4")', 'clip.mp4'],
    ])
  })

  test('heading, quote, list and check list markers are removed', () => {
    expectPlain([
      [
        '## Notes\n> quoted\n* [ ] todo\n* [x] done\n- bullet\n1. first\n2) second',
        'Notes quoted todo done bullet first second',
      ],
    ])
  })

  test('inline formatting is removed, snake_case words and arithmetic are kept', () => {
    expectPlain([
      ['**bold** __strong__ *em* _it_ ~~gone~~ `code`', 'bold strong em it gone code'],
      ['set my\\_var\\_name please', 'set my_var_name please'],
      ['2 \\* 3 \\* 4', '2 * 3 * 4'],
    ])
  })

  test('line breaks, blank lines and code fences collapse into one line', () => {
    expectPlain([
      ['one\\\ntwo\r\nthree\n\nfour', 'one two three four'],
      ['```ts\nconst a = 1\n```', 'const a = 1'],
    ])
  })

  test('escaped characters are unescaped', () => {
    expectPlain([
      ['1\\. item', '1. item'],
      ['\\# not a heading', '# not a heading'],
      ['C:\\\\temp', 'C:\\temp'],
    ])
  })

  test('legacy html is removed and autolinks keep their url', () => {
    expectPlain([
      ['<p><u>under</u>&nbsp;line</p>', 'under line'],
      ['see <https://ayon.app/docs>', 'see https://ayon.app/docs'],
      ['', ''],
    ])
  })

  test('never leaves angle brackets that could form a tag', () => {
    for (const markdown of [
      '<scr<script>ipt>alert(1)</script>',
      '<img src=x onerror=alert(1)',
      'a <b> c',
    ]) {
      expect.soft(markdownToPlainText(markdown), markdown).not.toMatch(/[<>]/)
    }
  })

  // FLAG: emphasis rules run before unescaping, so `\*not bold\*` becomes `\not bold\`. plainText.ts:26-27
  // fixed in ynput/ayon-frontend#2410, switch back to test() once it is merged
  test.fixme('escaped emphasis markers stay as literal characters', () => {
    expectPlain([
      ['\\*not bold\\*', '*not bold*'],
      ['call \\_init\\_ first', 'call _init_ first'],
    ])
  })

  // FLAG: a link url with (escaped) parentheses ends at the first `)`. plainText.ts:11
  // fixed in ynput/ayon-frontend#2410, switch back to test() once it is merged
  test.fixme('a link whose url contains parentheses becomes its label', () => {
    expectPlain([['[Foo](https://en.wikipedia.org/wiki/Foo_\\(bar\\)) text', 'Foo text']])
  })
})

test.describe('media in markdown', () => {
  test('the media kind comes from the mime type, else from the extension of a name', () => {
    expect(getMediaKind('video/mp4')).toBe('video')
    expect(getMediaKind('image/png', 'clip.mp4')).toBe('image')
    expect(getMediaKind(null, 'clip.MOV')).toBe('video')
    expect(getMediaKind('', '/api/projects/p/files/f1?token=1#t', 'Clip.WebM?x')).toBe('video')
    expect(getMediaKind('application/octet-stream', 'render.exr')).toBe('image')
    expect(getMediaKind(undefined)).toBe('image')
  })

  test('media files are recognised by type or by extension', () => {
    expect(isMediaFile(new File([], 'a.bin', { type: 'image/png' }))).toBe(true)
    expect(isMediaFile(new File([], 'CLIP.MKV'))).toBe(true)
    expect(isMediaFile(new File([], 'notes.pdf', { type: 'application/pdf' }))).toBe(false)
    expect(isMediaFile(new File([], 'archive'))).toBe(false)
  })

  test('the project file id is read from relative and absolute file urls', () => {
    expect(getProjectFileId('/api/projects/demo/files/abc-123')).toBe('abc-123')
    expect(getProjectFileId('https://ayon.example/api/projects/my_proj/files/f0e1?x=1')).toBe(
      'f0e1',
    )
    expect(getProjectFileId('/api/projects/demo/thumbnails/abc')).toBeNull()
    expect(getProjectFileId(null)).toBeNull()
    expect(getProjectFileId(undefined)).toBeNull()
  })

  test('only standalone media lines outside code blocks count as inline media', () => {
    const markdown = [
      '![shot.png](/api/projects/demo/files/f1 "image/png")',
      '  ![clip.mp4](</api/projects/demo/files/f2> "video/mp4")  ',
      'text with ![inline.png](/api/projects/demo/files/f3) in it',
      '[a link](/api/projects/demo/files/f4)',
      '```',
      '![in code](/api/projects/demo/files/f5)',
      '```',
      '![external](https://example.com/f6.png)',
      '![shot again](/api/projects/demo/files/f1)',
    ].join('\n')
    expect([...getInlineMediaFileIds(markdown)]).toEqual(['f1', 'f2'])
  })

  test('no markdown means no inline media', () => {
    expect(getInlineMediaFileIds(undefined).size).toBe(0)
    expect(getInlineMediaFileIds('').size).toBe(0)
  })
})
