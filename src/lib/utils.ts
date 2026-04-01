import { formatDate, formatDuration, translateDifficulty, slugify, truncate, debounce } from '@/lib/utils';

// Formatear fecha
formatDate('2024-01-15'); // "15 de enero de 2024"

// Formatear duración
formatDuration(125); // "2h 5min"

// Traducir dificultad
translateDifficulty('advanced'); // "Avanzado"

// Crear slug
slugify('Sonata para Piano Nº 14'); // "sonata-para-piano-no-14"

// Truncar texto
truncate('Texto muy largo...', 20); // "Texto muy largo..."

// Debounce para búsquedas
const handleSearch = debounce((query: string) => {
  // Buscar después de 500ms sin escribir
}, 500);