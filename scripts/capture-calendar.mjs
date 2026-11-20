import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium, expect } from '@playwright/test';

const url = process.env.ORBIT_COMPARE_URL ?? 'http://127.0.0.1:5173';
const output = new URL('../evidence/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();

try {
  for (const [name, viewport] of Object.entries({
    desktop: { width: 1440, height: 900 },
    mobile: { width: 390, height: 844 },
  })) {
    const page = await browser.newPage({ viewport, locale: 'ru-RU' });
    await page.clock.setFixedTime(new Date(2026, 10, 20, 12));
    await page.goto(url + '/calendar?date=2026-11-28');
    await expect(page.getByText('1 дедлайн · 1 событие · 1 день рождения', { exact: true })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Повестка' }).getByText('27 ноя — 2 дек · день 2 из 6')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const capture = async (screen) => page.screenshot({
      path: fileURLToPath(new URL(screen + '-' + name + '.png', output)),
      fullPage: true,
    });
    await capture('calendar');
    await page.getByRole('link', { name: 'Планы', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Собрать список книг' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Пройти маршрут вдоль залива' })).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
    await capture('gallery');
    await page.close();
    console.log(name, viewport.width + '×' + viewport.height, 'OK');
  }
} finally {
  await browser.close();
}
