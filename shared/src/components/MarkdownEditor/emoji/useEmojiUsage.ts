import { useCallback, useRef } from 'react'
import { useSetFrontendPreferencesMutation } from '@shared/api'
import { useGlobalContext } from '@shared/context/GlobalContext'
import type { EmojiUsage } from './emojiData'

export const EMOJI_USAGE_PREFERENCE = 'emojiUsage'
// only the most used are kept so the preferences stay small
const MAX_TRACKED = 40

/**
 * How often the current user picked each emoji, stored on the user's frontend preferences so
 * the picker can suggest their favourites first.
 */
export const useEmojiUsage = () => {
  const { user } = useGlobalContext()
  const usage: EmojiUsage = user?.data?.frontendPreferences?.[EMOJI_USAGE_PREFERENCE] ?? {}
  // the latest counts, for several uses before the user cache updates
  const usageRef = useRef(usage)
  usageRef.current = usage
  const [setFrontendPreferences] = useSetFrontendPreferencesMutation()

  const recordUse = useCallback(
    (name: string) => {
      if (!user?.name) return
      const counts = { ...usageRef.current, [name]: (usageRef.current[name] ?? 0) + 1 }
      const next = Object.fromEntries(
        Object.entries(counts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, MAX_TRACKED),
      )
      usageRef.current = next
      setFrontendPreferences({
        userName: user.name,
        patchData: { [EMOJI_USAGE_PREFERENCE]: next },
        // @ts-expect-error - disableInvalidations is not in the api
        disableInvalidations: true,
      })
        .unwrap()
        .catch((error) => console.warn('Failed to save emoji usage', error))
    },
    [user?.name, setFrontendPreferences],
  )

  return { usage, recordUse }
}
