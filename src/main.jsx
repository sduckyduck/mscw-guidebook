import React from 'react';
import { createRoot } from 'react-dom/client';
import AppDashboard from './AppDashboard.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppDashboard />
  </React.StrictMode>,
);
