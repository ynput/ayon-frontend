export enum KeyMode {
  Ctrl = 'ctrl',
  Alt = 'alt',
  Shift = 'shift',
}

const modeMappings = {
  [KeyMode.Shift]: {
    windows: '⇧',
    linux: '⇧',
    other: '⇧',
    darwin: '⇧',
  },
  [KeyMode.Ctrl]: {
    windows: 'Ctrl',
    linux: 'Ctrl',
    other: 'Ctrl',
    darwin: '⌘',
  },
  [KeyMode.Alt]: {
    windows: 'Alt',
    linux: 'Alt',
    other: 'Alt',
    darwin: 'Opt',
  },
}

const getModeMapping = (mode: KeyMode): string => {
  const platform = getCurrentPlatform()
  return modeMappings[mode][platform] || modeMappings[mode].other
}

const getCurrentPlatform = () => {
  const platform = window.navigator.userAgent.toLowerCase()

  if (platform.includes('win')) {
    return 'windows'
  } else if (platform.includes('mac')) {
    return 'darwin'
  } else if (platform.includes('linux')) {
    return 'linux'
  } else {
    return 'other'
  }
}

const firstUpper = (t: string) => t.charAt(0).toUpperCase() + t.slice(1)

const getPlatformShortcutKey = (key: string, modes: KeyMode[], prefix?: string): string => {
  const shortcut =
    modes.length > 0
      ? key
        ? [...modes.map((mode) => getModeMapping(mode)), firstUpper(key)].join('+')
        : [...modes.map((mode) => getModeMapping(mode))].join('+')
      : firstUpper(key)

  return prefix ? `${prefix}+${shortcut}` : shortcut
}

export { getCurrentPlatform, getPlatformShortcutKey }
