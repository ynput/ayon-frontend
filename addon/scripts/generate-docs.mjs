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
        { name: 'user', type: 'AddonUser', optional: false, doc: 'the signed-in user' },
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
  its dialog around your content, which gets \`close\`), \`menu\` (a function returning the items),
  \`popover\` (AYON opens a popover under the button with your content, which gets \`close\`) or
  \`component\` (your own JSX instead of AYON's button). Their code gets \`navigate\` in the context.
- A popover is AYON's: it positions it and closes it on a click outside or Escape. Don't build your
  own overlay. Menus and dialogs opened from inside it close on their own Escape or outside click
  without closing the popover. A button that needs its own look (a badge, a live value) sets
  \`component\` **and** \`popover\`: the component is the button and gets \`popoverOpen\` and
  \`togglePopover\` (its \`onClick\`), typed \`SlotProps<'header.item'> & PopoverButtonScope\`.
- Code with no UI that runs while AYON is open (a timer's state, websocket listeners, a store
  listener) is an \`appService\`: a component that returns \`null\`, mounted once for the whole app
  under AYON's providers, so hooks work. Clean up in its effects.
- Globals are imports, never context: \`useUser\`, \`useNavigate\` and the other router hooks, \`Link\`,
  \`toast\`, the layout components (\`ProjectPageLayout\`, \`Slicer\`, \`StudioPageLayout\`,
  \`ProjectList\`), \`MoreMenu\` (below). Data comes from \`@ynput/ayon-frontend-shared/api\`
  (AYON's api and cache): components use its hooks, \`run\` and \`menu\` pieces
  \`dispatch(api.endpoints.x.initiate(args))\` with \`dispatch\` from this package (AYON's store).
- Links to an entity come from \`entityUrl(entity, { activity? })\`, never a hand-built URL: the page
  that opens it with its details panel (folders and tasks on Overview; products, versions and
  representations on Products), \`undefined\` for types without a page (e.g. \`workfile\`).
  \`navigateToEntity(entity)\` goes there without reloading, also from \`run\` pieces; it returns
  \`false\` for those types. Any \`EntityRef\` from a context works, the id is enough:

  \`\`\`tsx
  import { entityUrl, Link, navigateToEntity } from '@ynput/ayon-addon'
  <Link to={entityUrl(entity) ?? ''}>{entity.label}</Link>
  navigateToEntity({ projectName, entityType: 'task', id: log.taskId })
  \`\`\`
- Endpoints you inject and tag types you add (\`enhanceEndpoints({ addTagTypes })\`) go into AYON's
  one api, where names are global: prefix them with your addon name (\`myaddonGetLogs\`,
  \`myaddonLog\`). A \`tableColumn\` lists the tags its values depend on in \`providesTags\`
  (yours or AYON's, such as \`task\`) and refreshes when one is invalidated.
- A crash stays inside the contribution: AYON wraps each one in an error boundary (menu items: a toast).

## A "more" menu: \`MoreMenu\`

An addon's own menu (a panel's "…" actions, a row's options) is AYON's menu under a button, from
one component. Don't build one: \`MoreMenu\` looks and works like AYON's menus everywhere (pages,
details panel tabs, popovers, dialogs, the dev shell).

\`\`\`tsx
import { MoreMenu } from '@ynput/ayon-addon'

<MoreMenu
  data-testid="tracker-more"
  items={[
    { id: 'add', label: 'Add time manually', icon: 'more_time', onClick: () => setAdding(true) },
    { id: 'export', label: 'Export', icon: 'download', items: [
      { id: 'csv', label: 'CSV', onClick: exportCsv },
    ] },
    { divider: true },
    { id: 'delete', label: 'Delete', icon: 'delete', danger: true, disabled: !selected, onClick: remove },
  ]}
/>
\`\`\`

- Items are the \`AddonMenuItem\`s a \`menu\` piece returns: \`onClick\`, \`to\` (an AYON URL), \`href\`
  (a new tab), \`items\` (a submenu), \`{ divider: true }\`, \`disabled\`, \`selected\`, \`danger\`. A
  failing \`onClick\` (also a rejected promise) is shown as a toast naming the addon.
- The button: \`icon\` (\`more_horiz\` when not set), \`label\` (next to the icon), \`tooltip\` (the label,
  or \`More\`, when not set; also the accessible name), \`variant\` (\`text\` by default, as AYON's
  \`Button\`), \`align\` (the menu's edge on the button's: \`right\` by default), \`disabled\`,
  \`className\`, \`data-testid\`.
- Escape and a click outside close only the menu: the popover or dialog it is in stays open, and
  Escape puts the focus back on the button. Keys as in AYON's menus: Tab moves through the items,
  Enter picks one or opens its submenu, Escape closes the submenu first.
- In tests the items are \`listitem\`s (\`getByRole('listitem', { name: 'Delete' })\`), not \`menuitem\`s.

## Slot contexts: one shape

The same thing has the same name and type in every slot that has it:

- **\`user\`** (\`AddonUser\`), in every slot: the signed-in user, \`name\`, \`fullName\`, \`email\` and
  the flags \`isAdmin\` (service users too), \`isManager\` (admins too), \`isGuest\`, \`isService\`,
  \`isDeveloper\` (developer mode). \`run\` and \`menu\` pieces get it like components; \`useUser()\`
  is the same user for code below them.
- **\`projectName\`** (\`string\`), in slots about one project. Where there may be none it is
  \`string | null\`: \`header.item\` (no project page open) and \`table.shortcut\` (the project list).
  \`project.page\` also has \`project\` (\`ProjectInfo\`, \`undefined\` while it loads); elsewhere get
  the project from AYON's api (\`useGetProjectQuery({ projectName })\`, cached).
- **\`entities\`** (\`EntityRef[]\`: \`id\`, \`entityType\`, \`projectName\`, \`name?\`, \`label?\`), in
  slots about entities: \`detailsPanel.tab\`, \`detailsPanel.menuItem\` (both also \`entityType\`, all of
  one type), \`entityMenuItem\`, \`table.shortcut\` (the project tables' rows; empty in the panels'
  tables) and \`slicer.menuItem\` (hierarchy rows; empty for other slice types). A table cell is one
  entity: \`tableColumn\` has \`entity\`.

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
