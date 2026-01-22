import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { FloatingWidget, WidgetConfig } from './Widget';
import '../index.css';

// Global widget instance management
interface WidgetInstance {
  root: Root;
  container: HTMLDivElement;
  config: WidgetConfig;
}

declare global {
  interface Window {
    ResumeBuilderWidget: {
      init: (config?: WidgetConfig) => WidgetInstance;
      destroy: (instance: WidgetInstance) => void;
      instances: WidgetInstance[];
    };
  }
}

// Initialize widget
const initWidget = (config: WidgetConfig = {}): WidgetInstance => {
  // Create container
  const container = document.createElement('div');
  container.id = `resume-builder-widget-${Date.now()}`;
  container.className = 'resume-builder-widget-root';
  document.body.appendChild(container);

  // Create React root and render
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <FloatingWidget config={config} />
    </React.StrictMode>
  );

  const instance: WidgetInstance = { root, container, config };
  window.ResumeBuilderWidget.instances.push(instance);

  return instance;
};

// Destroy widget instance
const destroyWidget = (instance: WidgetInstance): void => {
  instance.root.unmount();
  instance.container.remove();

  const index = window.ResumeBuilderWidget.instances.indexOf(instance);
  if (index > -1) {
    window.ResumeBuilderWidget.instances.splice(index, 1);
  }
};

// Auto-init function for data attribute elements
const autoInit = () => {
  const autoInitElements = document.querySelectorAll('[data-resume-builder-widget]');

  autoInitElements.forEach((element) => {
    const configAttr = element.getAttribute('data-resume-builder-config');
    let config: WidgetConfig = {};

    if (configAttr) {
      try {
        config = JSON.parse(configAttr);
      } catch (e) {
        console.error('Invalid widget configuration:', e);
      }
    }

    // Read individual data attributes
    const primaryColor = element.getAttribute('data-primary-color');
    const companyName = element.getAttribute('data-company-name');
    const companyLogo = element.getAttribute('data-company-logo');
    const apiUrl = element.getAttribute('data-api-url');
    const allowSignup = element.getAttribute('data-allow-signup');
    const defaultLanguage = element.getAttribute('data-default-language');

    if (primaryColor) config.primaryColor = primaryColor;
    if (companyName) config.companyName = companyName;
    if (companyLogo) config.companyLogo = companyLogo;
    if (apiUrl) config.apiUrl = apiUrl;
    if (allowSignup) config.allowSignup = allowSignup !== 'false';
    if (defaultLanguage) config.defaultLanguage = defaultLanguage;

    initWidget(config);
  });
};

// Expose to window
const widgetAPI = {
  init: initWidget,
  destroy: destroyWidget,
  instances: [] as WidgetInstance[],
};

// Assign to window immediately
(window as any).ResumeBuilderWidget = widgetAPI;

// Auto-init on DOMContentLoaded or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit);
} else {
  // DOM already loaded, init immediately
  autoInit();
}

// Export for ES module usage
export { initWidget, destroyWidget, widgetAPI as default };
