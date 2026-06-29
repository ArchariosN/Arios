import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';
import { useUiStore } from '@/store/useUiStore';
import { createAppTheme } from '@/theme/theme';
import './index.css';

function Root(): React.ReactElement {
  const mode = useUiStore((s) => s.mode);
  const theme = createAppTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
);
