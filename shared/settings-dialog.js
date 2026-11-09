/**
 * Site settings, as a dialog instead of a page of its own.
 * ============================================================================
 * For this project's top-level pages only, like page-cloak.js; not part of any
 * component. It builds one <kakao-dialog> with the theme setting and the links
 * to the construction pages, and opens it from:
 *   - any element with data-settings-open (the gear in the page tools), and
 *   - a link to #settings (a menu entry, or a URL someone shared).
 *
 * The page must load what the dialog uses: button.css, button.js,
 * switch-group.js, multi-dropdown.js and dialog.js.
 *
 *   <button type="button" class="page-icon-link" data-settings-open
 *     aria-label="Settings" title="Settings"><i class="fas fa-gear" aria-hidden="true"></i></button>
 *   <script src="shared/settings-dialog.js" defer></script>
 * ============================================================================
 */
(function () {
  'use strict';

  const HASH = '#settings';
  const THEMES = [
    { value: 'light', label: 'Light' }, { value: 'beige', label: 'Beige' }, { value: 'umber', label: 'Umber' },
    { value: 'dark', label: 'Dark' }, { value: 'amoled', label: 'AMOLED' }, { value: 'catppuccin', label: 'Catppuccin' },
    { value: 'forest', label: 'Forest' },
  ];
  const PAGES = [
    ['tokens.html', 'Main variables', 'Colours, type, spacing, motion'],
    ['components/button/construction.html', 'Button', 'Variants, sizes, menu'],
    ['components/card/construction.html', 'Card', 'Surface, padding, glow'],
    ['components/color-picker/construction.html', 'Color picker', 'Field, popover, swatches'],
    ['components/file-upload/construction.html', 'File upload', 'Drop zone, density'],
    ['components/list/construction.html', 'List', 'Rows, fade, radius'],
    ['components/multi-dropdown/construction.html', 'Multi dropdown', 'Segments, popup'],
    ['components/number-input/construction.html', 'Number input', 'Steppers, sizes'],
    ['components/popover/construction.html', 'Popover', 'Surface, shadow, offset'],
    ['components/slider/construction.html', 'Slider', 'Track, thumb, steppers'],
    ['components/step-switch/construction.html', 'Step switch', 'Track, thumb, labels'],
    ['components/switch-group/construction.html', 'Switch group', 'Track, thumb, labels'],
    ['components/tabs/construction.html', 'Tabs', 'Track, thumb, sizes'],
    ['components/theme-switch/construction.html', 'Theme switch', 'Button, ripple, fade'],
    ['components/animated-number/construction.html', 'Animated number', 'Font, duration'],
  ];

  const CSS = `
    .site-settings h3 { margin: 1.4rem 0 0.35rem; font-size: 0.95rem; font-weight: 600; }
    .site-settings h3:first-child { margin-top: 0; }
    .site-settings p { margin: 0 0 0.75rem; font-size: 0.875rem; color: var(--kakao-color-text-soft, #52525b); }
    /* The style guide's theme panels: each one carries data-kakao-theme, so
       the components inside it render in that theme. A smaller variant on
       purpose (sm buttons, tighter padding): the dialog is narrower than the
       guide, and on a phone the full size wraps the buttons and cuts the year. */
    .site-settings .site-settings-themes {
      display: grid;
      gap: 0.75rem;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
      margin-bottom: 0.75rem;
    }
    .site-settings .site-settings-theme {
      display: grid;
      gap: 0.8rem;
      padding: 1rem 1.1rem;
      border: 1px solid var(--kakao-color-line, #e5e7eb);
      border-radius: 14px;
      background: var(--kakao-color-page, #fff);
      color: var(--kakao-color-text, #18181b);
    }
    .site-settings .site-settings-theme h4 { margin: 0; font-size: 0.9rem; }
    .site-settings .site-settings-buttons { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .site-settings .site-settings-grid {
      display: grid;
      gap: 0.6rem;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr));
      margin-bottom: 0.75rem;
    }
    .site-settings .site-settings-card {
      display: grid;
      gap: 0.1rem;
      padding: 0.7rem 0.85rem;
      border: 1px solid var(--kakao-color-line, #e5e7eb);
      border-radius: 10px;
      color: inherit;
      text-decoration: none;
    }
    .site-settings .site-settings-card:hover { border-color: var(--kakao-color-border, #82828b); }
    .site-settings .site-settings-card:focus-visible { outline: 2px solid var(--kakao-color-focus, #2563eb); outline-offset: 2px; }
    .site-settings .site-settings-card b { font-size: 0.875rem; font-weight: 600; }
    .site-settings .site-settings-card span { font-size: 0.78rem; color: var(--kakao-color-text-soft, #52525b); }
  `;

  const SWITCHES = JSON.stringify([{ name: 'a', label: 'On', checked: true }, { name: 'b', label: 'Off' }]);
  const themePanel = ({ value, label }) => `
    <div class="site-settings-theme" data-kakao-theme="${value}">
      <h4>${label}</h4>
      <div class="site-settings-buttons">
        <kakao-button label="Save" size="sm"></kakao-button>
        <kakao-button label="Cancel" variant="secondary" size="sm"></kakao-button>
        <kakao-button label="Delete" variant="danger" size="sm"></kakao-button>
      </div>
      <kakao-switch-group label="${label} switches" list-data='${SWITCHES}'></kakao-switch-group>
      <kakao-multi-dropdown type="date" label="Date of birth" allow-unknown="day,month" value="00.00.1990"></kakao-multi-dropdown>
    </div>`;

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

  function build() {
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);

    const dialog = document.createElement('kakao-dialog');
    dialog.id = 'site-settings';
    dialog.setAttribute('size', 'lg');
    dialog.setAttribute('label', 'Settings');
    dialog.innerHTML = `
      <h2 slot="header">Settings</h2>
      <div class="site-settings">
        <h3>Themes</h3>
        <p>The same components in every theme. Pick one with the theme menu in the corner; it is stored in this browser and used on every page.</p>
        <div class="site-settings-themes">
          ${THEMES.map(themePanel).join('')}
        </div>

        <h3>Component settings</h3>
        <p>Each component's look is a set of <code>--kakao-&lt;component&gt;-*</code> custom properties, edited live on its construction page.</p>
        <div class="site-settings-grid">
          ${PAGES.map(([href, name, what]) => `<a class="site-settings-card" href="${href}"><b>${esc(name)}</b><span>${esc(what)}</span></a>`).join('')}
        </div>
        <p>Saving needs the construction server: <code>node tools/construct-server.js</code>, then open a construction page from <code>http://localhost:8790</code>.</p>
      </div>
      <div slot="footer">
        <kakao-button label="Done" data-close="done"></kakao-button>
      </div>`;
    document.body.appendChild(dialog);
    return dialog;
  }

  function init() {
    let dialog = null;
    const get = () => {
      if (!dialog) {
        dialog = build();
        // Closing drops #settings from the address, without a history entry.
        // (The dialog itself returns focus to whatever opened it.)
        dialog.addEventListener('dialog-close', () => {
          if (location.hash === HASH) history.replaceState(null, '', location.pathname + location.search);
        });
      }
      return dialog;
    };
    const open = () => {
      customElements.whenDefined('kakao-dialog').then(() => {
        const d = get();
        if (!d.isOpen) d.open();
      });
    };

    document.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-settings-open], a[href="#settings"]');
      if (!trigger) return;
      event.preventDefault();
      open();
    });
    window.addEventListener('hashchange', () => { if (location.hash === HASH) open(); });
    if (location.hash === HASH) open();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
