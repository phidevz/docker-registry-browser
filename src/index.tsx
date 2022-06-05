/*
 * Docker Registry Browser
 * Copyright (c) 2022 phidevz
 * 
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

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
