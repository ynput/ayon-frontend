export enum KeyMode {
  Ctrl = 'ctrl',
  Alt = 'alt',
  Shift = 'shift',
}

const modeMappings = {
  [KeyMode.Shift]: {
    windows: 'Shift',
    linux: 'Shift',
    other: 'Shift',
    darwin: 'Shift',
  },
  [KeyMode.Ctrl]: {
    windows: 'Ctrl',
    linux: 'Ctrl',
    other: 'Ctrl',
    darwin: 'Cmd',
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

const getPlatformShortcutKey = (key: string, modes: KeyMode[], prefix?: string): string => {
  const shortcut =
    modes.length > 0
      ? [...modes.map((mode) => getModeMapping(mode)), key.toUpperCase()].join('+')
      : key.toUpperCase()

  return prefix ? `${prefix}+${shortcut}` : shortcut
}

export { getCurrentPlatform, getPlatformShortcutKey }
