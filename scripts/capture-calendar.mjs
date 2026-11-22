import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";

const url = process.env.ORBIT_COMPARE_URL ?? "http://127.0.0.1:5173";
const output = new URL("../evidence/", import.meta.url);
await mkdir(output, { recursive: true });
const browser = await chromium.launch();

try {
  for (const [name, viewport] of Object.entries({
    desktop: { width: 1440, height: 900 },
    mobile: { width: 390, height: 844 },
  })) {
    const page = await browser.newPage({ viewport, locale: "ru-RU" });
    await page.clock.setFixedTime(new Date(2026, 10, 20, 12));
    const imported = process.env.ORBIT_CAPTURE_IMPORTED === "1";
    const capture = async (screen) =>
      page.screenshot({
        path: fileURLToPath(new URL(screen + "-" + name + ".png", output)),
        fullPage: true,
      });
    if (!imported) {
      await page.goto(url + "/calendar?date=2026-11-28");
      await expect(
        page.getByText("1 дедлайн · 1 событие · 1 день рождения", {
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page
          .getByRole("complementary", { name: "Повестка" })
          .getByText("27 ноя — 2 дек · день 2 из 6"),
      ).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await capture("calendar");
      const toggle = page.getByRole("switch", { name: "Учебные пары" });
      await expect(toggle).not.toBeChecked();
      await toggle.check();
      await page
        .getByRole("button", {
          name: "3 пары · пятница, 27 ноября 2026",
          exact: true,
        })
        .click();
      const agenda = page.getByRole("complementary", { name: "Повестка" });
      await expect(
        agenda.getByText("09:00–10:30 · Аудитория 2403"),
      ).toBeVisible();
      await expect(
        agenda.getByRole("heading", { name: "Поездка в Карелию" }),
      ).toBeVisible();
      await expect(
        page.getByText("1 дедлайн · 1 событие · 1 день рождения", {
          exact: true,
        }),
      ).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBe(viewport.width);
      await capture("schedule");
      await page.getByRole("link", { name: "Планы", exact: true }).click();
      await expect(
        page.getByRole("heading", { name: "Собрать список книг" }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Пройти маршрут вдоль залива" }),
      ).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
        .toBe(viewport.width);
      await capture("gallery");
    }
    await page.goto(url + "/calendar?date=2026-11-19&view=week");
    await page.getByRole("switch", { name: "Учебные пары" }).check();
    await expect(page.getByRole("region", { name: "Неделя" })).toBeVisible();
    if (imported) {
      const week = page.getByRole("region", { name: "Неделя" });
      await expect(
        week.getByRole("button", { name: /Технологии ИИ/ }).first(),
      ).toBeVisible();
      await expect(week.getByText("Дискретная математика")).toHaveCount(0);
    }
    await page.getByRole("button", { name: "Тёмная тема" }).click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-mantine-color-scheme",
      "dark",
    );
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBe(viewport.width);
    await capture("week-dark");
    await page.close();
    console.log(name, viewport.width + "×" + viewport.height, "OK");
  }
} finally {
  await browser.close();
}
