import React, { createContext, useContext, useState } from 'react'

export const FEED_NEW_COMMENT = '__new__' as const

type EditingState = null | typeof FEED_NEW_COMMENT | string

interface FeedContextType {
  editingId: EditingState
  setEditingId: (id: EditingState) => void
}

const FeedContext = createContext<FeedContextType>({
  editingId: null,
  setEditingId: () => {},
})

export const FeedProvider = ({ children }: { children: React.ReactNode }) => {
  const [editingId, setEditingId] = useState<EditingState>(null)

  return <FeedContext.Provider value={{ editingId, setEditingId }}>{children}</FeedContext.Provider>
}

export const useFeed = () => useContext(FeedContext)
