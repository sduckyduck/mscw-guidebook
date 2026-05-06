import React from 'react';
import { createRoot } from 'react-dom/client';
import AppGearFixed from './AppGearFixed.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppGearFixed />
  </React.StrictMode>,
);
