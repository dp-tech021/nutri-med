import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8');
const token = (name) => {
  const match = css.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, 'i'));
  assert(match, `token --${name} não encontrado`);
  return match[1];
};
const luminance = (hex) => {
  const channels = hex.match(/[0-9a-f]{2}/gi).map((value) => parseInt(value, 16) / 255).map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};
const contrast = (foreground, background) => {
  const first = luminance(foreground);
  const second = luminance(background);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
};

test('combinações críticas atendem contraste AA para texto normal', () => {
  const pairs = [
    [token('color-text'), token('color-background')],
    ['#ffffff', token('color-primary')],
    [token('color-primary'), '#ffffff'],
    [token('color-text'), token('color-secondary')],
    [token('color-error'), token('color-error-bg')],
    ['#ffffff', token('color-error')],
    [token('color-warning-text'), token('color-warning-bg')],
    [token('color-muted'), '#ffffff'],
  ];
  for (const [foreground, background] of pairs) {
    assert(contrast(foreground, background) >= 4.5, `${foreground} sobre ${background} ficou abaixo de 4.5:1`);
  }
});
