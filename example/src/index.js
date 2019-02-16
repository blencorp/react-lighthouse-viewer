import React from 'react';
import { render } from 'react-dom';
import ReportViewer from '../../src';

import jsonReport from './report.json';

const App = () => (
    <ReportViewer json={jsonReport} />
);
render(<App />, document.getElementById("root"));