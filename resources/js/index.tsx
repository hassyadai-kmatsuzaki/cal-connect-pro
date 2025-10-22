import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import App from './App';
import '../css/app.css';

console.log('[Index] Starting Cal Connect application...');

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
  },
});

console.log('[Index] Looking for #app element...');
const container = document.getElementById('app');

if (container) {
  console.log('[Index] Found #app element, creating root...');
  try {
    const root = createRoot(container);
    console.log('[Index] Root created, rendering app...');
    root.render(
      <React.StrictMode>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </React.StrictMode>
    );
    console.log('[Index] App rendered successfully!');
  } catch (error) {
    console.error('[Index] Error rendering app:', error);
  }
} else {
  console.error('[Index] Could not find #app element!');
}
