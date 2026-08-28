// Local diagnostic: open the app with ?herdr_debug=viewport to overlay the
// numbers behind a layout gap on a device without an inspector. Not shipped
// upstream.
const DEBUG_KEY = 'herdr_debug_viewport';

export function viewportDebugEnabled(): boolean {
  try { return localStorage.getItem(DEBUG_KEY) === '1'; } catch { return false; }
}

export function setViewportDebug(enabled: boolean): void {
  try {
    if (enabled) localStorage.setItem(DEBUG_KEY, '1');
    else localStorage.removeItem(DEBUG_KEY);
  } catch { /* storage unavailable */ }
  location.reload();
}

export function mountViewportDebug(): void {
  const param = new URLSearchParams(location.search).get('herdr_debug');
  if (param === 'viewport') { try { localStorage.setItem(DEBUG_KEY, '1'); } catch { /* ignore */ } }
  if (param === 'off') { try { localStorage.removeItem(DEBUG_KEY); } catch { /* ignore */ } }
  if (!viewportDebugEnabled()) return;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);';
  const units = ['100vh', '100dvh', '100svh', '100lvh', '100%'].map((unit) => {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;left:-9999px;top:0;width:1px;height:${unit};`;
    document.body.append(el);
    return [unit, el] as const;
  });
  document.body.append(probe);
  const panel = document.createElement('pre');
  panel.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;margin:0;padding:.4rem;background:rgba(0,0,0,.85);color:#0f0;font:11px/1.35 ui-monospace,monospace;pointer-events:none;white-space:pre;max-width:100vw;';
  document.body.append(panel);
  const rect = (selector: string) => {
    const el = document.querySelector(selector);
    if (!el) return 'n/a';
    const r = el.getBoundingClientRect();
    return `top=${r.top.toFixed(1)} bottom=${r.bottom.toFixed(1)} h=${r.height.toFixed(1)}`;
  };
  const update = () => {
    const probeStyle = getComputedStyle(probe);
    const vv = window.visualViewport;
    panel.textContent = [
      `standalone media=${matchMedia('(display-mode: standalone)').matches} nav=${String((navigator as Navigator & { standalone?: boolean }).standalone)}`,
      `screen=${screen.width}x${screen.height} inner=${innerWidth}x${innerHeight} docEl.clientH=${document.documentElement.clientHeight}`,
      `visualViewport h=${vv?.height.toFixed(1)} offsetTop=${vv?.offsetTop.toFixed(1)} scale=${vv?.scale}`,
      `safe-area top=${probeStyle.paddingTop} bottom=${probeStyle.paddingBottom}`,
      ...units.map(([unit, el]) => `${unit}=${el.getBoundingClientRect().height.toFixed(1)}`),
      `.app-shell ${rect('.app-shell')}`,
      `.app-header ${rect('.app-header')}`,
      `.terminal-layout ${rect('.terminal-layout')}`,
      `.terminal-view ${rect('.terminal-view')}`,
      `.terminal-bottom ${rect('.terminal-bottom')}`,
      `.question-term-keys ${rect('.question-term-keys')}`,
      `body ${rect('body')} scrollY=${scrollY}`,
      `ua=${navigator.userAgent.slice(0, 60)}`,
    ].join('\n');
  };
  update();
  addEventListener('resize', update);
  window.visualViewport?.addEventListener('resize', update);
  window.visualViewport?.addEventListener('scroll', update);
  setInterval(update, 1000);
}
