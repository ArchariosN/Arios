// ============================================================
// src/theme/theme.ts — MUI 主题创建函数
// 映射 tokens 到 MUI createTheme，全量覆盖组件样式
// ============================================================

import { createTheme, type Theme } from '@mui/material/styles';
import type { ThemeMode } from '@/types';
import { getTokens, type ThemeTokens } from './tokens';

/**
 * 扩展 MUI Theme 类型，添加 custom 字段存储 tokens。
 */
declare module '@mui/material/styles' {
  interface Theme {
    custom: ThemeTokens;
  }
  interface ThemeOptions {
    custom?: ThemeTokens;
  }
}

/**
 * 创建苹果风格的 MUI 主题。
 *
 * @param mode - 主题模式 'light' | 'dark'
 * @returns MUI Theme 对象
 */
export function createAppTheme(mode: ThemeMode): Theme {
  const tokens = getTokens(mode);

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: tokens.accent,
        light: mode === 'light' ? '#4A9EFF' : '#409CFF',
        dark: mode === 'light' ? '#0058B0' : '#007AFF',
      },
      success: {
        main: tokens.success,
      },
      warning: {
        main: tokens.warning,
      },
      error: {
        main: tokens.error,
      },
      background: {
        default: tokens.bg.secondary,
        paper: tokens.bg.card,
      },
      text: {
        primary: tokens.text.primary,
        secondary: tokens.text.secondary,
      },
      divider: tokens.border,
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: tokens.fontFamily,
      h4: {
        fontSize: '2rem',
        fontWeight: 600,
        letterSpacing: '-0.02em',
      },
      h5: {
        fontSize: '1.5rem',
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h6: {
        fontSize: '1.125rem',
        fontWeight: 600,
      },
      button: {
        textTransform: 'none',
        fontWeight: 500,
      },
      body1: {
        fontSize: '0.95rem',
      },
      body2: {
        fontSize: '0.875rem',
      },
      caption: {
        fontSize: '0.75rem',
        color: tokens.text.tertiary,
      },
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: tokens.radius.card,
            boxShadow: tokens.shadow,
            border: `1px solid ${tokens.border}`,
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: tokens.radius.button,
            textTransform: 'none',
            fontWeight: 500,
            padding: '8px 20px',
          },
          contained: {
            boxShadow: 'none',
            '&:hover': {
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            },
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor:
              mode === 'light'
                ? 'rgba(255,255,255,0.72)'
                : 'rgba(28,28,30,0.72)',
            backdropFilter: 'blur(20px)',
            backgroundImage: 'none',
            borderBottom: `1px solid ${tokens.border}`,
            boxShadow: 'none',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: tokens.bg.primary,
            backgroundImage: 'none',
            borderRight: `1px solid ${tokens.border}`,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${tokens.border}`,
            fontSize: '0.875rem',
          },
          head: {
            fontWeight: 600,
            color: tokens.text.secondary,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: tokens.radius.card,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            fontWeight: 500,
          },
        },
      },
      MuiListItemButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            margin: '2px 8px',
            '&.Mui-selected': {
              backgroundColor:
                mode === 'light'
                  ? 'rgba(0,113,227,0.08)'
                  : 'rgba(10,132,255,0.15)',
            },
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          size: 'small',
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: tokens.text.tertiary,
          },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: tokens.bg.secondary,
          },
        },
      },
    },
    custom: tokens,
  });

  return theme;
}
