// ============================================================
// src/theme/tokens.ts — 设计令牌：日间/夜间色板、圆角、阴影、字体栈
// 苹果官网风格
// ============================================================

export interface ThemeTokens {
  bg: {
    primary: string;
    secondary: string;
    card: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  accent: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  shadow: string;
  radius: {
    card: number;
    button: number;
  };
  fontFamily: string;
}

/** 日间色板 — 苹果官网白底风格 */
export const lightTokens: ThemeTokens = {
  bg: {
    primary: '#FFFFFF',
    secondary: '#F5F5F7',
    card: '#FFFFFF',
  },
  text: {
    primary: '#1D1D1F',
    secondary: '#6E6E73',
    tertiary: '#8E8E93',
  },
  accent: '#0071E3',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  border: 'rgba(0,0,0,0.08)',
  shadow: '0 2px 12px rgba(0,0,0,0.06)',
  radius: {
    card: 16,
    button: 12,
  },
  fontFamily:
    "'Inter', 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

/** 夜间色板 — 苹果深色模式 */
export const darkTokens: ThemeTokens = {
  bg: {
    primary: '#000000',
    secondary: '#1D1D1F',
    card: '#1C1C1E',
  },
  text: {
    primary: '#F5F5F7',
    secondary: '#AEAEB2',
    tertiary: '#8E8E93',
  },
  accent: '#0A84FF',
  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',
  border: 'rgba(255,255,255,0.1)',
  shadow: '0 2px 12px rgba(0,0,0,0.3)',
  radius: {
    card: 16,
    button: 12,
  },
  fontFamily:
    "'Inter', 'PingFang SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

/** 根据主题模式获取令牌 */
export function getTokens(mode: 'light' | 'dark'): ThemeTokens {
  return mode === 'light' ? lightTokens : darkTokens;
}

/** CSS 变量注入字符串（用于 :root / .dark） */
export function getCssVars(mode: 'light' | 'dark'): string {
  const t = getTokens(mode);
  return [
    `--bg-primary: ${t.bg.primary};`,
    `--bg-secondary: ${t.bg.secondary};`,
    `--bg-card: ${t.bg.card};`,
    `--text-primary: ${t.text.primary};`,
    `--text-secondary: ${t.text.secondary};`,
    `--text-tertiary: ${t.text.tertiary};`,
    `--accent: ${t.accent};`,
    `--success: ${t.success};`,
    `--warning: ${t.warning};`,
    `--error: ${t.error};`,
    `--border: ${t.border};`,
    `--shadow: ${t.shadow};`,
    `--radius-card: ${t.radius.card}px;`,
    `--radius-button: ${t.radius.button}px;`,
    `--font-family: ${t.fontFamily};`,
  ].join('\n  ');
}
