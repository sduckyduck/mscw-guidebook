import React from 'react';
import { createRoot } from 'react-dom/client';
import AppMediaEnhanced from './AppMediaEnhanced.jsx';
import './styles.css';

const container = document.querySelector('#root');
const app = createRoot(container);

app.render(
  <React.StrictMode>
    <AppMediaEnhanced />
  </React.StrictMode>,
);
