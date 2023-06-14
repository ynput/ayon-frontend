import styled from 'styled-components'

const StyledBanner = styled.div`
  position: fixed;

  animation-name: delay-visibility;
  animation-duration: 0.2s;
  animation-fill-mode: forwards;
  visibility: hidden;

  @keyframes delay-visibility {
    to {
      visibility: visible;
    }
  }

  top: 40px;
  left: 50%;
  transform: translate(-50%, 0);
  z-index: 9999;
  background-color: var(--color-hl-error);
  border-radius: 5px;
  color: var(--color-text);
  padding: 10px;
  box-shadow: 0 0 20px 0 rgba(0, 0, 0, 0.5);

  h1 {
    margin: 0;
    padding: 0;
  }
`

const ServerRestartBanner = () => {
  return (
    <StyledBanner>
      <h1>Server is restarting</h1>
      You will not be able to save any changes or load new data until the server is back up. It
      should only take a few seconds.
    </StyledBanner>
  )
}

export default ServerRestartBanner
