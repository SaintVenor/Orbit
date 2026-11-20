import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { expect } from '@playwright/test';

const output = new URL('../evidence/', import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  for (const [name, viewport] of Object.entries({
    desktop: { width: 1440, height: 900 },
    mobile: { width: 390, height: 844 },
  })) {
    const page = await browser.newPage({ viewport });
    await page.goto(new URL('../design/prototype.html', import.meta.url).href);
    const review = page.getByRole('complementary', { name: 'Проверка макета' });
    const agenda = page.getByRole('complementary', { name: 'Повестка' });
    await expect(page.getByRole('heading', { name: 'Ноябрь 2026' })).toBeVisible();
    await expect(agenda.getByText('Поездка в Карелию')).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(viewport.width);
    await page.screenshot({ path: fileURLToPath(new URL('prototype-' + name + '.png', output)), fullPage: true });
    await page.getByRole('button', { name: 'Следующий месяц' }).click();
    await expect(agenda.getByText('27 ноя — 2 дек · день 5 из 6')).toBeVisible();
    await review.getByRole('button', { name: 'Ошибка', exact: true }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Название' })).toHaveValue('Поездка в Карелию');
    await page.keyboard.press('Escape');
    await review.getByRole('button', { name: 'Пустой день' }).click();
    await agenda.getByRole('button', { name: 'Выбрать шаг из планов' }).click();
    await page.getByRole('button', { name: 'Собрать черновик', exact: true }).click();
    await agenda.getByRole('button', { name: 'Отметить выполненным' }).click();
    await agenda.getByRole('button', { name: 'Снять первый короткий ролик' }).click();
    await expect(page.getByText('2 из 3')).toBeVisible();
    await page.close();
    console.log(name, viewport.width + '×' + viewport.height, 'OK');
  }
} finally {
  await browser.close();
}
