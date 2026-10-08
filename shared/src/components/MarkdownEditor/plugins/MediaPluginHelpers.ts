import { createCommand, type LexicalCommand } from 'lexical'

// insert image / video files as blocks at the caret
export const INSERT_MEDIA_FILES_COMMAND: LexicalCommand<File[]> = createCommand(
  'INSERT_MEDIA_FILES_COMMAND',
)

// pick images / videos to insert (slash menu)
export const OPEN_MEDIA_PICKER_COMMAND: LexicalCommand<void> = createCommand(
  'OPEN_MEDIA_PICKER_COMMAND',
)
