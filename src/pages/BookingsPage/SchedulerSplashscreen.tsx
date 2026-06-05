// Shown at /projects/{project}/scheduler when the planner addon is not installed.

import { FC } from 'react'
import SplashWrapperPage from '@components/SplashWrapperPage'

const SchedulerSplashscreen: FC = () => {
  return (
    <SplashWrapperPage
      label="Scheduler"
      splashImage="/splash/scheduler-splash.png"
      description="Apply dates directly to production tasks, assign work to artists, and create subtasks."
      addon={{ icon: 'calendar_month', name: 'planner' }}
      features={{
        taskScheduling: {
          icon: 'task_alt',
          bullet: 'Schedule exactly how long tasks will take and give artists due dates.',
        },
        plannerOverlay: {
          icon: 'layers',
          bullet: 'Overlay high-level phase plans onto granular task schedules.',
        },
        subtasks: {
          icon: 'checklist',
          bullet: 'Break tasks into subtasks with automatic parent wrapping.',
        },
        scenarios: {
          icon: 'science',
          bullet: 'Explore what-if timelines in staging scenarios before going live.',
        },
      }}
    />
  )
}

export default SchedulerSplashscreen
