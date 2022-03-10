import React from 'react';
import ReactDOM from 'react-dom';
import { Alert } from 'antd';

import App from './App';

import './index.css';

const { ErrorBoundary } = Alert;

ReactDOM.render(
  <React.StrictMode>
    <ErrorBoundary>
        <App />
    </ErrorBoundary>
  </React.StrictMode >,
  document.getElementById('root')
);
