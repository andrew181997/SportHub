import { redirect } from "next/navigation";

/** Единая страница «Настройки сайта» объединяет тему и цвета. */
export default function ThemeSettingsRedirectPage() {
  redirect("/admin/settings/site");
}
