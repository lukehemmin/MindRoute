import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { koKR } from '@mui/material/locale';

// 기본 테마 설정
let theme = createTheme(
  {
    palette: {
      primary: {
        main: '#2563eb',
        light: '#93c5fd',
        dark: '#1d4ed8',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#9333ea',
        light: '#c4b5fd',
        dark: '#6d28d9',
        contrastText: '#ffffff',
      },
      error: {
        main: '#ef4444',
        light: '#fee2e2',
        dark: '#b91c1c',
      },
      warning: {
        main: '#f97316',
        light: '#ffedd5',
        dark: '#c2410c',
      },
      info: {
        main: '#06b6d4',
        light: '#cffafe',
        dark: '#0369a1',
      },
      success: {
        main: '#22c55e',
        light: '#dcfce7',
        dark: '#15803d',
      },
      background: {
        default: '#f5f7fb',
        paper: '#ffffff',
      },
      text: {
        primary: '#1e293b',
        secondary: '#64748b',
        disabled: '#94a3b8',
      },
      grey: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
        A100: '#f1f5f9',
        A200: '#e2e8f0',
        A400: '#94a3b8',
        A700: '#334155',
      },
      divider: 'rgba(203, 213, 225, 0.5)',
    },
    typography: {
      fontFamily: [
        '"Pretendard"',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
      ].join(','),
      h1: {
        fontWeight: 700,
        fontSize: '2.5rem',
      },
      h2: {
        fontWeight: 700,
        fontSize: '2rem',
      },
      h3: {
        fontWeight: 600,
        fontSize: '1.75rem',
      },
      h4: {
        fontWeight: 600,
        fontSize: '1.5rem',
      },
      h5: {
        fontWeight: 600,
        fontSize: '1.25rem',
      },
      h6: {
        fontWeight: 600,
        fontSize: '1rem',
      },
      subtitle1: {
        fontSize: '1rem',
        fontWeight: 500,
      },
      subtitle2: {
        fontSize: '0.875rem',
        fontWeight: 500,
      },
      body1: {
        fontSize: '1rem',
      },
      body2: {
        fontSize: '0.875rem',
      },
      button: {
        fontWeight: 600,
        textTransform: 'none',
      },
    },
    shape: {
      borderRadius: 8,
    },
    shadows: [
      'none',
      '0px 1px 2px rgba(15, 23, 42, 0.06)',
      '0px 1px 3px rgba(15, 23, 42, 0.1), 0px 1px 2px rgba(15, 23, 42, 0.06)',
      '0px 4px 8px -2px rgba(15, 23, 42, 0.1), 0px 2px 4px -2px rgba(15, 23, 42, 0.06)',
      '0px 12px 16px -4px rgba(15, 23, 42, 0.08), 0px 4px 6px -2px rgba(15, 23, 42, 0.03)',
      '0px 20px 24px -4px rgba(15, 23, 42, 0.08), 0px 8px 8px -4px rgba(15, 23, 42, 0.03)',
      '0px 24px 32px -8px rgba(15, 23, 42, 0.08), 0px 16px 24px -4px rgba(15, 23, 42, 0.03)',
      '0px 32px 64px -12px rgba(15, 23, 42, 0.12), 0px 16px 32px -4px rgba(15, 23, 42, 0.08)',
      ...Array(17).fill('none'),
    ],
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
            fontWeight: 600,
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0px 4px 8px -2px rgba(15, 23, 42, 0.1), 0px 2px 4px -2px rgba(15, 23, 42, 0.06)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.1), 0px 1px 2px rgba(15, 23, 42, 0.06)',
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            boxShadow: '0px 4px 8px -2px rgba(15, 23, 42, 0.1), 0px 2px 4px -2px rgba(15, 23, 42, 0.06)',
            borderRadius: '12px',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
          outlined: {
            borderColor: '#e2e8f0',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: 'small',
        },
      },
      MuiSelect: {
        defaultProps: {
          size: 'small',
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            fontSize: '0.875rem',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontSize: '0.75rem',
            height: '24px',
          },
        },
      },
    },
  },
  koKR // 한국어 로케일 설정
);

// 반응형 폰트 크기 적용
theme = responsiveFontSizes(theme);

export default theme;
