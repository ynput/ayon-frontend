// Settings written in the current tick. A synchronous reader (saving a view right after flushing a
// debounced column write) cannot rely on the RTK caches: the working view may have just been
// created, and getDefaultView is only patched once the selection catches up.

let settingsWrittenThisTick: { viewType: string; projectName?: string; settings: any } | null = null

export const recordSettingsWrite = (
  viewType: string,
  projectName: string | undefined,
  settings: any,
) => {
  settingsWrittenThisTick = { viewType, projectName, settings }
  queueMicrotask(() => {
    settingsWrittenThisTick = null
  })
}

export const getSettingsWrittenThisTick = (viewType?: string, projectName?: string) =>
  settingsWrittenThisTick &&
  settingsWrittenThisTick.viewType === viewType &&
  settingsWrittenThisTick.projectName === projectName
    ? settingsWrittenThisTick.settings
    : undefined
