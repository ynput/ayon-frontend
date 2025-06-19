import { useGetFeedbackVerificationQuery, useGetYnputCloudInfoQuery } from '@queries/cloud/cloud'
import { useAppSelector } from '@state/store'
import { cloneDeep } from 'lodash'
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { useGetSiteInfoQuery } from '@shared/api'

type FeedbackContextType = {
  loaded: boolean
  openSupport: (
    page?: 'Home' | 'Messages' | 'Changelog' | 'Help' | 'NewMessage' | 'ShowArticle',
    id?: string,
  ) => void
  messengerVisibility: boolean
  setMessengerVisibility: (show: boolean) => void // show/hide the messenger icon
  openFeedback: () => void
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined)

type FeedbackProviderProps = {
  children: ReactNode
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({ children }) => {
  const user = useAppSelector((state) => state.user)
  const [scriptLoaded, setScriptLoaded] = useState(false)

  const { data: siteInfo } = useGetSiteInfoQuery({ full: true }, { skip: !user.name })
  const { data: connect } = useGetYnputCloudInfoQuery(undefined, { skip: !user.name })
  const { data: verification, isLoading: isLoadingVerification } = useGetFeedbackVerificationQuery(
    undefined,
    {
      skip: !user.name || !connect,
    },
  )

  const loadScript = () => {
    if (!scriptLoaded) {
      const script = document.createElement('script')
      script.src = 'https://do.featurebase.app/js/sdk.js'
      script.id = 'featurebase-sdk'
      script.async = true
      document.body.appendChild(script)
      setScriptLoaded(true)
    }
  }

  const initialize = () => {
    // Initialize Featurebase
    const win = window as any
    if (typeof win.Featurebase !== 'function') {
      win.Featurebase = function () {
        ;(win.Featurebase.q = win.Featurebase.q || []).push(arguments)
      }
    }
  }

  const serverVersion = siteInfo?.version?.split('+')[0] || 'unknown'
  const frontendVersion = siteInfo?.version?.split('+')[1] || 'unknown'

  const identifyUser = () => {
    if (!user.name || !verification) return
    const verificationData = cloneDeep(verification)
    // delete any undefined/null properties
    const cleanObject = (obj: any) => {
      Object.keys(obj).forEach((key) => {
        if (obj[key] && typeof obj[key] === 'object') {
          cleanObject(obj[key])
        } else if (obj[key] === undefined || obj[key] === null) {
          delete obj[key]
        }
      })
    }

    cleanObject(verificationData)

    const identifyData = {
      ...verificationData,
      customFields: {
        origin: window.location.origin,
        serverVersion: serverVersion,
        frontendVersion: frontendVersion,
      },
    }

    const win = window as any
    win.Featurebase('identify', identifyData, (err: any) => {
      // Callback function. Called when identify completed.
      if (err) {
        console.error(err)
      } else {
        console.log('Featurebase identify completed')
      }
    })
  }

  const [messengerLoaded, setMessengerLoaded] = useState(false)

  // MESSENGER WIDGET
  const initializeMessenger = (): void => {
    const win = window as any
    if (typeof win.Featurebase === 'function') {
      console.log('Initializing Featurebase messenger widget')
      win.Featurebase(
        'boot',
        {
          appId: '67b76a31b8a7a2f3181da4ba',
          email: verification?.email,
          theme: 'dark',
          userHash: verification?.userHash, // generated user hash token
        },
        (err: any) => {
          // Callback function. Called when identify completed.
          if (err) {
            console.error(err)
          } else {
            console.log('Featurebase messenger completed')
            setMessengerLoaded(true)
          }
        },
      )
    }
    return false
  }

  // CHANGELOG WIDGET
  const initializeChangelog = (): boolean => {
    // everyone sees highlights
    const categories: string[] = []

    if (user.data.isAdmin) {
      // admins see everything
      const adminCategories = ['Server', 'Addon', 'Pipeline']
      categories.push(...adminCategories)
    } else if (!siteInfo?.disableChangelog) {
      // users only see highlights (unless disabled)
      // admins do not see highlights as it is a subset of the other categories
      categories.push('Highlights')
    }

    const win = window as any
    if (typeof win.Featurebase === 'function') {
      win.Featurebase('init_changelog_widget', {
        organization: 'ayon',
        dropdown: {
          enabled: true,
        },
        popup: {
          enabled: true,
          usersName: user.attrib?.fullName,
          autoOpenForNewUpdates: true,
        },
        category: categories,
        theme: 'dark',
      })
    }
    return false
  }

  // FEEDBACK WIDGET
  const initializeFeedbackWidget = (): boolean => {
    const win = window as any
    if (typeof win.Featurebase === 'function') {
      win.Featurebase(
        'initialize_feedback_widget',
        {
          organization: 'ayon',
          theme: 'dark',
          metadata: {},
        },
        (error: any) => {
          if (error) {
            console.error('Error initializing feedback widget:', error)
          } else {
          }
        },
      )
    }
    return false
  }

  const isLocalHost3000 =
    window.location.hostname === 'localhost' && window.location.port === '3000'
  // Load featurebase script and initialize widgets
  useEffect(() => {
    // if working in a local environment, do not load the script
    if (isLocalHost3000) return
    // if not logged in, do not load the script
    if (!user.name) return
    if (!siteInfo) return

    // if already loaded, do not load again
    if (scriptLoaded) return

    // Load the Featurebase script
    loadScript()

    // Initialize Featurebase
    initialize()

    // Initialize changelog widget
    initializeChangelog()

    // Initialize feedback widget
    initializeFeedbackWidget()
  }, [user.name, scriptLoaded, siteInfo])

  const [identified, setIdentified] = useState(false)
  // verify user
  useEffect(() => {
    // check if we can identify the user
    if (!user.name || !connect || !verification || !scriptLoaded) return
    // if we are already identified, do not identify again
    if (identified) return
    // Identify the user
    identifyUser()
    setIdentified(true)
  }, [
    user.name,
    connect?.instanceId,
    verification?.userHash,
    scriptLoaded,
    window.location.pathname,
    identified,
  ])

  // load messenger widget once verification is done loading
  // we don't need verification but we should use it if we have it
  useEffect(() => {
    // wait for script to be loaded and verification to finish loading
    if (isLoadingVerification || !scriptLoaded) return

    // initialize the messenger widget
    initializeMessenger()
  }, [verification, isLoadingVerification, scriptLoaded])

  const openSupport: FeedbackContextType['openSupport'] = (page = 'Home', id) => {
    const win = window as any
    if (typeof win.Featurebase !== 'function') return

    switch (page) {
      case 'Home':
        // Show messenger home
        win.Featurebase('show')
        break
      case 'Messages':
        // Show messages view
        win.Featurebase('show', 'messages')
        break
      case 'Changelog':
        // Show changelog view
        win.Featurebase('show', 'changelog')
        break
      case 'Help':
        // Open help center
        win.Featurebase('show', 'help')
        break
      case 'ShowArticle':
        // Open a specific help article
        if (id) win.Featurebase('showArticle', id)
        else win.Featurebase('show', 'help')
        break
      case 'NewMessage':
        // Open new message dialog
        win.Featurebase('showNewMessage', id)
        break
      default:
        // Default to showing the main widget
        win.Featurebase('show')
        break
    }
  }

  const openFeedback: FeedbackContextType['openFeedback'] = () => {
    window.postMessage({
      target: 'FeaturebaseWidget',
      data: {
        action: 'openFeedbackWidget',
      },
    })
  }

  const [messengerVisibility, setMessengerVisibility] = useState(true)

  useEffect(() => {
    if (!scriptLoaded || !messengerLoaded) return
    const root = document.getElementById('fb-messenger-root')
    if (root instanceof HTMLElement) {
      root.style.display = messengerVisibility ? 'block' : 'none'
    }
  }, [scriptLoaded, messengerLoaded, messengerVisibility])

  return (
    <FeedbackContext.Provider
      value={{
        openSupport,
        openFeedback,
        messengerVisibility,
        setMessengerVisibility,
        loaded: scriptLoaded,
      }}
    >
      {children}
    </FeedbackContext.Provider>
  )
}

export const useFeedback = (): FeedbackContextType => {
  const context = useContext(FeedbackContext)
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider')
  }
  return context
}
