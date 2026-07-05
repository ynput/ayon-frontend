import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
    padding: theme.spacing(1),
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[1],
  },
  viewport: {
    overflow: 'hidden',
    flex: 1,
  },
  strip: {
    display: 'flex',
    gap: theme.spacing(0.5),
    transition: 'transform 0.3s ease',
  },
  thumb: {
    cursor: 'pointer',
    border: `2px solid transparent`,
    borderRadius: theme.shape.borderRadius,
    overflow: 'hidden',
    transition: 'border-color 0.2s, transform 0.2s',
    '&:hover': {
      borderColor: theme.palette.primary.light,
      transform: 'scale(1.02)',
    },
  },
  activeThumb: {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 0 0 2px ${theme.palette.primary.main}`,
  },
  img: {
    display: 'block',
    objectFit: 'cover',
  },
  navButton: {
    backgroundColor: theme.palette.action.hover,
    '&:hover': {
      backgroundColor: theme.palette.action.selected,
    },
    '&:disabled': {
      opacity: 0.3,
    },
  },
}));
