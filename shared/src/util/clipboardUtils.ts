/**
 * Utility functions for safe clipboard operations
 * Handles browser security restrictions gracefully
 */

/**
 * Safely read text from clipboard
 * Returns null if clipboard access is not allowed or not supported
 */
export const safeReadClipboard = async (): Promise<string | null> => {
  if (!navigator.clipboard || !window.isSecureContext) {
    return null
  }

  try {
    return await navigator.clipboard.readText()
  } catch (error: any) {
    // Silently fail for permission denials - this is expected behavior
    if (error.name === 'NotAllowedError' || error.message.includes('not allowed')) {
      return null
    }
    // Log unexpected errors
    console.warn('Unexpected clipboard read error:', error.message)
    return null
  }
}

/**
 * Safely write text to clipboard
 * Returns true if successful, false otherwise
 */
export const safeWriteClipboard = async (text: string): Promise<boolean> => {
  if (!navigator.clipboard || !window.isSecureContext) {
    return false
  }

  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error: any) {
    // Silently fail for permission denials - this is expected behavior
    if (error.name === 'NotAllowedError' || error.message.includes('not allowed')) {
      return false
    }
    // Log unexpected errors
    console.warn('Unexpected clipboard write error:', error.message)
    return false
  }
}

/**
 * Check if clipboard API is available and accessible
 */
export const isClipboardAvailable = (): boolean => {
  return !!(navigator.clipboard && window.isSecureContext)
}
