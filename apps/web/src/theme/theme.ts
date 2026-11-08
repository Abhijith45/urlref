import { createTheme } from '@mui/material/styles';

/**
 * Color Hunt Palette: https://colorhunt.co/palette/f4be38edda5e71951e587529
 * #F4BE38 - Warm Vibrant Golden Amber (Highlights, Badges, Stars)
 * #EDDA5E - Soft Sunlight Pastel Gold (Tinted accents, subtle pill backdrops)
 * #71951E - Fresh Vibrant Olive Green (Actions, Success, Secondary Buttons)
 * #587529 - Deep Forest Olive Green (Primary Brand Anchor, Headers, AAA Contrast)
 */
export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#587529', // Deep Forest Olive Green (AAA compliant)
      light: '#71951E', // Fresh Vibrant Olive Green
      dark: '#3F541D', // Deepest Olive
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#F4BE38', // Vibrant Golden Amber
      light: '#EDDA5E', // Soft Sunlight Gold
      dark: '#D9A120',
      contrastText: '#1C2411',
    },
    background: {
      default: '#FBFBFA', // Warm, organic editorial off-white
      paper: '#ffffff',
    },
    text: {
      primary: '#1C2411', // Deep rich olive-slate
      secondary: '#556345', // Warm muted olive-gray
    },
    divider: '#E4E9DC', // Soft natural hairline border
    success: {
      main: '#71951E',
      light: '#EDDA5E',
      contrastText: '#ffffff',
    },
    warning: {
      main: '#F4BE38',
      light: '#FAF0BD',
      contrastText: '#1C2411',
    },
    error: {
      main: '#D9483B',
      light: '#FDEAE8',
    },
  },
  typography: {
    fontFamily: ['Manrope', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'].join(','),
    h1: {
      fontSize: '3.75rem', // 60px
      lineHeight: '3.75rem',
      fontWeight: 600,
      letterSpacing: '-0.03em',
      textWrap: 'balance',
    },
    h2: {
      fontSize: '3rem', // 48px
      lineHeight: '3rem',
      fontWeight: 600,
      letterSpacing: '-0.025em',
      textWrap: 'balance',
    },
    h3: {
      fontSize: '2.25rem', // 36px
      lineHeight: '2.5rem',
      fontWeight: 600,
      letterSpacing: '-0.02em',
      textWrap: 'balance',
    },
    h4: {
      fontSize: '1.875rem', // 30px
      lineHeight: '2.25rem',
      fontWeight: 600,
      letterSpacing: '-0.015em',
      textWrap: 'balance',
    },
    h5: {
      fontSize: '1.5rem', // 24px
      lineHeight: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
    },
    h6: {
      fontSize: '1.25rem', // 20px
      lineHeight: '1.75rem',
      fontWeight: 600,
    },
    subtitle1: {
      fontSize: '1.125rem',
      lineHeight: '1.75rem',
      fontWeight: 500,
      color: '#556345',
    },
    subtitle2: {
      fontSize: '1rem',
      lineHeight: '1.5rem',
      fontWeight: 500,
      color: '#556345',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: '1.5rem',
      fontWeight: 400,
      textWrap: 'pretty',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: 400,
      textWrap: 'pretty',
    },
    button: {
      fontSize: '1rem',
      lineHeight: '1.5rem',
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0',
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: '1rem',
      fontWeight: 400,
      color: '#556345',
    },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiButtonBase: {
      defaultProps: {
        disableRipple: true, // User requested: disableRipple globally
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true, // User requested: disableElevation globally
        disableRipple: true, // User requested: disableRipple globally
      },
      styleOverrides: {
        root: {
          borderRadius: 9, // Minimal rounded corner matching UI design
          padding: '8px 18px',
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 600,
          textTransform: 'none',
          transition: 'all 250ms cubic-bezier(0.22, 1, 0.36, 1)',
          '&:active': {
            transform: 'scale(0.98)',
          },
          '&:focus-visible': {
            outline: '2px solid #587529',
            outlineOffset: '2px',
          },
        },
        containedPrimary: {
          backgroundColor: '#587529',
          color: '#ffffff',
          '&:hover': {
            backgroundColor: '#4B6423',
          },
        },
        containedSecondary: {
          backgroundColor: '#F4BE38',
          color: '#1C2411',
          '&:hover': {
            backgroundColor: '#E5AF2B',
          },
        },
        outlinedPrimary: {
          borderColor: '#587529',
          color: '#587529',
          '&:hover': {
            backgroundColor: 'rgba(88, 117, 41, 0.06)',
            borderColor: '#3F541D',
          },
        },
      },
    },
    MuiIconButton: {
      defaultProps: {
        disableRipple: true, // User requested: disableRipple globally
      },
      styleOverrides: {
        root: {
          transition: 'all 200ms cubic-bezier(0.22, 1, 0.36, 1)',
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 10, // Unified minimal corner rounded matching button styling
          border: '1px solid #E4E9DC',
          boxShadow: 'none',
          backgroundImage: 'none',
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 10,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 9,
          backgroundColor: '#ffffff',
          fontFamily: 'Manrope, sans-serif',
          transition: 'border-color 250ms cubic-bezier(0.22, 1, 0.36, 1)',
          '& fieldset': {
            borderColor: '#E4E9DC',
          },
          '&:hover fieldset': {
            borderColor: '#71951E',
          },
          '&.Mui-focused fieldset': {
            borderColor: '#587529',
            borderWidth: 1.5,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8, // Unified minimal corner rounded matching button styling
          fontFamily: 'Manrope, sans-serif',
          fontWeight: 600,
        },
      },
    },
  },
});
