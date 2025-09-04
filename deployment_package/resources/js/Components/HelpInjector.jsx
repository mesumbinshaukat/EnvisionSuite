import { useEffect } from 'react';
import React from 'react';
import { createRoot } from 'react-dom/client';
import InfoIcon from '@/Components/InfoIcon';

// Scans the DOM for elements carrying data-help-key, data-help or title
// and injects a React InfoIcon next to them. Re-runs on mutations.
export default function HelpInjector() {
  useEffect(() => {
    const injectedAttr = 'data-help-injected';

    const injectFor = (el) => {
      if (el.hasAttribute(injectedAttr)) return;
      const helpKey = el.getAttribute('data-help-key');
      const help = el.getAttribute('data-help') || (!helpKey ? el.getAttribute('title') : null);
      if (!helpKey && !help) return;

      // Create a container for the icon
      const container = document.createElement('span');
      container.style.display = 'inline-flex';
      container.style.marginLeft = '0.25rem';

      // Prefer injecting inside certain elements to avoid breaking layout
      const friendlyTags = new Set(['LABEL', 'TH', 'TD', 'SPAN', 'DIV', 'H1', 'H2', 'H3', 'H4']);
      if (friendlyTags.has(el.tagName)) {
        el.appendChild(container);
      } else {
        el.insertAdjacentElement('afterend', container);
      }
      const root = createRoot(container);
      root.render(React.createElement(InfoIcon, { helpKey, help }));
      el.setAttribute(injectedAttr, '1');
    };

    const scan = (node) => {
      const all = (node || document).querySelectorAll('[data-help-key], [data-help], [title]');
      all.forEach(injectFor);
    };

    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          m.addedNodes.forEach((n) => {
            if (n.nodeType === 1) scan(n);
          });
        } else if (m.type === 'attributes') {
          if (['data-help-key', 'data-help', 'title'].includes(m.attributeName)) {
            injectFor(m.target);
          }
        }
      }
    });

    scan(document);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-help-key', 'data-help', 'title'] });
    return () => observer.disconnect();
  }, []);

  return null;
}
