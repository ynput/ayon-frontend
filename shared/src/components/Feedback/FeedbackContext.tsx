import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { useGetFeedbackVerificationQuery } from '@shared/api'
import { useGlobalContext } from '@shared/context'

export type FeedbackContextType = {
  loaded: boolean
  openSupport: (
    page?: 'Home' | 'Messages' | 'Changelog' | 'Help' | 'NewMessage' | 'ShowArticle',
    id?: string,
  ) => void
  messengerLoaded: boolean // whether the messenger widget is loaded
  unreadCount: number // number of unread messages
  messengerVisibility: boolean
  setMessengerVisibility: (show: boolean) => void // show/hide the messenger icon
  openFeedback: () => void
  openPortal: (
    page?: 'MainView' | 'RoadmapView' | 'CreatePost' | 'PostsView' | 'ChangelogView' | 'HelpView',
    articleId?: string,
  ) => void
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined)

type FeedbackProviderProps = {
  children: ReactNode
}

export const FeedbackProvider: React.FC<FeedbackProviderProps> = ({ children }) => {
  const [scriptLoaded, setScriptLoaded] = useState(false)
  const { siteInfo, user, cloudInfo } = useGlobalContext()
  const { data: verification, isLoading: isLoadingVerification } = useGetFeedbackVerificationQuery(
    {},
    {
      skip: !user?.name || !cloudInfo,
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
    if (!user?.name || !verification?.available) return

    const identifyData = {
      ...verification.data,
      customFields: {
        origin: window.location.origin,
        serverVersion: serverVersion,
        frontendVersion: frontendVersion,
        instanceId: cloudInfo?.instanceId,
      },
    }

    console.log(identifyData)

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
  const [unreadCount, setUnreadCount] = useState(0)

  // MESSENGER WIDGET
  const initializeMessenger = (): void => {
    const win = window as any
    if (typeof win.Featurebase === 'function') {
      console.log('Initializing Featurebase messenger widget')
      if (!verification?.available)
        return console.warn('messenger verification not available, skipping messenger init')
      win.Featurebase(
        'boot',
        {
          theme: 'dark',
          ...verification?.data,
        },
        (err: any) => {
          // Callback function. Called when identify completed.
          if (err) {
            console.error(err)
          } else {
            console.log('Featurebase messenger completed')
            setMessengerLoaded(true)

            // register event listener for unread messages
            win.Featurebase('onUnreadCountChange', function (unreadCount: number) {
              setUnreadCount(unreadCount)
            })
          }
        },
      )
    }
  }

  // CHANGELOG WIDGET
  const initializeChangelog = (): boolean => {
    // everyone sees highlights
    const categories: string[] = []

    if (user?.data?.isAdmin) {
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
          usersName: user?.attrib?.fullName,
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

  // PORTAL WIDGET (old)
  const initializePortalWidget = (): boolean => {
    const win = window as any
    if (typeof win.Featurebase === 'function') {
      win.Featurebase(
        'initialize_portal_widget',
        {
          organization: 'ayon',
          fullScreen: true,
          initialPage: 'MainView',
        },
        (error: any) => {
          if (error) {
            console.error('Error initializing portal widget:', error)
            return false
          } else {
            return true
          }
        },
      )
    }
    return false
  }

  // SURVEY WIDGET
  const initializeSurveyWidget = (): boolean => {
    const win = window as any
    if (typeof win.Featurebase === 'function') {
      console.log('Initializing survey widget', verification?.data)
      win.Featurebase(
        'initialize_survey_widget',
        {
          organization: 'ayon',
          placement: 'bottom-right',
          theme: 'dark',
          email: user?.attrib?.email,
          featurebaseJwt: verification?.data?.featurebaseJwt,
          locale: 'en',
        },
        (error: any) => {
          if (error) {
            console.error('Error initializing survey widget:', error)
          } else {
            console.log('Survey widget initialized successfully')
          }
        },
      )
    }
    return false
  }

  // Use an environment variable to skip loading Featurebase in certain environments
  // @ts-expect-error: Vite provides import.meta.env at runtime
  const skipFeaturebase = import.meta.env.VITE_SKIP_FEATUREBASE === 'true'

  // Load Featurebase script and initialize widgets
  useEffect(() => {
    // if skip flag is set, do not load the script
    if (skipFeaturebase) return
    // if not logged in, do not load the script
    if (!user?.name) return
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

    // Initialize portal widget
    initializePortalWidget()
  }, [user?.name, scriptLoaded, siteInfo])

  const [identified, setIdentified] = useState(false)
  // verify user
  useEffect(() => {
    // check if we can identify the user
    if (!user?.name || !cloudInfo || !verification || !scriptLoaded) return
    // if we are already identified, do not identify again
    if (identified) return
    // Identify the user
    identifyUser()

    // Initialize survey widget
    initializeSurveyWidget()

    setIdentified(true)
  }, [
    user?.name,
    cloudInfo?.instanceId,
    verification?.available,
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

  const openFeedback: FeedbackContextType['openFeedback'] = () => {
    window.postMessage({
      target: 'FeaturebaseWidget',
      data: {
        action: 'openFeedbackWidget',
      },
    })
  }

  const openPortal = (
    page:
      | 'MainView'
      | 'RoadmapView'
      | 'CreatePost'
      | 'PostsView'
      | 'ChangelogView'
      | 'HelpView' = 'MainView',
    articleId?: string,
  ) => {
    window.postMessage({
      target: 'FeaturebaseWidget',
      data: {
        action: 'changePage',
        payload: page,
        openWidget: true,
        ...(articleId && { articleId }),
      },
    })
  }

  const [messengerVisibility, setMessengerVisibility] = useState(false)
  const supportElement = document.getElementById('fb-messenger-root')

  const setSupportDisplay = (show: boolean) =>
    supportElement instanceof HTMLElement &&
    (supportElement.style.display = show ? 'block' : 'none')

  useEffect(() => {
    if (!scriptLoaded || !messengerLoaded) return
    setSupportDisplay(messengerVisibility)
  }, [scriptLoaded, messengerLoaded, messengerVisibility])

  // when the messenger is hidden, we need to hide the root element again
  useEffect(() => {
    if (!scriptLoaded || !messengerLoaded) return
    const win = window as any
    if (typeof win.Featurebase === 'function') {
      win.Featurebase('onHide', function () {
        // hide the messenger root element
        setMessengerVisibility(false)
      })
    }
  }, [scriptLoaded, messengerLoaded])

  const openSupport: FeedbackContextType['openSupport'] = (page = 'Home', id) => {
    const win = window as any
    if (typeof win.Featurebase !== 'function') {
      window.alert('Featurebase SDK is not loaded yet. Please try again later.')
      console.warn('Featurebase SDK is not loaded yet.')
      return
    }

    if (messengerVisibility) {
      //  if the messenger is already visible, close it
      win.Featurebase('hide')
      setMessengerVisibility(false)
      return
    }

    // ensure the messenger is visible
    setMessengerVisibility(true)

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

  return (
    <FeedbackContext.Provider
      value={{
        openSupport,
        openFeedback,
        openPortal,
        messengerLoaded,
        unreadCount,
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
