import React from 'react'
import { Chart } from 'primereact/chart'
import styled from 'styled-components'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import { useGetProjectHeartbeatQuery } from '/src/services/projectDashboard/getProjectHeartbeat'

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

// create demo data function
const createDemoData = (length) => {
  // DEMO DATA
  let demoData = []
  for (let i = 0; i < length; i++) {
    let v = Math.floor(Math.random() * (length - i * 10)) + i * 10
    if (i < length / 2) v = v / 1.5
    if (i < length / 4) v = v / 1.5
    demoData[i] = v
  }

  return demoData
}

const HeartBeat = ({ projectName }) => {
  const useDemoData = true

  let {
    data: chartData,
    isLoading,
    isError,
  } = useGetProjectHeartbeatQuery({ projectName }, { skip: useDemoData })

  if (useDemoData) {
    chartData = createDemoData(80)
  }

  if (isError || isLoading) {
    chartData = [0, 0]
  }

  const chart = {
    labels: chartData,
    datasets: [
      {
        data: chartData,
        fill: false,
        borderColor: '#47b7da',
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
    <DashboardPanelWrapper isError={isError}>
      <ChartStyled data={chart} type={'line'} options={options} />
    </DashboardPanelWrapper>
  )
}

export default HeartBeat
