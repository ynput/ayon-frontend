import { useCallback, useMemo, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  type MenuTextMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin'
import {
  COMMAND_PRIORITY_NORMAL,
  FORMAT_TEXT_COMMAND,
  type LexicalEditor,
  type TextNode,
} from 'lexical'
import { Icon, type IconType } from '@ynput/ayon-react-components'
import type { EditorCommand, MentionPlacement, MentionTrigger } from '../types'
import { toggleBlockFormat } from './formatting'
import { INSERT_MENTION_TRIGGER_COMMAND } from './MentionsPluginHelpers'
import { OPEN_VIDEO_PROMPT_COMMAND } from './LinkEditorPluginHelpers'
import { OPEN_MEDIA_PICKER_COMMAND } from './MediaPluginHelpers'
import { $isSelectionInCode } from './selectionHelpers'
import SuggestionMenu from './SuggestionMenu'

// `/` at the start of a word, so paths (a/b) and urls don't open the menu
const SLASH_REGEX = /(^|\s)(\/)([\w-]{0,30})$/

interface SlashCommand {
  id: string
  label: string
  icon: IconType
  // options of a group are shown together, separated by a divider
  group: 'custom' | 'headings' | 'lists' | 'blocks' | 'insert' | 'mentions'
  // extra words to find it by
  keywords: string[]
  // the markdown or key shortcut, shown on the right
  hint?: string
  run: (editor: LexicalEditor) => void
}

class SlashCommandOption extends MenuOption {
  command: SlashCommand
  constructor(command: SlashCommand) {
    super(command.id)
    this.command = command
  }
}

interface SlashCommandPluginProps {
  placement?: MentionPlacement
  menuParent?: HTMLElement
  // mention triggers the editor supports, their commands are only shown when set
  mentionTriggers?: MentionTrigger[]
  // pick files to attach, the attach command is only shown when set
  onFiles?: (files: File[]) => void
  // the editor can store images and videos (MediaPlugin)
  canInsertMedia?: boolean
  // commands of the editor's user, shown first
  customCommands?: EditorCommand[]
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform)
const MOD = isMac ? '⌘' : 'Ctrl+'

/**
 * Type `/` to insert a block (headings, lists, code, quote...), a video, an attachment or a
 * mention, or run a command of the editor's user (`customCommands`). Typing after the `/` filters
 * the commands.
 */
const SlashCommandPlugin = ({
  placement = 'inline',
  menuParent,
  mentionTriggers = [],
  onFiles,
  canInsertMedia,
  customCommands = [],
}: SlashCommandPluginProps) => {
  const [editor] = useLexicalComposerContext()
  const [query, setQuery] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const commands = useMemo<SlashCommand[]>(() => {
    const list: SlashCommand[] = [
      ...customCommands.map(({ icon, keywords = [], run, ...command }) => ({
        ...command,
        icon: icon as IconType,
        group: 'custom' as const,
        keywords,
        run: () => run(),
      })),
      {
        id: 'h1',
        label: 'Heading 1',
        icon: 'format_h1',
        group: 'headings',
        keywords: ['h1', 'title', 'heading'],
        hint: '#',
        run: (e) => toggleBlockFormat(e, 'h1', 'set'),
      },
      {
        id: 'h2',
        label: 'Heading 2',
        icon: 'format_h2',
        group: 'headings',
        keywords: ['h2', 'heading', 'subtitle'],
        hint: '##',
        run: (e) => toggleBlockFormat(e, 'h2', 'set'),
      },
      {
        id: 'h3',
        label: 'Heading 3',
        icon: 'format_h3',
        group: 'headings',
        keywords: ['h3', 'heading'],
        hint: '###',
        run: (e) => toggleBlockFormat(e, 'h3', 'set'),
      },
      {
        id: 'bullet',
        label: 'Bullet list',
        icon: 'format_list_bulleted',
        group: 'lists',
        keywords: ['list', 'bullet', 'unordered', 'ul'],
        hint: '-',
        run: (e) => toggleBlockFormat(e, 'bullet', 'set'),
      },
      {
        id: 'number',
        label: 'Numbered list',
        icon: 'format_list_numbered',
        group: 'lists',
        keywords: ['list', 'numbered', 'ordered', 'ol'],
        hint: '1.',
        run: (e) => toggleBlockFormat(e, 'number', 'set'),
      },
      {
        id: 'check',
        label: 'Checklist',
        icon: 'check_circle',
        group: 'lists',
        keywords: ['list', 'check', 'task', 'todo'],
        hint: '[]',
        run: (e) => toggleBlockFormat(e, 'check', 'set'),
      },
      {
        id: 'quote',
        label: 'Quote',
        icon: 'format_quote',
        group: 'blocks',
        keywords: ['quote', 'blockquote'],
        hint: '>',
        run: (e) => toggleBlockFormat(e, 'quote', 'set'),
      },
      {
        id: 'codeBlock',
        label: 'Code block',
        icon: 'data_object',
        group: 'blocks',
        keywords: ['code', 'block', 'snippet', 'pre'],
        hint: '```',
        run: (e) => toggleBlockFormat(e, 'code', 'set'),
      },
      {
        id: 'code',
        label: 'Inline code',
        icon: 'code',
        group: 'blocks',
        keywords: ['code', 'inline', 'monospace'],
        hint: `${MOD}E`,
        run: (e) => e.dispatchCommand(FORMAT_TEXT_COMMAND, 'code'),
      },
      {
        id: 'youtube',
        label: 'YouTube video',
        icon: 'smart_display',
        group: 'insert',
        keywords: ['youtube', 'video', 'embed'],
        run: (e) => e.dispatchCommand(OPEN_VIDEO_PROMPT_COMMAND, undefined),
      },
    ]

    if (canInsertMedia) {
      list.push({
        id: 'media',
        label: 'Image or video',
        icon: 'image',
        group: 'insert',
        keywords: ['image', 'picture', 'photo', 'video', 'movie', 'media', 'screenshot'],
        run: (e) => e.dispatchCommand(OPEN_MEDIA_PICKER_COMMAND, undefined),
      })
    }

    if (onFiles) {
      list.push({
        id: 'attachment',
        label: 'Attachment',
        icon: 'attach_file',
        group: 'insert',
        keywords: ['attach', 'attachment', 'file', 'upload'],
        run: () => fileInputRef.current?.click(),
      })
    }

    const mentions: { trigger: MentionTrigger; label: string; icon: IconType; words: string[] }[] =
      [
        { trigger: '@', label: 'Mention user', icon: 'person', words: ['user', 'team', 'person'] },
        { trigger: '@@', label: 'Mention version', icon: 'layers', words: ['version'] },
        { trigger: '@@@', label: 'Mention task', icon: 'check_circle', words: ['task'] },
      ]
    mentions
      .filter(({ trigger }) => mentionTriggers.includes(trigger))
      .forEach(({ trigger, label, icon, words }) =>
        list.push({
          id: `mention-${trigger}`,
          label,
          icon,
          group: 'mentions',
          keywords: ['mention', ...words],
          hint: trigger,
          run: (e) => e.dispatchCommand(INSERT_MENTION_TRIGGER_COMMAND, trigger),
        }),
      )

    return list
  }, [mentionTriggers.join(), !!onFiles, canInsertMedia, customCommands])

  const options = useMemo(() => {
    if (query === null) return []
    const search = query.toLowerCase()
    return (
      commands
        // words of the label or keywords that start with the search (`ch` is checklist, not attachment)
        .filter(
          (command) =>
            !search ||
            command.label.toLowerCase().startsWith(search) ||
            [...command.label.toLowerCase().split(/\s+/), ...command.keywords].some((word) =>
              word.startsWith(search),
            ),
        )
        .map((command) => new SlashCommandOption(command))
    )
  }, [commands, query])

  const triggerFn = useCallback((text: string): MenuTextMatch | null => {
    // a `/` in code is code
    if ($isSelectionInCode()) return null
    const match = SLASH_REGEX.exec(text)
    if (!match) return null
    return {
      leadOffset: match.index + match[1].length,
      matchingString: match[3],
      replaceableString: match[2] + match[3],
    }
  }, [])

  const onSelectOption = useCallback(
    (option: SlashCommandOption, nodeToRemove: TextNode | null, closeMenu: () => void) => {
      // remove the `/query`, then run the command where it was (once the removal is committed,
      // commands like the video prompt read the current selection)
      closeMenu()
      editor.update(
        () => {
          nodeToRemove?.remove()
        },
        { onUpdate: () => option.command.run(editor) },
      )
    },
    [editor],
  )

  return (
    <>
      <LexicalTypeaheadMenuPlugin<SlashCommandOption>
        onQueryChange={setQuery}
        onSelectOption={onSelectOption}
        triggerFn={triggerFn}
        options={options}
        parent={menuParent}
        // before the enter to submit handler of chat inputs
        commandPriority={COMMAND_PRIORITY_NORMAL}
        // a bare `/` shows the commands, enter still adds a line until one is chosen
        preselectFirstItem={!!query}
        menuRenderFn={(
          anchorElementRef,
          { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
        ) => {
          const anchor = anchorElementRef.current
          // nothing matches (e.g. a path), get out of the way
          if (!anchor || !options.length) return null
          return (
            <SuggestionMenu
              editor={editor}
              anchor={anchor}
              placement={placement}
              className="slash-menu"
              options={options}
              selectedIndex={selectedIndex}
              onSelect={selectOptionAndCleanUp}
              onHighlight={setHighlightedIndex}
              getGroup={(option) => option.command.group}
              renderOption={({ command }) => (
                <>
                  <Icon icon={command.icon} className="image" />
                  <span className="label">{command.label}</span>
                  {command.hint && <span className="suffix hint">{command.hint}</span>}
                </>
              )}
            />
          )
        }}
      />
      {onFiles && (
        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files || [])
            if (files.length) onFiles(files)
            e.target.value = ''
          }}
        />
      )}
    </>
  )
}

export default SlashCommandPlugin
