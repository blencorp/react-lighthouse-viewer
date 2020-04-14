import React, { Component } from 'react';

import './report-styles.css';

import DOM from './renderer/dom';
import ReportRenderer from './renderer/report-renderer';
import ReportUIFeatures from './renderer/report-ui-features';
import Logger from './renderer/logger';

import __html from './templates';

export const Template = () => {
  return <div dangerouslySetInnerHTML={{ __html: __html }} />;
};

class ReportViewer extends Component {
  constructor(props) {
    super(props);
    document.addEventListener('lh-log', e => {
      const logger = new Logger(document.querySelector('#lh-log'));
      switch (e.detail.cmd) {
        case 'log':
          logger.log(e.detail.msg);
          break;
        case 'warn':
          logger.warn(e.detail.msg);
          break;
        case 'error':
          logger.error(e.detail.msg);
          break;
        case 'hide':
          logger.hide();
          break;
        default:
      }
    });
  }

  componentDidMount() {
    this.generateReport();
  }

  generateReport() {
    const { json } = this.props;

    const dom = new DOM(document);
    const renderer = new ReportRenderer(dom);

    const container = document.querySelector('main.react-lighthouse-viewer');

    renderer.renderReport(json, container);

    // Hook in JS features and page-level event listeners after the report
    // is in the document.
    const features = new ReportUIFeatures(dom);
    features.initFeatures(json);
  }

  render() {
    return (
      <div className="lh-root lh-vars">
        <Template />
        <main className="react-lighthouse-viewer">
          {/* report populated here */}
        </main>
        <div id="lh-log" />
      </div>
    );
  }
}

export default ReportViewer;
