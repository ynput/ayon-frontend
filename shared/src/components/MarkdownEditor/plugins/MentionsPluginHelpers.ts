import { createCommand, type LexicalCommand } from 'lexical'
import type { MentionTrigger } from '../types'

// a trigger, or a trigger with the picker filter to turn on (e.g. `user`)
export type MentionTriggerPayload = MentionTrigger | { trigger: MentionTrigger; filter?: string }

export const INSERT_MENTION_TRIGGER_COMMAND: LexicalCommand<MentionTriggerPayload> = createCommand(
  'INSERT_MENTION_TRIGGER_COMMAND',
)
