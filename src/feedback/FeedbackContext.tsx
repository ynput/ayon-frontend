import { useGetFeedbackVerificationQuery } from '@queries/cloud/cloud'
import { useAppSelector } from '@state/store'
import React, { createContext, useContext, ReactNode, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'

type FeedbackContextType = {
  openChangelog: () => void
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
  const user = useAppSelector((state) => state.user)
  const scriptLoaded = useRef(false)

  const { data: verification } = useGetFeedbackVerificationQuery(undefined, { skip: !user.name })

  const loadScript = () => {
    if (!scriptLoaded.current) {
      const script = document.createElement('script')
      script.src = 'https://do.featurebase.app/js/sdk.js'
      script.id = 'featurebase-sdk'
      script.async = true
      document.body.appendChild(script)
      scriptLoaded.current = true
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

  const identifyUser = () => {
    if (!user.name || !verification) return
    console.log(verification)
    const win = window as any
    win.Featurebase('identify', verification, (err: any) => {
      // Callback function. Called when identify completed.
      if (err) {
        console.error(err)
      } else {
        console.log('Featurebase identify completed')
      }
    })
  }

  const initializeChangelog = (): boolean => {
    const win = window as any
    if (typeof win.Featurebase === 'function') {
      win.Featurebase(
        'init_changelog_widget',
        {
          organization: 'ayon',
          dropdown: {
            enabled: true,
          },
          popup: {
            enabled: true,
            usersName: user.attrib?.fullName,
            autoOpenForNewUpdates: true,
          },
          theme: 'dark',
        },
        (_error: any, data: any) => {
          // This never runs
          console.log('Featurebase changelog widget initialized')
          if (data?.action === 'unreadChangelogsCountChanged') {
            console.log('unreadChangelogsCountChanged', data.unreadCount)
          }
        },
      )
    }
    return false
  }

  const initializeFeedbackWidget = (): boolean => {
    const win = window as any
    if (typeof win.Featurebase === 'function') {
      win.Featurebase(
        'initialize_feedback_widget',
        {
          organization: 'ayon',
          theme: 'dark',
          email: user.attrib.email,
          metadata: {},
        },
        (error: any, data: any) => {
          if (error) {
            console.error('Error initializing feedback widget:', error)
            toast.error('Error initializing feedback widget')
          } else {
            console.log('Featurebase feedback widget initialized', data)
          }
        },
      )
    }
    return false
  }

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
        (error: any, data: any) => {
          if (error) {
            console.error('Error initializing portal widget:', error)
            toast.error('Error initializing portal widget')
            return false
          } else {
            console.log('Featurebase portal widget initialized', data)
            return true
          }
        },
      )
    }
    return false
  }

  useEffect(() => {
    if (!user.name || !verification) return
    // Load the Featurebase script
    loadScript()

    // Initialize Featurebase
    initialize()

    // Identify the user
    identifyUser()

    // Initialize changelog widget
    initializeChangelog()

    // Initialize feedback widget
    initializeFeedbackWidget()

    // Initialize portal widget
    initializePortalWidget()
  }, [user.name, verification])

  const openChangelog = () => {
    const win = window as any
    if (typeof win.Featurebase === 'function') {
      win.Featurebase('manually_open_changelog_popup')
    } else {
      console.warn('Featurebase script not loaded yet')
    }
  }

  const openFeedback = () => {
    window.postMessage({
      target: 'FeaturebaseWidget',
      data: {
        action: 'openFeedbackWidget',
        // setBoard: 'yourboardname', // optional - preselect a board
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

  return (
    <FeedbackContext.Provider value={{ openChangelog, openFeedback, openPortal }}>
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
