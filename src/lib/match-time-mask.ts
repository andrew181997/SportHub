/**
 * Маска времени MM:SS для протокола: до 4 цифр, отображение «mm:ss» после 2-й цифры.
 * Сохранённое значение «5:30» нормализуется в «05:30» для однозначного ввода.
 */

/** Как при сохранении протокола: минуты 1–2 цифры, секунды две цифры */
export const PROTOCOL_TIME_MMSS_RE = /^\d{1,2}:\d{2}$/;

/** Значение из БД / при загрузке привести к виду маски (например 5:30 → 05:30) */
export function normalizeTimeForMask(t: string): string {
  return formatDigitsToMmSs(canonicalTimeToDigits(t));
}

/** Разбор «m:ss» / «mm:ss» в ровно 4 цифры (mmss) для маски */
export function canonicalTimeToDigits(t: string): string {
  const s = t.trim();
  if (!s) return "";
  if (PROTOCOL_TIME_MMSS_RE.test(s)) {
    const [a, b] = s.split(":");
    const min = (a ?? "").padStart(2, "0").slice(-2);
    const sec = (b ?? "00").slice(0, 2).padStart(2, "0");
    return `${min}${sec}`.slice(0, 4);
  }
  return s.replace(/\D/g, "").slice(0, 4);
}

export function formatDigitsToMmSs(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 4);
  if (d.length === 0) return "";
  if (d.length <= 2) return d;
  return `${d.slice(0, 2)}:${d.slice(2)}`;
}

/**
 * @param prevTime — текущее отформатированное значение в поле
 * @param raw — новое значение из input (ввод, вставка, удаление)
 */
export function applyMmSsMask(prevTime: string, raw: string): string {
  const prevD = prevTime.replace(/\D/g, "").slice(0, 4);
  const nextD = raw.replace(/\D/g, "").slice(0, 4);
  const newD =
    nextD.length < prevD.length ? prevD.slice(0, -1) : nextD;
  return formatDigitsToMmSs(newD);
}
