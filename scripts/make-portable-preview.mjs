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
const js = readFileSync(join(assetsDir, jsFile), 'utf8').replaceAll('</script', '<\\/script');

html = html
  .replace(/<script[^>]+src="[^"]+"[^>]*><\/script>/g, '')
  .replace(/<link[^>]+href="[^"]+\.css"[^>]*>/g, '');

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
${storageFallback}
<script type="module">${js}</script>`;

html = html.replace('</body>', `${inlineAssets}\n</body>`);
mkdirSync('preview', { recursive: true });
writeFileSync('preview/index.html', html, 'utf8');
console.log('Created preview/index.html');
