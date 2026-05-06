import React from 'react';
import { createRoot } from 'react-dom/client';
import AppCompact from './AppCompact.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppCompact />
  </React.StrictMode>,
);
