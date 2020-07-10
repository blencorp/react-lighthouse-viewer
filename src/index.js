import React from 'react';
import DOM from './renderer/dom';
import ReportRenderer from './renderer/report-renderer';
import ReportUIFeatures from './renderer/report-ui-features';
import './report-styles.css';
import __html from './templates';

export const Template = () => {
  return <div dangerouslySetInnerHTML={{ __html: __html }} />;
};

export default function ReportViewer({
  id = 'react-lighthouse-viewer',
  json = {},
}) {
  React.useEffect(() => {
    if (Object.keys(json).length === 0) return;
    if (json) {
      generateReport();
    }
  }, [json]);

  const generateReport = () => {
    const dom = new DOM(document);
    const renderer = new ReportRenderer(dom);

    const container = document.querySelector(`#${id}`);

    renderer.renderReport(json, container);

    // Hook in JS features and page-level event listeners after the report
    // is in the document.
    const features = new ReportUIFeatures(dom);
    features.initFeatures(json);
  };

  return (
    <div className="lh-root lh-vars">
      <Template />
      <div id={id} />
    </div>
  );
}
