import { init } from '@module-federation/enhanced/runtime'

import React from 'react'
import ReactDOM from 'react-dom'
import StyledComponents from 'styled-components'

init({
  name: 'ShellApp',
  remotes: [],
  shared: {
    react: {
      version: '18.0.0',
      scope: 'default',
      lib: () => React,
      shareConfig: {
        singleton: true,
        requiredVersion: '18.0.0',
      },
    },
    'react-dom': {
      version: '18.0.0',
      scope: 'default',
      lib: () => ReactDOM,
      shareConfig: {
        singleton: true,
        requiredVersion: '^18.0.0',
      },
    },
    'styled-components': {
      version: '6.1.12',
      scope: 'default',
      lib: () => StyledComponents,
      shareConfig: {
        singleton: true,
        requiredVersion: '^6.1.12',
      },
    },
  },
})
