import type { SuggestResponse } from '@shared/api/generated'

export const MOCK_SUGGESTIONS: SuggestResponse = {
  users: [
    { name: 'luke', fullName: 'Luke Inderwick', relevance: 10 },
    { name: 'tom', fullName: 'Tom Bailey', relevance: 8 },
    { name: 'monica.miles', fullName: 'Monica Miles', relevance: 5 },
    { name: 'paul.brooks', fullName: 'Paul Brooks', relevance: 4 },
    { name: 'ronja.hakala', fullName: 'Ronja Hakala', relevance: 2 },
    { name: 'sara.vincent', fullName: 'Sara Vincent', relevance: 1 },
  ],
  teams: [
    { name: 'Compositing', relevance: 3 },
    { name: 'Sons of thunder', relevance: 2 },
  ],
  versions: [
    {
      id: 'a1b2c3d4e5f600000000000000000001',
      name: 'v004',
      version: 4,
      createdAt: new Date().toISOString(),
      relevance: 5,
      parent: { name: 'renderFxSmoke', productType: 'render' },
    },
    {
      id: 'a1b2c3d4e5f600000000000000000002',
      name: 'v003',
      version: 3,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      relevance: 4,
      parent: { name: 'renderFxSmoke', productType: 'render' },
    },
    {
      id: 'a1b2c3d4e5f600000000000000000003',
      name: 'v012',
      version: 12,
      createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
      relevance: 2,
      parent: { name: 'animationChar2', productType: 'animation' },
    },
  ],
  tasks: [
    {
      id: 'b1b2c3d4e5f600000000000000000001',
      name: 'compositing',
      label: 'Compositing',
      taskType: 'Compositing',
      relevance: 6,
      parent: { name: 'sh160', label: 'sh160', folderType: 'Shot' },
    },
    {
      id: 'b1b2c3d4e5f600000000000000000002',
      name: 'lighting',
      label: 'Lighting',
      taskType: 'Lighting',
      relevance: 5,
      parent: { name: 'sh160', label: 'sh160', folderType: 'Shot' },
    },
    {
      id: 'b1b2c3d4e5f600000000000000000003',
      name: 'animation',
      label: 'Animation',
      taskType: 'Animation',
      relevance: 3,
      parent: { name: 'sh050', label: 'sh050', folderType: 'Shot' },
    },
  ],
} as unknown as SuggestResponse

export const SAMPLES: { id: string; label: string; markdown: string }[] = [
  {
    id: 'everything',
    label: 'Everything',
    markdown: `## Review notes

Hey [Tom Bailey](user:tom), the smoke on [v004](version:a1b2c3d4e5f600000000000000000001) looks **much** better. Can [Sons of thunder](team:Sons%20of%20thunder) take a look?

Things to fix in [Compositing](task:b1b2c3d4e5f600000000000000000001):

- [ ] Grain is too *strong* in the last 20 frames
- [x] Fix the edge on the ~~left~~ right side
- [ ] Check \`OCIO_CONFIG\` points to the \`aces_1.3\` config

1. Render with \`--threads 16\`
2. Publish as a new version

> The client wants the smoke thinner.\\
> Keep the timing.

\`\`\`python
import ayon_api

version = ayon_api.get_version_by_id("demo_Commercial", "a1b2")
print(version["name"])
\`\`\`

More info at https://ayon.ynput.io and in the [docs](https://docs.ayon.dev).`,
  },
  {
    id: 'legacy',
    label: 'Legacy quill comment',
    markdown: `Hi [Luke Inderwick](user:luke)

&nbsp;

Please check [v003](version:a1b2c3d4e5f600000000000000000002) and let me know.

&nbsp;

&nbsp;

* [x] first thing

* [ ] second thing

<u>underlined</u> text and a \\\\server\\share path`,
  },
  {
    id: 'code',
    label: 'Code',
    markdown: `Inline code: \`ayon_api.get_project()\`, \`\`a \`tick\` inside\`\` and **\`bold code\`**.

\`\`\`
no language
  indented line
\`\`\`

\`\`\`json
{ "name": "sh010", "frameStart": 1001 }
\`\`\``,
  },
  { id: 'empty', label: 'Empty', markdown: '' },
]

export const MOCK_PROJECT = {
  productTypes: [
    { name: 'render', icon: 'photo_library', color: '#8fb8ff' },
    { name: 'animation', icon: 'directions_run', color: '#ffb86b' },
  ],
}

export const MOCK_TASK_TYPES = [
  { name: 'Compositing', icon: 'layers', color: '#ab7df8' },
  { name: 'Lighting', icon: 'highlight', color: '#ffe083' },
  { name: 'Animation', icon: 'directions_run', color: '#8dff9e' },
]

export const SEED_MESSAGES = [
  {
    id: 'seed-1',
    author: 'Tom Bailey',
    markdown: `Morning! New smoke pass is up on [v004](version:a1b2c3d4e5f600000000000000000001)`,
  },
  {
    id: 'seed-2',
    author: 'Monica Miles',
    markdown: `Looks good, two notes:
- [ ] grain is a bit strong
- [ ] check \`OCIO_CONFIG\`

[Luke Inderwick](user:luke) can you take the second one?`,
  },
]
