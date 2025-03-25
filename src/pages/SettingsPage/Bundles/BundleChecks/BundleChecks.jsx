import { Icon } from '@ynput/ayon-react-components'
import * as Styled from './BundleChecks.styled'
import clsx from 'clsx'
import Typography from '@/theme/typography.module.css'

const BundleChecks = ({ check = {}, isLoading = true, isCheckError = false, onIssueClick }) => {
  const { issues = [], success = false } = check
  const isError = issues.some((issue) => issue.severity === 'error')
  const isWarning = issues.some((issue) => issue.severity === 'warning')
  const isSuccess = success && !isError && !isWarning

  let state = 'isLoading'
  if (isLoading) state = 'isLoading'
  else if (isError) state = 'isError'
  else if (isWarning) state = 'isWarning'
  else if (isSuccess) state = 'isSuccess'
  else if (isCheckError) state = 'isCheckError'

  //   default is isLoading state
  let icon = 'sync',
    message = 'Checking bundle compatibility...'
  switch (state) {
    case 'isError':
      icon = 'error'
      message = 'Bundle has unresolved compatibility errors'
      break
    case 'isWarning':
      icon = 'warning'
      message = 'Bundle has compatibility warnings'
      break
    case 'isSuccess':
      icon = 'verified'
      message = 'Checks complete: Bundle is compatible'
      break
    case 'isCheckError':
      icon = 'sync_problem'
      message = 'Error checking bundle compatibility'
      break
  }

  //   sort by severity error first then by addon name
  const sortedIssues = [...issues].sort((a, b) => {
    if (a.severity === 'error' && b.severity !== 'error') {
      return -1
    } else if (a.severity !== 'error' && b.severity === 'error') {
      return 1
    } else {
      return a.addon.localeCompare(b.addon)
    }
  })

  return (
    <Styled.Checks>
      <Styled.Status className={clsx(state)}>
        <Icon icon={icon} />
        <span className={Typography.titleSmall}>{message}</span>
      </Styled.Status>
      {(isError || isWarning) && (
        <Styled.ErrorsList>
          {sortedIssues.map((issue, i) => (
            <Styled.ErrorItem
              key={i}
              className={clsx(issue.severity)}
              onClick={() => onIssueClick(issue.requiredAddon)}
            >
              <Icon icon={issue.severity} />
              {issue.addon}: {issue.message}
            </Styled.ErrorItem>
          ))}
        </Styled.ErrorsList>
      )}
    </Styled.Checks>
  )
}

export default BundleChecks
