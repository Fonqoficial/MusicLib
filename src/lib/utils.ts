/**
 * Formatea una fecha ISO a un formato legible en español
 * Ejemplo: "2024-01-15" -> "15 de enero de 2024"
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return 'Fecha no disponible';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Convierte minutos a formato horas y minutos
 * Ejemplo: 125 -> "2h 5min"
 */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return 'Duración desconocida';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

/**
 * Traduce los niveles de dificultad al español
 */
export function translateDifficulty(difficulty: string): string {
  const translations: Record<string, string> = {
    beginner: 'Principiante',
    intermediate: 'Intermedio',
    advanced: 'Avanzado',
    expert: 'Experto',
  };
  return translations[difficulty] || difficulty;
}

/**
 * Crea un slug URL amigable
 * Ejemplo: "Sonata para Piano Nº 14" -> "sonata-para-piano-no-14"
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD') // Elimina acentos
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '') // Elimina caracteres especiales
    .trim()
    .replace(/\s+/g, '-') // Espacios por guiones
    .replace(/-+/g, '-'); // Evita guiones repetidos
}

/**
 * Trunca un texto largo y añade elipses
 */
export function truncate(text: string | null, length: number): string {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

/**
 * Debounce para evitar llamadas excesivas a la API durante la búsqueda
 */
export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return function (...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn(...args);
    }, delay);
  };
}
