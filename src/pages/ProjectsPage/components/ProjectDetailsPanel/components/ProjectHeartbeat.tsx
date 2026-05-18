import { Chart } from 'primereact/chart'
import styled from 'styled-components'
import { useGetProjectDashboardQuery } from '@queries/getProjectDashboard'
import { memo } from 'react'

const ChartStyled = styled(Chart)`
  width: 100%;
  height: 100%;
  min-height: 40px;
  max-height: 40px;

  canvas {
    height: 40px !important;
    width: 100% !important;
    aspect-ratio: unset;
  }
`

interface ProjectHeartbeatProps {
  projectName: string
}

const ProjectHeartbeat = ({ projectName }: ProjectHeartbeatProps) => {
  const {
    data = {},
    isFetching,
    isError,
  } = useGetProjectDashboardQuery({ projectName, panel: 'activity' })

  let { activity } = data as { activity?: number[] }

  if (isError || isFetching) {
    activity = [0, 0]
  }

  const chart = {
    labels: activity,
    datasets: [
      {
        data: activity,
        fill: false,
        borderColor: '#8B9198',
        borderWidth: 2,
        borderCapStyle: 'round',
        borderJoinStyle: 'round',
        pointStyle: false,
      },
    ],
  }

  const options = {
    scales: {
      x: { display: false },
      y: { display: false, beginAtZero: true },
    },
    interaction: {
      intersect: false,
      mode: false,
    },
    plugins: {
      legend: { display: false },
    },
    aspectRatio: false,
    animation: false,
  }

  return <ChartStyled data={chart} type="line" options={options} />
}

export default memo(ProjectHeartbeat)
