import { PowerpackDialogType } from '@shared/context'

export type AddonFeatureKey = string

export interface AddonConfig {
  /** Display name of the addon */
  label: string
  /** Icon to show in the dialog header */
  icon: string
  /** Features list for the addon */
  features: Record<AddonFeatureKey, Omit<PowerpackDialogType, 'priority'>>
  /** Ordered feature keys for consistent display */
  featureOrder: AddonFeatureKey[]
}

export const addonConfigs: Record<string, AddonConfig> = {
  planner: {
    label: 'Planner',
    icon: 'calendar_month',
    features: {
      subtasks: {
        label: 'Subtasks',
        description:
          'Divide complex tasks into smaller, actionable items for more granular tracking and clearer responsibility.',
        bullet: 'Granular task breakdown with subtasks',
      },
      integratedPlanning: {
        label: 'Integrated Planning',
        description:
          'Bridge high-level phase estimation and detailed task scheduling to map out production timelines before assigning artists.',
        bullet: 'High-level and granular planning in one place',
      },
      studioOversight: {
        label: 'Studio Oversight',
        description:
          "Toggle between a bird's-eye view of all studio projects and project-specific deep-dive views to spot scheduling overlaps.",
        bullet: 'Cross-project scheduling and conflict detection',
      },
      sandboxScenarios: {
        label: 'Sandbox Scenarios',
        description:
          'Experiment with "what-if" scheduling strategies in private scenarios, then set your best version to "Live" with one click.',
        bullet: 'Risk-free "what-if" scheduling experiments',
      },
      trackBasedTimelines: {
        label: 'Track-Based Timelines',
        description:
          'Manage complex timelines using familiar lane-based organization—similar to video editing—for episodes, departments, or assets.',
        bullet: 'Familiar lane-based timeline organization',
      },
      dataPortability: {
        label: 'Data Portability',
        description:
          'Export schedules to CSV or ICS to keep your team synced across spreadsheets, calendars, and other platforms.',
        bullet: 'CSV and ICS export for universal sync',
      },
    },
    featureOrder: [
      'subtasks',
      'integratedPlanning',
      'studioOversight',
      'sandboxScenarios',
      'trackBasedTimelines',
      'dataPortability',
    ],
  },
}
