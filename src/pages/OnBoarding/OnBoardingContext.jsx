// holds stageIndex state and provides functions to update it
// gets addonsList
// get server info
import React, { createContext, useState } from 'react'

export const OnBoardingContext = createContext()

export const OnBoardingProvider = ({ children, serverInfo }) => {
  const [stepIndex, setStepIndex] = useState(0)
  const previousStep = () => setStepIndex(stepIndex - 1)
  const nextStep = () => setStepIndex(stepIndex + 1)

  // FIX: just place holder for now
  const release = {
    name: '2023.08',
    addons: [
      {
        name: 'Core',
        version: '1.0.0',
        url: 'https://get.ayon.io/addons/core-1.0.0.zip',
        tags: ['full', '2D', '3D', 'vfx'],
      },
      {
        name: 'Deadline',
        version: '1.0.0',
        url: 'https://get.ayon.io/addons/deadline-1.0.0.zip',
        tags: ['full', '2D', '3D', 'vfx'],
      },
      {
        name: 'Maya',
        version: '1.0.0',
        url: 'https://get.ayon.io/addons/maya-1.0.0.zip',
        tags: ['full', '3D', 'vfx'],
      },
      {
        name: 'Nuke',
        version: '1.0.0',
        url: 'https://get.ayon.io/addons/nuke-1.0.0.zip',
        tags: ['full', 'vfx'],
      },
      {
        name: 'Houdini',
        version: '1.0.0',
        url: 'https://get.ayon.io/addons/houdini-1.0.0.zip',
        tags: ['full', '3D'],
      },
      {
        name: 'Blender',
        version: '1.0.0',
        url: 'https://get.ayon.io/addons/blender-1.0.0.zip',
        tags: ['full', '3D'],
      },
      {
        name: 'AfterEffects',
        version: '1.0.0',
        url: 'https://get.ayon.io/addons/aftereffects-1.0.0.zip',
        tags: ['full', 'vfx'],
      },
      {
        name: 'Premiere',
        version: '1.0.0',
        url: 'https://get.ayon.io/addons/premiere-1.0.0.zip',
        tags: ['full', '2D'],
      },
      {
        name: 'Photoshop',
        version: '1.0.0',
        url: 'https://get.ayon.io/addons/photoshop-1.0.0.zip',
        tags: ['full', '2D'],
      },
      {
        name: 'Illustrator',
        version: '1.0.0',
        url: 'https://get.ayon.io/addons/illustrator-1.0.0.zip',
        tags: ['full', '2D'],
      },
    ],
    presets: [
      {
        name: 'Full Suite',
        tag: 'full',
        bio: 'Not sure? Here is everything we think you will need',
        icon: 'done_all',
      },
      {
        name: '3D',
        tag: '3D',
        bio: 'Workflows with softwares like Maya and Houdini',
        icon: 'deployed_code',
      },
      {
        name: '2D',
        tag: '2D',
        bio: 'Workflows with softwares like Photoshop and Illustrator',
        icon: '2d',
      },
      {
        name: 'VFX',
        tag: 'vfx',
        bio: 'Workflows with softwares like Nuke and AfterEffects',
        icon: 'movie',
      },
    ],
  }

  const contextValue = {
    stepIndex,
    setStepIndex,
    release,
    serverInfo,
    nextStep,
    previousStep,
  }

  return <OnBoardingContext.Provider value={contextValue}>{children}</OnBoardingContext.Provider>
}

export default OnBoardingProvider
