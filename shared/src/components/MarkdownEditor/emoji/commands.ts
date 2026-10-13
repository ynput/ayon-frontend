import { createCommand, type LexicalCommand } from 'lexical'

// an emoji was inserted (picked or typed as `:name:`), payload is the emoji name
export const EMOJI_USED_COMMAND: LexicalCommand<string> = createCommand('EMOJI_USED_COMMAND')
