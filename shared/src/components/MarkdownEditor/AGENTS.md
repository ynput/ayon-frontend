# Markdown editor

The rich text editor used for comments, descriptions and text table cells. It is built on Lexical 0.51 and reads and writes **markdown**: markdown is what gets stored, and the Lexical state is thrown away. It replaced the old Quill editor (ynput/ayon-frontend#2364).

Read this guide before changing anything in this folder, or anything that renders or stores editor markdown. If your change makes something here untrue, update this file in the same PR.

## Where it is used

| Consumer | File | Notes |
| --- | --- | --- |
| Comment input (activity feed) | `shared/src/containers/Feed/components/CommentInput/CommentInput.tsx` | A new comment has the toolbar and opens menus at the top. Editing a comment uses the floating toolbar and opens menus inline. Uses mentions, media, attachments and the frame-link `/` commands. |
| Entity description (details panel) | `shared/src/components/DetailsPanelDetails/DescriptionSection.tsx` | `readOnly` when viewing. Remounted with `key` when editing starts or stops. Mentions come from `hooks/useDescriptionMentions.ts`. Uses `DESCRIPTION_TOOLBAR` (with headings). |
| Text table cells | `shared/src/containers/ProjectTreeTable/widgets/TextContentWidget.tsx` | `submitOnEnter`. Stops Enter and Escape from bubbling to the table, but the editor handles them first. Mentions come from the `mentionEntity` prop. |
| Markdown attribute cells | `shared/src/containers/ProjectTreeTable/widgets/MarkdownWidget.tsx` | Dialog editor. |
| Playground | `src/pages/EditorPlaygroundPage/` at route `/dev/editor` | Available in dev, or for user level 700 and above. Mock mentions, plus the comment renderer side by side. **Use it to check changes.** |

Read-only markdown is **not** rendered by the editor. It is rendered by `react-markdown` (see [Rendering outside the editor](#rendering-outside-the-editor)).

## The markdown format (the contract)

Stored markdown is read by the feed renderer, the table cells, the backend (check lists, mentions, file references) and older clients. Changing how anything is written is a data format change.

| Content | Markdown | Code |
| --- | --- | --- |
| Mention | `[label](type:id)`. Only spaces in the id are encoded (`%20`), e.g. `[Sons of thunder](team:Sons%20of%20thunder)`. Legacy `[label](@type:id)` is also read. | `MENTION` in `markdown/transformers.ts`, `nodes/MentionNode.ts` |
| Mention types | `user team task version folder representation workfile product` | `MENTION_REF_TYPES` in `types.ts` |
| Image or video block | A standalone image line, with the mime type as its title: `![clip.mp4](/api/projects/p/files/id "video/mp4")`. An image inside a line of text stays text. Media still uploading is not written. | `MEDIA`, `nodes/MediaNode.tsx` |
| YouTube embed | The url on its own line, imported only. A pasted or typed url becomes an embed through `YouTubePlugin`. | `YOUTUBE`, `nodes/YouTubeNode.tsx` |
| Check list | `* [ ]` / `* [x]`, rewritten from `-` because the backend and the checklist counters look for `* [`. | `blockText` in `markdown/convert.ts` |
| Line break in a paragraph | A hard break: `\` followed by a newline. | `HARD_LINE_BREAK` and the paragraph model |
| Paragraph break | A blank line. | Paragraph model |
| Code block | A fenced block, with the language as the info string. No language is written unless one is chosen. | `CodeLanguagePlugin`, `CodeHighlightPlugin` |
| Emoji | The unicode character. Typing `:tada:` converts it; imported `:shortcodes:` are left alone. | `EMOJI_SHORTCODE`, `EmojiPlugin` |
| Underline | Not supported. Legacy `<u>` tags are removed. | `normalizeLegacyMarkdown` |

### The paragraph model (`markdown/convert.ts`)

This works like GitHub, and it is the least obvious part of the editor:

- Each editor paragraph is **one line**. Enter and Shift+Enter both start a new paragraph.
- Paragraphs next to each other are written as one markdown paragraph, with `\` + newline hard breaks between them.
- An **empty** paragraph between two paragraphs is written as a blank line, which makes a markdown paragraph break.
- Only one empty line can be stored. `EmptyParagraphPlugin` stops Enter from adding a second one, and the export collapses any that slip through.
- `$toMarkdownParagraphs` (export) and `$toEditorBlocks` (import) implement this. Both match markdown blocks to editor blocks, so test round trips whenever you touch them.

`normalizeLegacyMarkdown` runs on every import. Quill wrote every line as its own paragraph, and blank lines as `&nbsp;` spacer paragraphs. When spacers are found, the content is rewritten into the model above. Don't remove this: old comments and descriptions depend on it.

### Adding new syntax

Every place that reads the markdown needs to know about it:

1. Add an export and import transformer in `markdown/transformers.ts`. **Order matters**: check lists before bullets, mentions before links, and block transformers (`YOUTUBE`, `MEDIA`) first.
2. Add a node in `nodes/` and register it in `EDITOR_NODES` in `MarkdownEditor.tsx`.
3. Update the feed renderer `ActivityComment.tsx` and `ActivityMarkdownComponents.tsx`, and the table cell renderer `TextWidget.tsx`.
4. Update `markdownToPlainText` (`markdown/plainText.ts`), which turns description changes in the feed into one line of text.
5. If it references project files, update `getInlineMediaFileIds` (`media/mediaUtils.ts`).
6. Check it in `/dev/editor`: type it, reload the stored markdown, and compare with the comment preview.

## Architecture

### Setup (`MarkdownEditor.tsx`)

- `LexicalExtensionComposer` with `defineExtension({... dependencies: [RichTextExtension]})`. `LexicalComposer` is deprecated, so don't go back to it.
- `contentEditable={null}`: we render our own `ContentEditable`, with the placeholder, inside our layout.
- **Don't add `RichTextPlugin`.** The extension already renders decorator nodes (media, YouTube); `RichTextPlugin` renders them a second time.
- The extension is created **once** (`useMemo([])`). Changing `nodes`, `theme` or `namespace` props after mounting does nothing. `readOnly` is synced by `EditablePlugin`, and `value` by `MarkdownValuePlugin`.
- Plugins are plain React components rendered inside the composer. Many are skipped when `readOnly`. Extra plugins can be passed as `children`.

### Value sync (`plugins/MarkdownValuePlugin.ts`)

- Edits call `onChange(markdown)`, but only when the markdown actually changes.
- A `value` that differs from the last markdown emitted replaces the content (with the `markdown-value` tag) and clears undo history. This is how parents reset the editor (`value=''`). Passing back exactly what `onChange` gave you is a no-op, so controlled use doesn't fight the caret.
- `ref` gives a `MarkdownEditorHandle` (`types.ts`): `getEditor`, `focus`, `blur`, `getMarkdown`, `setMarkdown`, `clear`, `isEmpty` and `insertMentionTrigger`. Read `getMarkdown()` when submitting, rather than relying on the last `onChange`.

### Variants

`variant="document"` (default) has the toolbar on top, and Enter adds a line. `variant="message"` gets a floating toolbar, `submitOnEnter`, menus at the top and a growing height. Each default can be overridden by its prop (see `VARIANTS`). Toolbar layouts: `DEFAULT_TOOLBAR` and `FLOATING_TOOLBAR` in `types.ts`. Headings, code blocks and inline code are left out on purpose; they live in the `/` menu.

### Plugins (`plugins/`)

| Plugin | Does |
| --- | --- |
| `KeyboardPlugin` | Mod+Enter submits. With `submitOnEnter`, Enter submits except in lists and code. Shift+Enter makes a new paragraph line. Escape calls `onEscape`. |
| `MentionsPlugin` | `@` users and teams, `@@` versions, `@@@` tasks, from a `MentionSource`. `INSERT_MENTION_TRIGGER_COMMAND` is used by the mention buttons. |
| `MentionEventsPlugin` | `onMentionClick` and `onMentionHover`, delegated from the root. |
| `SlashCommandPlugin` | The `/` menu: headings, lists, blocks, insert (video, media, attachment), mentions, and custom `commands` (shown first). |
| `EmojiPlugin` | The `:` picker. Usage is stored in frontend preferences (`emoji/useEmojiUsage.ts`). |
| `SuggestionMenu` | The shared menu UI for mentions, emoji and `/`. `placement` `inline` (at the caret, flipping above when there's no room below) or `top` (across the editor). |
| `ToolbarPlugin` | Fixed or floating toolbar. Formatting helpers are in `formatting.ts`. |
| `LinkEditorPlugin` | Inline link url editor (Mod+K); also the YouTube url prompt. |
| `LinkPastePlugin` | Pasting a known url inserts a link with a label from `links/getLinkLabel.ts`. |
| `LinkClickPlugin` | Opens links: click when read only, Mod+click when editing. |
| `YouTubePlugin` | A pasted or entered YouTube url becomes an embed. |
| `MediaPlugin` | Image and video blocks. Needs `onUploadMedia`. Pasted or dropped media becomes an attachment first, with a prompt to show it inline (click or Tab). |
| `ClipboardPlugin` | Copy writes markdown so mentions survive. A plain-text paste parses mentions. Files go to `onFiles`. |
| `CodeHighlightPlugin`, `CodeLanguagePlugin` | Prism highlighting, and the language picker on code blocks. |
| `InlineCodePlugin` | Mod+E, and the arrow keys step out of inline code. |
| `BlockExitPlugin` | Down or Right at the end of a final code block or quote adds a paragraph after it. |
| `ChecklistShortcutPlugin` | `- [ ] ` becomes a check list item, because the bullet shortcut fires first. |
| `EmptyParagraphPlugin` | At most one empty line in a row (paragraph model). |

### Command priorities (read before touching keys or paste)

Lexical runs command handlers from the highest priority down, until one returns `true`. Several features share Enter, Escape and paste, and the order is deliberate:

- **Enter:**
  - `HIGH`: Mod+Enter submits (`KeyboardPlugin`).
  - `NORMAL`: open typeahead menus pick an option (mentions, emoji, `/`), and `YouTubePlugin`.
  - `LOW`: `submitOnEnter` and Shift+Enter (`KeyboardPlugin`).
  - `EDITOR`: rich text adds a paragraph.
- **Escape:**
  - `CRITICAL`: `MediaPlugin` dismisses the inline prompt.
  - `NORMAL`: open menus close.
  - `BEFORE_EDITOR` (-8): `KeyboardPlugin` calls `onEscape`.
  - `EDITOR`: `RichTextExtension` **blurs the editor**. That is why `onEscape` must run at `BEFORE_EDITOR`: lower than the menus, higher than the blur.
- **Paste:**
  - `NORMAL`: `YouTubePlugin` (registered first), then `LinkPastePlugin`.
  - `LOW`: `ClipboardPlugin` handles plain-text mentions and files.
  - `EDITOR`: rich text paste. Lexical and HTML pastes are left to rich text; `MentionNode.importDOM` parses mentions from HTML.

Hosts that listen for keys themselves (table cells, dialogs) must let the editor go first, then stop the event from reaching the host. Don't add capture-phase listeners; they run before the menus. `TextContentWidget.handleKeyDown` shows the pattern. The floating toolbar carries `BLOCK_DIALOG_CLOSE_CLASS` so that clicking it doesn't close cell dialogs.

## Feature notes

### Mentions

- A source (`MentionSource` in `types.ts`) gives `getOptions({trigger, search, filter})`, plus optional `getError`, `config`, `limit` and `renderOptionImage`.
- In the app, use `createFeedMentionSource` (`mentions/createFeedMentionSource.ts`) with `useGetEntityMentionsQuery` suggestions. It uses the same option builders and sorting as the feed. Version mentions show an error on folders.
- **Memoize the source.** A new object resets the highlighted option.
- Guests get no mentions (`mentions={undefined}`).
- Hover tooltips in the app use `useReferenceTooltip` with `ActivityReferenceTooltip`. The tooltip stays open while moving between references (`[data-mention-value], .reference`), so keep those attributes on any mention markup.

### Media and attachments (comments)

- `onFiles(files)`: attachments, the classic comment files.
- `onUploadMedia(file)`: stores an image or video and returns its url. Without it, there are no media blocks.
- A media block's file is also a comment file, flagged `isInline`. On submit, `CommentInput` drops inline files whose block was deleted. `ActivityComment` hides inline files from the attachment list. Both use `getInlineMediaFileIds(markdown)`, which counts only standalone media lines outside code fences.

### `/` commands from the host

Pass `commands: EditorCommand[]` (`types.ts`: `id`, `label`, `icon`, `keywords`, `hint` and `run`). **Memoize them**, because a new array rebuilds the menu. Example: frame linking in `CommentInput` (`frameLinkCommands`), which uses `useDetailsPanelContext().commentFrameLink`. The frame link is stored as activity data (`startFrame`/`endFrame`), never as comment text.

### Link labels (`links/getLinkLabel.ts`)

- The label comes **only from the url structure. Never fetch anything.** For example, `github.com/ynput/ayon-frontend/issues/2342` becomes `ayon-frontend #2342`.
- To support a new site, add a `LabelParser` and an entry in `PARSERS` (a hostname regex).
- Return `null` when unsure, and the url stays as the text.
- Only a paste of a single url, onto a collapsed selection outside code and links, gets a label.

### Comment links (`links/activityLinks.ts`)

- A link to a comment on this server (`/projects/{project}/...?activity={id}`, from "Copy link") is stored as a **plain markdown link**, but shown as a chip like mentions. Duplicated comments write `[Source](source:<activity-id>?type=<entity-type>&id=<entity-id>)` (`getSourceLink`), with the entity the source comment belongs to: a copy can be posted on another entity. Older `source:<activity-id>` links fall back to the containing comment's entity.
- The editor: `ActivityLinkPlugin` adds `md-activity-link` to those links, styled like `.mention`. A pasted comment url gets the label "Comment" (`getLinkLabel`).
- The feed: `aTag` renders them with `ActivityReference` (chat icon). Clicking highlights the comment when it is in the feed, otherwise it opens the link in a new tab.
- Source links render with the `chat_paste_go` icon and the label "Source". `SourceCommentReference` uses `GetActivitiesById` with the source entity and activity ID; it renders nothing until the backend returns the source activity.
- Lexical renders links with protocols it doesn't allow (like `source:`) with `href="about:blank"`; `LinkClickPlugin` reads the url from the link node, never from the DOM.
- Links to other servers stay normal links. `parseActivityLink` is the one place that decides.

### Code blocks

- `code/prism.ts` is the single Prism setup: the languages and `CODE_LANGUAGES` for the picker. The editor uses it for highlighting, and the feed's `codeTag` uses it through `highlightCode`. Add languages there, importing dependencies first.
- Token colours come from `codeTokenStyles` (`code/codeTheme.ts`), shared by `MarkdownEditor.styled.ts` and `ActivityComment.styled.ts`.
- Code blocks are 0.9em (12.6px), matching inline code. **Keep the editor and feed code block styles identical**: background, padding, line height and font size.

## Rendering outside the editor

| Where | How |
| --- | --- |
| Feed comments | `ActivityComment.tsx`: `react-markdown` with `remark-gfm`, `remark-emoji` and `remark-directive`. Components come from `ActivityMarkdownComponents.tsx` (`aTag` renders mentions as references, plus `codeTag`, `inputTag` and `blockquoteTag`). `p` goes through `renderMediaParagraph` and `renderYouTubeParagraph`. |
| Table cells | `TextWidget.tsx`: `react-markdown`, with `aTag`-like mention rendering through `ActivityReference`. |
| Feed field changes | `ActivityFieldChange.tsx` calls `markdownToPlainText` for `description` and markdown widgets. Mentions and links show their label, and nothing is linked. |

`react-markdown` drops non-http urls by default, which would break mentions (`user:luke`). Every renderer must pass `urlTransform` to keep them.

## Styling

- Lexical class names are in `theme.ts`, all prefixed `md-`. They are styled in `MarkdownEditor.styled.ts`.
- The toolbar collapses with container queries on `Styled.Toolbar`. Strikethrough and quote go first, then lists and dividers, then code block, link and h3.
- Use theme tokens (`--md-sys-color-*`), not raw colours.
- Menus and popovers are portalled. `mentionMenuParent` picks the parent element.

## Checking changes

- Run the app (`yarn dev`) and open `/dev/editor`. Check round trips: type, then look at the markdown, reload it, and compare with the comment preview. Then check the real consumer in the browser, especially the comment input (new and editing), the description and a text table cell.
- Type check from the repo root with `npx tsc --noEmit -p .` and filter to your files. The `shared` package has errors that predate the editor, so judge only the files you changed.
- There are no unit tests for the editor yet. The paragraph model, `normalizeLegacyMarkdown`, `getLinkLabel`, `markdownToPlainText` and `getInlineMediaFileIds` are pure functions and the best candidates.

## Known gotchas

- **Escape blurs instead of cancelling:** something is handling Escape at or below `EDITOR` priority, or returns `false` (see [Command priorities](#command-priorities-read-before-touching-keys-or-paste)).
- **Enter submits while a menu is open:** a host Enter handler runs before the menu (capture phase, or `HIGH` priority).
- **Mentions render as `href="#"` or plain links:** a renderer is missing `urlTransform`, or its `a` component doesn't handle `type:id` urls.
- **Media or YouTube render twice:** someone added `RichTextPlugin`.
- **New props have no effect:** the extension is configured once; see [Setup](#setup-markdowneditortsx).
- **Old content looks wrong:** check `normalizeLegacyMarkdown` before changing the paragraph model.
