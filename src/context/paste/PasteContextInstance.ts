import { createContext, useContext } from 'react'

export type PasteContextValue = {
  requestPaste: () => Promise<string | null>
  closeModal: (pastedData: string | null) => void
  isModalOpen: boolean
}

export const PasteContext = createContext<PasteContextValue | undefined>(undefined)

export const usePaste = (): PasteContextValue => useContext(PasteContext)!
