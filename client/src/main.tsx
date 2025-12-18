import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { GuestModeProvider } from './contexts/GuestModeContext';
import { ThemeProvider } from './contexts/ThemeContext';
// import { NotificationProvider } from './contexts/NotificationContext'; // Uncomment if you have this

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <GuestModeProvider>
        <ThemeProvider>
           {/* <NotificationProvider> */}
            <App />
           {/* </NotificationProvider> */}
        </ThemeProvider>
      </GuestModeProvider>
    </AuthProvider>
  </React.StrictMode>
);
