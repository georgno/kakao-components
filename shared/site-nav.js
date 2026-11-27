/*
 * site-nav.js - the "Examples" menu in this project's page bar (the top-level
 * pages and the example pages, which share the bar through
 * shared/page-transition.js). Not part of any component.
 *
 * The example pages are listed here once. The menu shows the first MENU_MAX of
 * them; once there are more, it ends with "All examples" (examples.html, which
 * lists every one from the same list). A new example: add the page, put it in
 * EXAMPLES and in the copy list of .github/workflows/pages.yml.
 *
 * Load it in the head without defer, so examples.html's own script finds
 * window.kakaoSiteExamples when it runs.
 */
(function () {
  const EXAMPLES = [
    {
      href: 'kitchen-sink.html',
      label: 'Kitchen sink',
      text: 'Every component on one settings page, in each theme.',
    },
    {
      href: 'bmi-calculator.html',
      label: 'BMI calculator',
      text: 'Height and weight in metric or imperial units, and the result on a meter with named bands.',
    },
  ];
  const MENU_MAX = 5;
  const ALL = { href: 'examples.html', label: 'All examples' };

  window.kakaoSiteExamples = EXAMPLES.slice();

  function menuItems() {
    const items = EXAMPLES.slice(0, MENU_MAX).map(({ href, label }) => ({ label, value: href, href }));
    if (EXAMPLES.length > MENU_MAX) items.push('-', { label: ALL.label, value: ALL.href, href: ALL.href });
    return items;
  }

  const fileOf = (url) => new URL(url, location.href).pathname.split('/').pop() || 'index.html';

  // The trigger is not a link, so page-transition.js does not mark it: it
  // shows in weight while an example (or the list of them) is open.
  function markCurrent() {
    const trigger = document.getElementById('site-examples');
    if (!trigger) return;
    const here = fileOf(location.href);
    const on = here === ALL.href || EXAMPLES.some((e) => e.href === here);
    if (on) trigger.setAttribute('aria-current', 'true');
    else trigger.removeAttribute('aria-current');
  }

  function setup() {
    const menu = document.querySelector('kakao-menu[data-site-examples]');
    if (!menu) return;
    menu.setAttribute('list-data', JSON.stringify(menuItems()));
    // The menu's links live in its shadow root, out of page-transition.js's
    // reach: swap to the picked page the way the bar's own links do.
    menu.addEventListener('menu-select', (event) => {
      const href = event.detail && event.detail.item && event.detail.item.href;
      if (!href || !window.kakaoPageTransition) return;
      event.preventDefault();
      menu.close();
      window.kakaoPageTransition.navigate(href);
    });
    markCurrent();
    document.addEventListener('page-transition-swap', markCurrent);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setup);
  else setup();
})();
