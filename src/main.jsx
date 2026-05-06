import React from 'react';
import { createRoot } from 'react-dom/client';
import AppRealPreview from './AppRealPreview.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRealPreview />
  </React.StrictMode>,
);
