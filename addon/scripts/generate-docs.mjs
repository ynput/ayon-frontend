// Generates AGENTS.md (shipped with the package) and dist/slots.json (read by `ayon-addon slots`)
// from SlotMap in src/slots.ts, so what agents read matches the installed version.
//   node scripts/generate-docs.mjs          write both
//   node scripts/generate-docs.mjs --check  fail when AGENTS.md is out of date
/* global process, console */
import ts from 'typescript'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
const program = ts.createProgram(['src/index.ts', 'src/manifest.ts', 'src/check.ts'].map((f) => path.join(root, f)), {
  strict: true,
  skipLibCheck: true,
  jsx: ts.JsxEmit.ReactJSX,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  target: ts.ScriptTarget.ESNext,
})
const checker = program.getTypeChecker()
const slotsFile = program.getSourceFile(path.join(root, 'src/slots.ts'))

const doc = (symbol) => ts.displayPartsToString(symbol.getDocumentationComment(checker)).replace(/\s+/g, ' ').trim()
const typeText = (symbol, node) =>
  checker
    .typeToString(checker.getTypeOfSymbolAtLocation(symbol, node), undefined, ts.TypeFormatFlags.NoTruncation)
    .replace(/\s+/g, ' ')

const fields = (typeNode) => {
  const type = checker.getTypeFromTypeNode(typeNode)
  return checker.getPropertiesOfType(type).map((prop) => ({
    name: prop.getName(),
    type: typeText(prop, typeNode),
    optional: (prop.flags & ts.SymbolFlags.Optional) !== 0,
    doc: doc(prop),
  }))
}

// the runtime part (SLOTS, SLOT_DOCS) comes from the sources too, read without executing them
const slotDocs = {}
const slotDocsFile = program.getSourceFile(path.join(root, 'src/slotDocs.ts'))
ts.forEachChild(slotDocsFile, function visit(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText() === 'SLOT_DOCS') {
    for (const prop of node.initializer.properties) {
      const entry = {}
      for (const field of prop.initializer.properties) entry[field.name.getText()] = field.initializer.text
      slotDocs[prop.name.text ?? prop.name.getText()] = entry
    }
  }
  ts.forEachChild(node, visit)
})

const slots = []
ts.forEachChild(slotsFile, (node) => {
  if (!ts.isInterfaceDeclaration(node) || node.name.text !== 'SlotMap') return
  for (const member of node.members) {
    const name = member.name.text ?? member.name.getText()
    const parts = Object.fromEntries(member.type.members.map((m) => [m.name.getText(), m]))
    // through the checker, so a named pieces type (ButtonPieces<S>) works like an inline one
    const pieces = fields(parts.pieces.type).map(({ name, optional }) => ({ name, optional }))
    slots.push({
      name,
      version: Number(parts.version.type.getText()),
      description: doc(checker.getSymbolAtLocation(member.name)),
      ...slotDocs[name],
      meta: fields(parts.meta.type),
      context: [
        { name: 'slot', type: `'${name}'`, optional: false, doc: 'the slot this is rendered in' },
        ...fields(parts.context.type),
      ],
      pieces,
    })
  }
})

const cell = (text) => String(text).replace(/\\/g, '\\\\').replace(/\|/g, '\\|')
const table = (rows, header) =>
  [
    `| ${header} | Type | |`,
    '|---|---|---|',
    ...rows.map((f) => `| \`${f.name}\`${f.optional ? '' : ' (required)'} | \`${cell(f.type)}\` | ${cell(f.doc)} |`),
  ].join('\n')

const slotSections = slots
  .map(
    (s) => `### \`${s.name}\`: \`${s.helper}\`

${s.description} Loads: ${s.loads}.

${table(s.meta, 'Description field')}

${table(s.context, 'Context (props, `useSlot`)')}

Pieces: ${s.pieces.map((p) => `\`${p.name}\`${p.optional ? ' (optional)' : ''}`).join(', ')}.`,
  )
  .join('\n\n')

const agents = `<!-- Generated from src/slots.ts by scripts/generate-docs.mjs. Edit those, not this file. -->
# @ynput/ayon-addon ${pkg.version}

The API for AYON addon frontends. An addon declares what it puts into AYON's **slots** (places in the
web UI) in one manifest module; AYON reads the descriptions at startup and loads each piece of code
when its slot needs it. Everything here is AYON's own copy at runtime.

