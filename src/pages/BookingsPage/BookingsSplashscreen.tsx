// Shown at /dashboard/bookings when the planner addon is not installed.

import { FC } from 'react'
import SplashWrapperPage from '@components/SplashWrapperPage'

const BookingsSplashscreen: FC = () => {
  return (
    <SplashWrapperPage
      label="Planner"
      splashImage="/splash/bookings-splash.png"
      description="Map high-level production timelines. Schedule phases, track milestones, and manage studio-wide capacity."
      addon={{ icon: 'calendar_month', name: 'planner' }}
      features={{
        phasePlanner: {
          icon: 'view_timeline',
          bullet: 'Schedule high-level phases and milestones on independent project tracks.',
        },
        artistBookings: {
          icon: 'event_available',
          bullet: 'Manage artist availability, project allocations, and time off.',
        },
        scenarios: {
          icon: 'science',
          bullet: 'Draft and test schedule changes in a staging environment before applying them.',
        },
        studioOversight: {
          icon: 'manage_accounts',
          bullet: 'View all active projects simultaneously to identify scheduling overlaps.',
        },
        exportImport: {
          icon: 'ios_share',
          bullet: 'Export timeline events to CSV or ICS calendar formats.',
        },
      }}
    />
  )
}

export default BookingsSplashscreen
