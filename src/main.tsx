import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './i18n/i18n';
import './styles/global.css';

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('루트 엘리먼트(#root)를 찾지 못했습니다.');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
