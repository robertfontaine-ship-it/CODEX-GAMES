import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const distDir = 'dist';
const assetsDir = join(distDir, 'assets');
const files = readdirSync(assetsDir);
const cssFile = files.find((file) => file.endsWith('.css'));
const jsFile = files.find((file) => file.endsWith('.js'));

if (!cssFile || !jsFile) {
  throw new Error('Production CSS or JavaScript asset was not found.');
}

let html = readFileSync(join(distDir, 'index.html'), 'utf8');
const css = readFileSync(join(assetsDir, cssFile), 'utf8');
const js = readFileSync(join(assetsDir, jsFile), 'utf8').replace(/<\/script/gi, '<\\/script');

html = html
  .replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/g, '')
  .replace(/<link[^>]+href="[^"]+\.css"[^>]*>/g, '')
  .replace(
    '<div id="root"></div>',
    `<div id="root"><main id="wrs-boot-status" style="min-height:100vh;display:grid;place-items:center;background:#050b14;color:#f5f7f9;font-family:system-ui,sans-serif;padding:2rem;text-align:center"><div><h1 style="margin:0 0 .75rem;color:#b7ff47">WRS QUEST</h1><p style="margin:0">Loading Floor 1…</p></div></main></div>`,
  );

const diagnostics = `
<script>
(() => {
  const showFailure = (message) => {
    const root = document.getElementById('root');
    if (!root) return;
    root.innerHTML = '<main style="min-height:100vh;display:grid;place-items:center;background:#050b14;color:#f5f7f9;font-family:system-ui,sans-serif;padding:2rem"><section style="max-width:680px;border:1px solid #ff4e45;background:#08111f;padding:1.5rem;border-radius:12px"><h1 style="color:#ff4e45;margin-top:0">WRS Quest could not start</h1><p style="line-height:1.5">' + String(message).replace(/[&<>]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[char])) + '</p><p style="color:#9bb0bf">Send a screenshot of this message so the exact browser failure can be repaired.</p></section></main>';
  };

  window.addEventListener('error', (event) => {
    showFailure(event.message || 'Unknown JavaScript error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    showFailure(event.reason?.message || event.reason || 'Unhandled startup error');
  });

  window.setTimeout(() => {
    if (document.getElementById('wrs-boot-status')) {
      showFailure('The game bundle loaded but did not render within 5 seconds.');
    }
  }, 5000);
})();
</script>`;

const storageFallback = `
<script>
(() => {
  try {
    const key = '__wrs_storage_test__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
  } catch {
    const memoryStore = {};
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        getItem(key) {
          return Object.prototype.hasOwnProperty.call(memoryStore, key) ? memoryStore[key] : null;
        },
        setItem(key, value) {
          memoryStore[key] = String(value);
        },
        removeItem(key) {
          delete memoryStore[key];
        },
        clear() {
          for (const key of Object.keys(memoryStore)) delete memoryStore[key];
        },
        key(index) {
          return Object.keys(memoryStore)[index] ?? null;
        },
        get length() {
          return Object.keys(memoryStore).length;
        }
      }
    });
  }
})();
</script>`;

const inlineAssets = `
<style>${css}</style>
${diagnostics}
${storageFallback}
<script>${js}\n//# sourceURL=wrs-quest-bundle.js</script>`;

html = html.replace('</body>', `${inlineAssets}\n</body>`);
mkdirSync('preview', { recursive: true });
writeFileSync('preview/index.html', html, 'utf8');
console.log('Created preview/index.html with visible startup diagnostics.');
