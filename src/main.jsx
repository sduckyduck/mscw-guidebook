import React from 'react';
import { createRoot } from 'react-dom/client';
import AppVersionedGuide from './AppVersionedGuide.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppVersionedGuide />
  </React.StrictMode>,
);
