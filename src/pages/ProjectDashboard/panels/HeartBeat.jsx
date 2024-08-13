import React from 'react'
import { Chart } from 'primereact/chart'
import styled from 'styled-components'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import { useGetProjectDashboardQuery } from '@queries/getProjectDashboard'
import clsx from 'clsx'

const ChartStyled = styled(Chart)`
  width: 100%;
  height: 100%;
  min-height: 48px;
  max-height: 48px;

  canvas {
    height: 48px !important;
    width: 100% !important;
    aspect-ratio: unset;
  }
`

const HeartBeat = ({ projectName }) => {
  const {
    data = {},
    isFetching,
    isError,
  } = useGetProjectDashboardQuery({ projectName, panel: 'activity' })

  let { activity } = data

  if (isError || isFetching) {
    activity = [0, 0]
  }

  const chart = {
    labels: activity,
    datasets: [
      {
        data: activity,
        fill: false,
        borderColor: '#8FCEFF',
        borderWidth: 3,
        borderCapStyle: 'round',
        borderJoinStyle: 'round',
        pointStyle: false,
      },
    ],
  }

  const options = {
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
        beginAtZero: true,
      },
    },
    interaction: {
      intersect: false,
      mode: false,
    },
    plugins: {
      legend: {
        display: false,
      },
    },
    aspectRatio: false,
  }

  return (
    <DashboardPanelWrapper className={clsx({ loading: isFetching }, 'shimmer-dark')}>
      <ChartStyled data={chart} type={'line'} options={options} />
    </DashboardPanelWrapper>
  )
}

export default HeartBeat