## Rules

- List \`@ynput/ayon-addon\` in the federation \`shared\` with \`import: false\` (\`ayonAddon()\` from
  \`@ynput/ayon-addon-dev\` does it). The addon then never bundles a copy.
- The manifest (\`src/manifest.ts\`, exposed as \`./manifest\`, listed as \`manifest\` in the server's
  \`frontend_modules\`) imports from \`@ynput/ayon-addon/manifest\` only:
  \`export default defineAddon({ contributes: [projectPage({ ... }), ...] })\`.
- Pieces are dynamic imports of local files: \`component: () => import('./Page')\`. Never import a
  component statically in the manifest.
- Ids: a letter, then letters, digits and \`_\`; unique within their slot. Contributions to slots this
  AYON doesn't have are skipped with a console warning; the rest of the addon works.
- A component gets its slot's context as props (\`SlotProps<'<slot>'>\`); components below it call
  \`useSlot('<slot>')\` (or a list of slots). It throws when rendered in another slot.
- Menu items have a \`run\` piece: a function that gets the context (\`SlotContext<'<slot>'>\`) on click.
- Header and toolbar items set exactly one action: \`to\` (navigate), \`run\`, \`dialog\` (AYON opens
  its dialog around your content, which gets \`close\`), \`menu\` (a function returning the items) or
  \`component\` (your own JSX instead of AYON's button). Their code gets \`navigate\` in the context.
- Globals are imports, never context: \`useUser\`, \`useNavigate\` and the other router hooks, \`Link\`,
  \`toast\`, the layout components (\`ProjectPageLayout\`, \`Slicer\`, \`StudioPageLayout\`,
  \`ProjectList\`). Data comes from \`@ynput/ayon-frontend-shared/api\` (AYON's api and cache):
  components use its hooks, \`run\` and \`menu\` pieces \`dispatch(api.endpoints.x.initiate(args))\`
  with \`dispatch\` from this package (AYON's store).
- A crash stays inside the contribution: AYON wraps each one in an error boundary (menu items: a toast).

## Picking entities: \`EntityPicker\`

AYON's entity picker (the dialog AYON uses to link, move or pick a folder, task, product, version,
...) from one component. It loads the project and its folders itself: render it anywhere (a header
item, a popover, a studio page, a details panel tab) with no providers around it.

\`\`\`tsx
import { EntityPicker, type EntityRef } from '@ynput/ayon-addon'

{picking && (
  <EntityPicker
    projectName={projectName}
    entityType="task"
    initialSelection={task ? [task] : undefined}
    onClose={() => setPicking(false)}
    onSubmit={([picked]: EntityRef[]) => {
      setPicking(false)
      setTask(picked) // { id, entityType: 'task', projectName, name, label }
    }}
  />
)}
\`\`\`

- \`entityType\`: \`folder\`, \`task\`, \`product\`, \`version\`, \`representation\` or \`workfile\`. The
  picker shows the types above it to narrow the list (folders, then tasks for \`task\`).
- \`onSubmit\` gets \`EntityRef[]\`, the same shape slot contexts use (\`name\` and \`label\` when the
  picker loaded them). One entity unless \`multiSelect\`. The picker stays open until you stop
  rendering it: close it in \`onSubmit\` and \`onClose\`.
- \`initialSelection\`: \`EntityRef\`s (or \`{ id, entityType }\`) selected when it opens, of
  \`entityType\` or a type above it (a folder opens the tree at it). A slot's \`entities\` fit as they are.
- One fixed project: put your own project field next to it if the user picks the project.

## Slots

${slotSections}
`

const agentsPath = path.join(root, 'AGENTS.md')
if (process.argv.includes('--check')) {
  const current = existsSync(agentsPath) ? readFileSync(agentsPath, 'utf8') : ''
  if (current !== agents) {
    console.error('addon/AGENTS.md is out of date: run yarn build:addon')
    process.exit(1)
  }
  console.log('addon/AGENTS.md is up to date')
} else {
  writeFileSync(agentsPath, agents)
  mkdirSync(path.join(root, 'dist'), { recursive: true })
  writeFileSync(path.join(root, 'dist/slots.json'), JSON.stringify({ version: pkg.version, slots }, null, 2))
  console.log(`wrote AGENTS.md and dist/slots.json (${slots.length} slots)`)
}
