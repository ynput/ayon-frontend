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
const program = ts.createProgram(
  ['src/index.ts', 'src/manifest.ts', 'src/check.ts'].map((f) => path.join(root, f)),
  {
    strict: true,
    skipLibCheck: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ESNext,
  },
)
const checker = program.getTypeChecker()
const slotsFile = program.getSourceFile(path.join(root, 'src/slots.ts'))

const doc = (symbol) =>
  ts.displayPartsToString(symbol.getDocumentationComment(checker)).replace(/\s+/g, ' ').trim()
const typeText = (symbol, node) =>
  checker
    .typeToString(
      checker.getTypeOfSymbolAtLocation(symbol, node),
      undefined,
      ts.TypeFormatFlags.NoTruncation,
    )
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
      for (const field of prop.initializer.properties)
        entry[field.name.getText()] = field.initializer.text
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
    ...rows.map(
      (f) =>
        `| \`${f.name}\`${f.optional ? '' : ' (required)'} | \`${cell(f.type)}\` | ${cell(
          f.doc,
        )} |`,
    ),
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
  \`ProjectList\`), \`MoreMenu\` and \`useContextMenu\` (below). Data comes from
  \`@ynput/ayon-frontend-shared/api\` (AYON's api and cache): components use its hooks, \`run\` and \`menu\` pieces
  \`dispatch(api.endpoints.x.initiate(args))\` with \`dispatch\` from this package (AYON's store).
  Menu items (their context has no \`navigate\`, unlike buttons) open another AYON page with
  \`navigate(to)\` from this package; it is the same as a button's \`context.navigate\`.
- URL query params: \`useQueryParam\` / \`useQueryParams\` and the params (\`StringParam\`,
  \`withDefault\`, ...) from this package. They read the \`QueryParamProvider\` AYON renders around
  every slot: no provider or router adapter in the addon. A change replaces only that param in the
  URL (\`replaceIn\`) unless the call passes another update type.

  \`\`\`tsx
  import { StringParam, useQueryParam, withDefault } from '@ynput/ayon-addon'
  const [mode, setMode] = useQueryParam('mode', withDefault(StringParam, 'list'))
  \`\`\`
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
- To show an entity without leaving the page, \`openDetails(entities)\` opens AYON's details panel
  and \`openViewer(target)\` its viewer (the player), also from \`run\` pieces. Both return
  \`false\` when they can't. The panel shows next to a \`project.page\` that sets
  \`detailsPanel: true\`, for entities of that page's project; on any other page \`openDetails\`
  falls back to \`navigateToEntity\`. Call it again to follow a selection, \`closeDetails()\` closes
  it. Import neither panel nor viewer from \`@ynput/ayon-frontend-shared\`:

  \`\`\`tsx
  import { openDetails, openViewer } from '@ynput/ayon-addon'
  openDetails(selected) // EntityRef[] of one type: folders, tasks, versions or representations
  openViewer({ projectName, versionIds: [version.id], productId: version.productId })
  \`\`\`
- Endpoints you inject and tag types you add (\`enhanceEndpoints({ addTagTypes })\`) go into AYON's
  one api, where names are global: prefix them with your addon name (\`myaddonGetLogs\`,
  \`myaddonLog\`). A \`tableColumn\` lists the tags its values depend on in \`providesTags\`
  (yours or AYON's, such as \`task\`) and refreshes when one is invalidated.
- A crash stays inside the contribution: AYON wraps each one in an error boundary (menu items: a toast).

## Table column ids

A \`tableColumn\` contribution shows up in the project tables as \`addon__<addon>__<id>\`: the addon's
name (anything but letters and digits becomes \`_\`), then the contribution's id. Columns are hidden
until the user adds them in Customize. Build the id with \`addonColumnId(addon, id)\` (\`ADDON_COLUMN_PREFIX\`
is the \`addon__\` part) in tests and saved views; do not write it out by hand.

## What a project table shows: \`tableState\`

\`tableState\` is the table's filter as AYON queries it: the filter bar, every slicer panel, the
search, the folders and the grouping. Use it to act on everything the table shows, not only the
selection ("chart this", "export filtered"). The identity changes only when one of those changes.
It is never in \`tableColumn\`, whose values would refetch on every filter change.

- \`filters\`: one server \`QueryFilter\` per entity (\`folder\`, \`task\`, \`product\`, \`version\`,
  \`representation\`), each applying to that entity. The filters are ANDed together. Keys have no
  scope prefix and are the entity's own fields: \`status\`, \`tags\`, \`name\`, \`createdAt\`,
  \`updatedAt\`, \`attrib.<name>\`, and per entity \`taskType\` and \`assignees\` (task),
  \`folderType\` (folder), \`productType\` and \`productBaseType\` (product), \`author\` and
  \`version\` (version). Relative dates are resolved. An entity without conditions is left out. To
  filter tasks by their folder, prefix the folder keys (\`folder.status\`).
- \`search\`: Overview's name search for tasks, comma-separated terms ORed. Products has none.
- \`folderIds\`: the folders the rows are in, with all descendants. This can be thousands of ids;
  send them as \`folder.id in [...]\` / \`folderIds\`, not one request each. \`undefined\`: the whole
  project.
- \`ids\`: the entities picked in a lists slicer panel, already inside \`folderIds\`. Only those rows show.
- \`groupBy\`: \`{ id, desc }\`, the field the rows are grouped by (\`status\`, \`taskType\`,
  \`assignees\`, \`attrib.<name>\`, ...). \`undefined\` when not grouped.

| | Overview | Products |
| --- | --- | --- |
| \`entityType\` | \`task\` | \`version\` |
| \`filters\` | \`task\`, \`folder\` | \`version\`, \`product\`, \`task\`, \`folder\`, \`representation\` (file extension as a \`path\` condition) |
| \`search\` | task names | not set |
| \`ids\` | \`task\` | \`task\`, \`product\`, \`version\` |
| \`showHierarchy\` | the folder tree | products with their versions |
| \`groupBy\` | task fields; \`folderType\` groups folders | version fields |
| \`queryArgs\` | not set | \`version\`: \`featuredOnly\`, \`latestPerFolder\`, \`hasReviewables\` |

\`queryArgs\` are filters a query takes as arguments, not conditions, per entity like \`filters\`.
\`queryArgs.version\` is named like GraphQL \`versions\` arguments. Send \`featuredOnlyEntityType: 'product'\` with \`featuredOnly\`.

## A column's menu: \`projectTable.columnMenuItem\`

An item in the column header's more menu, after "Group by", for acting on one column: "Chart
tasks by {column}". \`{column}\` in \`label\` and \`dialogTitle\` becomes the column's name. The
context has \`columnId\` (\`status\`, \`subType\`, \`assignees\`, \`attrib_priority\`), \`columnLabel\`,
\`groupField\` and \`tableState\`. \`groupField\` is what "Group by" on that column groups by, the
same key as \`tableState.groupBy.id\` (\`status\`, \`taskType\`, \`attrib.priority\`), and
\`undefined\` when the table can't group by the column. Narrow where it shows in the description,
so no code loads to decide: \`pages\`, \`columns\` (ids, \`attrib_*\` for every attribute) and
\`groupable: true\` (only columns with a \`groupField\`). Columns whose header has no plain name
(link columns) get no addon items unless they are groupable.

\`\`\`ts
projectTableColumnMenuItem({
  id: 'chartTasks',
  label: 'Chart tasks by {column}',
  icon: 'bar_chart',
  pages: ['overview'],
  groupable: true,
  dialogHeader: false,
  dialogSize: 'lg',
  dialog: () => import('./ChartDialog'),
})
\`\`\`

## Dialogs without AYON's header: \`dialogHeader: false\`

A \`dialog\` piece (\`header.item\`, \`projectTable.toolbarItem\`, \`projectTable.columnMenuItem\`,
\`table.shortcut\`) sits in AYON's dialog with a header: the title and a close button. With
\`dialogHeader: false\` AYON draws no header and the piece draws its own toolbar, which must
have a close button calling \`close\`. Escape and a click outside still close it.

## Common errors

Look in the browser console first: every message starts with \`[addon <name>]\`.

| You see | Cause |
|---|---|
| nothing at all, the contribution is missing | The addon's server version with that frontend is not installed or enabled, or the manifest is not listed in the server's \`frontend_modules\`. With \`?addonDev=\`, see "Developing inside AYON" in \`@ynput/ayon-addon-dev\`'s \`AGENTS.md\` |
| \`skipped contribution "x": this AYON version has no such slot\` | The slot is newer than the AYON you run (\`ayon-addon slots\` lists the installed package's). The rest of the addon works |
| \`...and no addon in the bundle declares it (it would be addon "y")\` | The slot is addon \`y\`'s, and \`y\` isn't in the bundle or is too old to have it. The rest of the addon works |
| \`skipped contribution "x" (slot): invalid id …\` / \`missing …\` / \`invalid <field> …\` | The description breaks the slot's rules. \`ayon-addon check\` prints the same reasons without AYON |
| \`… must be a loader: () => import('./File')\` | A piece is a component or a static import. Pieces are dynamic imports of local files |
| \`duplicate id in slot "…"\` | Ids are unique within a slot, across the whole addon |
| \`page "x" (project.page) is not shown: …\` | The page id or \`viewType\` is one AYON, a legacy page or an earlier addon page already uses |
| \`useSlot(…) was called in a component rendered in slot '…'\` or \`… outside any addon slot\` | The component is used in a slot you did not name: \`useSlot(['a', 'b'])\` names every slot it is used in. Outside a slot it has no context at all |
| \`the file has no default export\` / \`"run" has no default export function\` | A piece's file must \`export default\` its component or function |
| \`x (addon): <message>\` toast, and \`[addon <name>] … failed\` in the console | A \`run\`, \`menu\` or dialog piece threw. \`… crashed\` is a component that threw while rendering: it stays inside its own area |
| \`<name> is not available in this AYON frontend\` | A layout component or picker this AYON version does not provide; update AYON or the SDK |

## A table of entities: \`EntityTable\`

AYON's project table as on Overview (columns, sorting, grouping, summaries row, loading on scroll)
for the rows you give it, read-only. It loads the project's data itself: render it anywhere (a
project page, a studio page, a dialog for another project). Give its parent a height.

\`\`\`tsx
import { EntityTable, type EntityTableSettings } from '@ynput/ayon-addon'

const [settings, setSettings] = useState<EntityTableSettings>({})
<EntityTable
  projectName={projectName}
  entityType="task"
  filter={{ conditions: [{ key: 'status', operator: 'in', value: ['In progress'] }] }}
  settings={settings}
  onSettingsChange={setSettings}
/>
\`\`\`

- \`entityType\`: \`task\` (the task list) or \`folder\` (folders, each expandable to its tasks).
- Rows: \`filter\` in the Overview filter bar's format (a key without a prefix is about tasks,
  \`folder_<key>\` about folders), \`ids\` of \`entityType\`, or both (rows match both). \`ids={[]}\`
  shows no rows. Task and folder conditions are always joined by \`and\`: keep an \`or\` within one
  of them. Every table request carries the ids, so keep them to a few thousand.
- \`settings\` is what the user changes (columns, sorting, grouping, row height), the same keys as
  AYON's saved views. Controlled when set; store it where you like (e.g. your page's view).
- \`excludedColumns\`: column ids the table never shows and the user can't add.
- Read-only: the right-click menu offers Open in overview, copy, the viewer, expand and export. A
  single group opens expanded.

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
  An entity on a page the picker hasn't loaded yet stays selected until it loads, or until no page is
  left to load it.
- One fixed project: put your own project field next to it if the user picks the project.

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

## Slots of other addons

An addon can declare its own slots, and other addons contribute to them the way they contribute to
AYON's. Module federation doesn't change: every addon is still its own remote, and nothing of the
declaring addon's code reaches the contributor.

**Declaring.** List the slots in the manifest, and render them with \`SlotOutlet\` (components) or
\`useSlotMenuItems\` (menu items) from this package:

\`\`\`ts
// src/manifest.ts of the addon "planner"
export default defineAddon({ slots, contributes: [...] }) // slots: from its contract package
\`\`\`

\`\`\`ts
const buildSlotItems = useSlotMenuItems('planner.taskEventMenuItem')
// when the menu opens: a broken item is a toast, never a broken menu
const { top, bottom } = buildSlotItems({ projectName, entities })
\`\`\`

When a contribution can narrow where it shows, give the slot a description field for it and pass
the second argument, which leaves out what doesn't apply (the planner's booking events: \`eventTypes\`,
all when not set). Different things get different slots, kinds of one thing get a field:

\`\`\`ts
buildSlotItems({ events }, ({ eventTypes }) => !eventTypes || events.every((e) => eventTypes.includes(e.eventType)))
\`\`\`

A declaration has \`name\`, \`version\`, \`required\`, \`pieces\` and optionally \`optionalPieces\`,
\`optional\`, \`check\` and \`description\`: what AYON checks for its own slots.

**Ownership.** The name is \`<addon>.<name>\`, the addon's name from \`package.py\`. Only that addon can
declare it. A declaration with another prefix, a name AYON already has, or a name already declared is
skipped with a console warning naming the addons.

**Contract package.** The types and declarations reach contributors through a small npm package,
\`@ynput/ayon-addon-<addon>\`, with no code of the addon in it:

- \`declare module '@ynput/ayon-addon' { interface SlotMap { 'planner.taskEventMenuItem': { ... } } }\`:
  \`SlotName\`, \`SlotProps\`, \`useSlot\` and \`contribute\` then cover the slots of the contract
  packages an addon has installed, in \`@ynput/ayon-addon\` and \`@ynput/ayon-addon/manifest\` alike.
- the declarations as data, in a plain JS module that imports without React, marked in its
  \`package.json\`: \`"ayonAddon": { "slots": "./slots.js" }\`. The module exports \`slots\`.
- one helper per slot, which stamps \`slotVersion\`.

**Contributing.** Install the contract package and use its helper in the manifest:
\`plannerTaskEventMenuItem({ id, label, icon, run: () => import('./startTimer') })\`. AYON registers each
manifest as it arrives and works out declarations and contributions again from all of them, so the
order they load in doesn't matter: a contribution appears once its slot's addon has loaded. When all
manifests are in and no addon in the bundle declares the slot (the addon isn't installed, or is older),
the contribution is skipped with a console warning and the rest of the addon works.

**Versioning.** The declaration has \`version\`, and a contribution the \`slotVersion\` it was built
against (the contract package's helper stamps it). A contribution for any other version is skipped
with a warning naming the addon to update. Additive context fields are a minor release of the contract
package; a breaking change is a new slot version. To keep older contributions working through a
transition, declare the new shape under a new slot name and keep the old slot for a while.

## A right-click menu: \`useContextMenu\`

AYON's right-click menu with the same items as \`MoreMenu\`. Don't import AYON's own context menu
from \`@ynput/ayon-frontend-shared\`: its items have another shape and it needs AYON's provider.

\`\`\`tsx
import { useContextMenu } from '@ynput/ayon-addon'

const openContextMenu = useContextMenu()

<tr
  onContextMenu={(event) =>
    openContextMenu(event, [
      { id: 'edit', label: 'Edit', icon: 'edit', onClick: () => edit(log) },
      { divider: true },
      { id: 'delete', label: 'Delete', icon: 'delete', danger: true, disabled: log.locked, onClick: () => askDelete(log) },
    ])
  }
/>
\`\`\`

- The opener takes the mouse event and the items, built when the menu opens. It stops the browser's
  own menu. Items as in \`MoreMenu\`; \`selected\` has no look in this menu.
- To ask before a destructive item, open your own confirmation (AYON's \`Dialog\` from
  \`@ynput/ayon-react-components\`) from its \`onClick\`. The \`confirmDelete\` of
  \`@ynput/ayon-frontend-shared\` needs a dialog AYON doesn't render for addons.

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
- **\`users\`** (\`UserRef[]\`: \`name\`, \`fullName?\`, \`email?\`, \`active\` and the flags of
  \`user\` without \`isDeveloper\`), in slots about other users: \`userDetails.section\` and
  \`userDetails.menuItem\` (the users selected in Settings → Users). Not the signed-in user: that is
  \`user\`.
- **\`tableState\`** (\`ProjectTableState\`), in \`projectTable.toolbarItem\`,
  \`projectTable.columnMenuItem\`, \`entityMenuItem\` and \`table.shortcut\`: what the project table shows. Set on Overview and Products; \`undefined\` on
  Lists, in the panels' tables and on older hosts. See "What a project table shows".

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
  writeFileSync(
    path.join(root, 'dist/slots.json'),
    JSON.stringify({ version: pkg.version, slots }, null, 2),
  )
  console.log(`wrote AGENTS.md and dist/slots.json (${slots.length} slots)`)
}
