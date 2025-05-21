import { useGetFeedbackVerificationQuery, useGetYnputCloudInfoQuery } from '@queries/cloud/cloud'
import { useAppSelector } from '@state/store'
import { cloneDeep } from 'lodash'
import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react'
import { useLocation } from 'react-router'
import { toast } from 'react-toastify'

type FeedbackContextType = {
  loaded: boolean
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
  const [scriptLoaded, setScriptLoaded] = useState(false)

  const { data: connect } = useGetYnputCloudInfoQuery(undefined, { skip: !user.name })
  const { data: verification } = useGetFeedbackVerificationQuery(undefined, {
    skip: !user.name || !connect,
  })

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

    const win = window as any
    win.Featurebase('identify', verificationData, (err: any) => {
      // Callback function. Called when identify completed.
      if (err) {
        console.error(err)
      } else {
        console.log('Featurebase identify completed')
      }
    })
  }

  const initializeChangelog = (): boolean => {
    // everyone sees highlights
    const categories: string[] = []

    if (user.data.isAdmin) {
      // admins see everything
      const adminCategories = ['Server', 'Addon', 'Pipeline']
      categories.push(...adminCategories)
    } else {
      // users only see highlights
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
            toast.error('Error initializing feedback widget')
          } else {
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
        (error: any) => {
          if (error) {
            console.error('Error initializing portal widget:', error)
            toast.error('Error initializing portal widget')
            return false
          } else {
            return true
          }
        },
      )
    }
    return false
  }

  useEffect(() => {
    // if not logged in, do not load the script
    if (!user.name) return
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
  }, [user.name, scriptLoaded])

  const location = useLocation()
  const [identified, setIdentified] = useState(false)
  // verify user
  useEffect(() => {
    // check if we can identify the user
    if (!user.name || !connect || !verification || !scriptLoaded) return
    // only load the script if on the home page
    if (!location.pathname.includes('dashboard/tasks')) return
    // check if we already identified the user
    if (identified) return
    // Identify the user
    identifyUser()
    setIdentified(true)
  }, [user.name, connect?.instanceId, verification?.userHash, scriptLoaded, location, identified])

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
    <FeedbackContext.Provider
      value={{ openChangelog, openFeedback, openPortal, loaded: scriptLoaded }}
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
