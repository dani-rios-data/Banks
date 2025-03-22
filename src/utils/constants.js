// Lista de bancos
export const BANKS = [
  'Bank of America',
  'Wells Fargo',
  'TD Bank',
  'Capital One',
  'PNC Bank'
];

// Orden de los meses para ordenación correcta
export const MONTH_ORDER = [
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 
  'August', 'September', 'October', 'November', 'December'
];

// Categorías de medios
export const MEDIA_CATEGORIES = ['Digital', 'Television', 'Audio', 'Print', 'Outdoor'];

// Configuración para PapaParse
export const PAPA_PARSE_CONFIG = {
  header: true,
  skipEmptyLines: true,
  delimitersToGuess: [',', '\t', '|', ';']
};

// Detalles de mapeos específicos por categoría de medio
export const MEDIA_DETAIL_MAPPINGS = {
  'Digital': 'Distributor',
  'Television': 'Program Name',
  'Audio': 'Distributor',
  'Print': 'Premium Position',
  'Outdoor': 'Display Type'
};

// Valores por defecto para filtros
export const DEFAULT_ACTIVE_TAB = 'summary';
export const DEFAULT_ACTIVE_MEDIA_TAB = 'Audio';
export const DEFAULT_FOCUSED_BANK = 'All';
export const DEFAULT_MEDIA_CATEGORY = 'All';