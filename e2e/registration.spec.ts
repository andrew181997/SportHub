import { test, expect } from "@playwright/test";

test.describe("Registration flow", () => {
  test("should show registration form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /создать лигу/i })).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("Иван Петров")).toBeVisible();
    await expect(page.getByPlaceholder("Минимум 8 символов")).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: /зарегистрироваться/i }).click();
    await expect(page.getByText(/введите/i).first()).toBeVisible();
  });

  test("should check slug availability", async ({ page }) => {
    await page.goto("/register");
    const slugInput = page.getByPlaceholder("myliga");
    await slugInput.fill("demo");
    await page.waitForTimeout(600);
    // "demo" is taken by seed
    await expect(page.getByText(/уже занят|свободен/i)).toBeVisible();
  });
});

test.describe("Platform pages", () => {
  test("should load landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/sporthub/i);
  });

  test("should load pricing page", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("body")).toBeVisible();
  });

  test("should load privacy page", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { name: /конфиденциальности/i })).toBeVisible();
  });
});
