import React, { useEffect } from 'react';
import DOM from './renderer/dom';
import ReportRenderer from './renderer/report-renderer';
import ReportUIFeatures from './renderer/report-ui-features';

import __html from './templates';

export const Template = () => {
  return <div dangerouslySetInnerHTML={{ __html }} />;
};

// return features to re-use
const generateReport = (json, id) => {
  const dom = new DOM(document);
  const renderer = new ReportRenderer(dom);
  const container = document.querySelector(`#${id}`);
  renderer.renderReport(json, container);
  const features = new ReportUIFeatures(dom);
  features.initFeatures(json);

  return features;
};

export default function ReportViewer({
  id = 'react-lighthouse-viewer',
  json = {},
}) {
  useEffect(() => {
    const exist = json && Object.keys(json).length !== 0;
    const features = exist && generateReport(json, id);

    return () => {
      if (features) {
        features.dropFeatures();
      }
    };
  }, [json, id]);

  return (
    <div className="lh-root lh-vars">
      <Template />
      <div id={id} />
    </div>
  );
}
