import { createCommand, type LexicalCommand } from 'lexical'
import type { MentionTrigger } from '../types'

export const INSERT_MENTION_TRIGGER_COMMAND: LexicalCommand<MentionTrigger> = createCommand(
  'INSERT_MENTION_TRIGGER_COMMAND',
)
