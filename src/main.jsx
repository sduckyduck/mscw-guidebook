import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import AppMediaEnhanced from './AppMediaEnhanced.jsx';
import CoverIntro from './components/CoverIntro.jsx';
import './styles.css';
import './styles/cover-intro.css';

function AppWithIntro() {
  const [entered, setEntered] = useState(false);
  return entered ? <AppMediaEnhanced /> : <CoverIntro onEnter={() => setEntered(true)} />;
}

const container = document.querySelector('#root');
const app = createRoot(container);

app.render(
  <React.StrictMode>
    <AppWithIntro />
  </React.StrictMode>,
);
