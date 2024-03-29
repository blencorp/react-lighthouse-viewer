import React from 'react';
import { render } from 'react-dom';

import ReportViewer from '../../src';

import './index.css';
import jsonReport from './report6.json';

const App = () => (
  <div className="App">
    <header className="App-header">
      <p>My Cool React Application</p>
    </header>
    <div className="App-content">
      <ReportViewer json={jsonReport} />
    </div>
  </div>
);
render(<App />, document.getElementById('root'));
