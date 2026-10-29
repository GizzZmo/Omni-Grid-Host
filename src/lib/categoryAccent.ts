const ACCENTS: Record<string, string> = {
  SYSTEM: '#22d3ee',
  AUDIO: '#e879f9',
  NEURAL: '#a78bfa',
  DEV: '#34d399',
  SECOPS: '#fb7185',
  FINANCE: '#fbbf24',
  CREATIVE: '#fb923c',
};

export function categoryAccent(category: string) {
  return ACCENTS[category.toUpperCase()] || '#22d3ee';
}
