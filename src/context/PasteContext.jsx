import React, { createContext, useContext, useState, useCallback } from 'react'
import { Button, InputTextarea, Dialog } from '@ynput/ayon-react-components'

const PasteContext = createContext()

const PasteProvider = ({ children }) => {
  const [isModalOpen, setModalOpen] = useState(false)
  const [resolvePaste, setResolvePaste] = useState(null)

  const requestPaste = useCallback(() => {
    // Immediately return a promise
    // eslint-disable-next-line no-unused-vars
    return new Promise((resolve, reject) => {
      if (navigator.clipboard && navigator.clipboard.readText) {
        navigator.clipboard
          .readText()
          .then(resolve)
          .catch(() => {
            // If clipboard access fails, open modal for manual input
            setModalOpen(true)
            // Save the resolve function to use later when modal is submitted
            setResolvePaste(() => resolve)
          })
      } else {
        // Clipboard API not supported, open modal for manual input
        setModalOpen(true)
        // Save the resolve function to use later when modal is submitted
        setResolvePaste(() => resolve)
      }
    })
  }, [])

  const closeModal = useCallback(
    (pastedData) => {
      console.log('pastedData', pastedData)
      if (resolvePaste) resolvePaste(pastedData)
      setModalOpen(false)
    },
    [resolvePaste],
  )

  return (
    <PasteContext.Provider value={{ requestPaste, closeModal, isModalOpen }}>
      {children}
    </PasteContext.Provider>
  )
}

const PasteModal = () => {
  const { closeModal, isModalOpen } = usePaste()
  const [pastedData, setPastedData] = useState('')

  const submit = (value) => {
    closeModal(value)
    setPastedData('')
  }

  if (!isModalOpen) return null

  const footer = (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexDirection: 'row' }}>
      <Button onClick={() => submit(pastedData)} label="Submit" />
      <Button onClick={() => submit(null)} label="Cancel" />
    </div>
  )

  const header = (
    <p style={{ display: 'inline' }}>
      Paste Data
      <span style={{ display: 'inline-block', margin: '0px 8px' }}> - </span>
      <span>
        <a
          href="https://support.google.com/chrome/answer/114662?hl=en"
          target="_blank"
          rel="noreferrer noopener"
          style={{
            textDecoration: 'underline',
            fontSize: '14px',
            color: 'var(--md-sys-color-outline)',
          }}
          data-tooltip="Ensure your browser clipboard permissions are set to 'Allow'."
        >
          Why is pasting not working?
        </a>
      </span>
    </p>
  )

  return (
    <Dialog
      header={header}
      footer={footer}
      isOpen
      size="lg"
      onClose={() => closeModal(null)}
      style={{ width: '600px', height: '600px' }}
    >
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <InputTextarea
          value={pastedData}
          placeholder="Clipboard API is not supported by your browser. Please paste the data here."
          onChange={(e) => setPastedData(e.target.value)}
          style={{ width: '100%', flexGrow: 1 }}
        />
      </div>
    </Dialog>
  )
}

const usePaste = () => useContext(PasteContext)

export { usePaste, PasteProvider, PasteModal }
