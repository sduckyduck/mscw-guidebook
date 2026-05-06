import React from 'react';
import { createRoot } from 'react-dom/client';
import AppEquipmentInteractive from './AppEquipmentInteractive.jsx';
import './styles.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppEquipmentInteractive />
  </React.StrictMode>,
);
