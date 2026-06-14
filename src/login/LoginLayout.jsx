import { useMediaQuery, Paper } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import LogoImage from './LogoImage';

const useStyles = makeStyles()((theme) => ({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minHeight: '100vh',
    padding: theme.spacing(2),
    backgroundColor: '#ffffff',
  },
  sidebar: {
    display: 'none',
    justifyContent: 'center',
    alignItems: 'center',
    background: '#ffffff',
    paddingBottom: theme.spacing(5),
    width: theme.dimensions.sidebarWidth,
    [theme.breakpoints.down('lg')]: {
      width: theme.dimensions.sidebarWidthTablet,
    },
    [theme.breakpoints.down('sm')]: {
      width: '0px',
    },
  },
  paper: {
    background: 'linear-gradient(135deg,#1E8C86 0%,#2BA8A2 60%,#3CC4BD 100%)', // ← background, bukan backgroundColor
    borderRadius: 16,
    padding: theme.spacing(4),
    width: '100%',
    maxWidth: 380,
    boxShadow: '0 8px 30px rgba(0,0,0,0.18)',
  },
  form: {
    maxWidth: theme.spacing(52),
    padding: theme.spacing(5),
    width: '100%',
  },
}));

const LoginLayout = ({ children }) => {
  const { classes } = useStyles();
  const theme = useTheme();

  return (
    <main className={classes.root}>
      {/* <div className={classes.sidebar}>
        {!useMediaQuery(theme.breakpoints.down('lg')) && (
          <LogoImage color={theme.palette.secondary.contrastText} />
        )}
      </div> */}
      <Paper className={classes.paper}>
        <form className={classes.form}>{children}</form>
      </Paper>
    </main>
  );
};

export default LoginLayout;
