// ============================================================
// TechOps Asset Manager - Constants
// Domain values extracted from actual Excel data
// ============================================================

// --- EQUIPOS ---
export const TIPO_EQUIPO = [
  'NOTEBOOK',
  'WORKSTATION',
  'THIN CLIENT',
  'MACBOOK',
] as const;

export const MARCA_EQUIPO = [
  'DELL', 'LENOVO', 'HP', 'APPLE', 'BANGHO', 'ACER', 'ASUS',
  'ARM', 'Clon', 'SAMSUNG',
] as const;

export const ESTADO_EQUIPO = [
  'ACTIVO',
  'STOCK',
  'STOCK AREA',
  'BAJA EFECTIVA',
  'A RECUPERAR',
  'Donado',
  'ROTURA FUERA GARANTIA',
] as const;

export const ESTADO_SECUNDARIO_EQUIPO = [
  'ASIGNADO',
  'DISPONIBLE',
  'RESERVADO',
  'A RECUPERAR USUARIO',
  'FUERA GARANTIA',
  'GARANTIA',
  'IRRECUPERABLE',
  'ONBOARDING',
  'PRESTAMO',
  'OBSOLESENCIA',
  'PERFORMANCE',
  'DONADO',
  'Donado/Destruido',
  'ROTO EN GARANTIA',
  'ROTO FUERA GARANTIA',
] as const;

export const MOTIVO_ASIGNACION = [
  'Nueva Posición',
  'Posición Vacante',
  'Programa People (Traniee, GMT)',
  'Asignación a Tercero',
  'Préstamo',
  'Recambio equipo',
  'Reservado area',
  'Rotura Fuera Garantia',
  'Robo de Equipo',
  'Donado',
  'Nuevo',
  'Pendiente Devolución',
] as const;

export const PRINCIPAL_SECUNDARIA = ['Principal', 'Secundaria', '-'] as const;

// --- CELULARES ---
export const TIPO_CELULAR = [
  'CELULAR',
  'TABLET',
  'MODEM',
  'BASE CELULAR',
  'LINEA DEL USUARIO',
] as const;

export const MARCA_CELULAR = [
  'SAMSUNG', 'APPLE', 'ALCATEL', 'NOKIA', 'LG', 'MOTOROLA',
] as const;

export const PLAN_CELULAR = [
  'MINUTOS',
  'DATOS',
  'MINUTOS+DATOS',
  'INTRAGRUPO',
  '6GB CON ANTIVIRUS',
] as const;

export const PROVEEDOR_CELULAR = [
  'Claro', 'Movistar', 'SIELEN', 'LINEA DEL USUARIO',
] as const;

// --- LINEAS ---
export const TIPO_LINEA = [
  'CORPORATIVA', 'PERSONAL', 'DATOS', 'INTRAGRUPO',
] as const;

export const ESTADO_LINEA = [
  'ACTIVA', 'INACTIVA', 'SUSPENDIDA', 'BAJA',
] as const;

// --- INSUMOS ---
export const TIPO_INSUMO = [
  'CARGADOR',
  'HDMI',
  'ADAPTADOR',
  'INSUMO TECNICO',
  'CABLE',
  'MOUSE',
  'TECLADO',
  'AURICULAR',
  'WEBCAM',
  'DOCKING',
] as const;

// --- MOVIMIENTOS ---
export const TIPO_MOVIMIENTO = [
  'ASIGNACION_PC',
  'DEVOLUCION_PC',
  'ASIGNACION_CEL',
  'DEVOLUCION_CEL',
  'ENTREGA_INSUMO',
  'ROBO',
  'ROAMING',
  'ONBOARDING',
  'OFFBOARDING',
  'RECAMBIO',
  'TRANSFERENCIA',
] as const;

// --- DEVOLUCION ---
export const ESTADO_DEVOLUCION = [
  'STOCK',
  'A RECUPERAR',
  'BAJA EFECTIVA',
  'ROTURA FUERA GARANTIA',
] as const;

// --- PERFILES ---
export const PERFIL_USUARIO = ['SAZ', 'LAS', 'ADMIN'] as const;

// --- REPARACIONES (Field Support) ---
export const TIPO_TAREA_REPARACION = [
  'Problemas con Impresoras y Scanners',
  'Problemas con Notebook, TC o Desktop',
  'Periféricos rotos (mouse, teclado, adaptadores)',
  'Problemas con Monitores, TVs, Proyectores',
  'Problema con Sala Zoom',
  'Problemas con Software y Aplicaciones',
  'Problemas de Conectividad',
  'Problemas con Usuario Windows y accesos',
] as const;

export const TIPO_EQUIPO_REPARACION = [
  'Notebook', 'Desktop', 'Smartphone', 'Monitor',
] as const;

export const REPARACIONES_CHECKBOXES = [
  'Audio', 'Batería', 'Bloqueo Bitlocker', 'Cámara',
  'Configuración de teclado', 'Fecha/Hora', 'Idioma',
  'Lector biométrico', 'Mapeo carpeta de red', 'Micrófono',
  'Navegador de internet', 'No enciende', 'Panel táctil',
  'Pantalla', 'PIN', 'Red/Wifi', 'Software',
  'Fuente de Alimentación',
] as const;

export const ESTADO_REPARACION = [
  'ABIERTA', 'EN PROGRESO', 'CERRADA', 'CANCELADA',
] as const;

// --- WIKI (Intranet) ---
export const WIKI_CATEGORIAS = [
  'Políticas',
  'Asignaciones',
  'Cambios por Rotura',
  'Envíos desde EC',
  'Onboarding',
  'Recupero',
  'Robo/Pérdida',
  'Insumos',
  'Cotización',
  'Roaming',
  'Telefonía',
  'Impresoras',
  'Cierre de Tickets',
] as const;

// --- LINKS UTILES ---
export const LINK_CATEGORIAS = [
  'SAP',
  'ServiceNow',
  'Azure/Intune',
  'Inventarios',
  'Drivers/Software',
  'Red/Conectividad',
] as const;

// --- MODULOS CONFIGURABLES ---
export const MODULOS_CONFIGURABLES = [
  { id: 'equipos', label: 'Equipos' },
  { id: 'celulares', label: 'Celulares' },
  { id: 'monitores', label: 'Monitores' },
  { id: 'lineas', label: 'Líneas' },
  { id: 'insumos', label: 'Insumos' },
  { id: 'colaboradores', label: 'Colaboradores' },
  { id: 'movimientos', label: 'Movimientos' },
  { id: 'cortes', label: 'Cortes de Stock' },
  { id: 'reparaciones', label: 'Reparaciones' },
  { id: 'intranet', label: 'Intranet' },
  { id: 'links', label: 'Links Útiles' },
] as const;

// --- SNOW GESTION TYPES (Ticket templates for movimientos) ---
export const SNOW_GESTION_TYPES = [
  { id: 'ASIGNACION_EQUIPO', label: 'Asignación de Equipo', shortDesc: 'ASIGNACION NOTEBOOK' },
  { id: 'ASIGNACION_CELULAR', label: 'Asignación de Celular', shortDesc: 'ASIGNACION CELULAR' },
  { id: 'ASIGNACION_INSUMO', label: 'Asignación de Insumo', shortDesc: 'ASIGNACION INSUMO' },
  { id: 'ASIGNACION_INSUMO_SEC', label: 'Asignación de Insumo Secundario', shortDesc: 'ASIGNACION INSUMO' },
  { id: 'RECUPERO_EQUIPO', label: 'Recupero de Equipo', shortDesc: 'RECUPERO DE EQUIPO' },
  { id: 'ROBO_NOTEBOOK', label: 'Robo de Notebook', shortDesc: 'ROBO NOTEBOOK' },
  { id: 'ROBO_CELULAR', label: 'Robo de Celular', shortDesc: 'ROBO CELULAR' },
] as const;

// --- SERVICENOW ---
export const SNOW_CANALES = [
  'Service Desk', 'Walk-in', 'Email', 'Chat', 'Phone',
] as const;

export const SNOW_SERVICE_CLASS = [
  'Hardware y accesorios informaticos',
  'Software',
  'Network',
  'Telecom',
] as const;

export const SNOW_SERVICIOS = [
  'Corporate Device (Desktop, Notebook, Computer, Laptop, Tablet)',
  'Mobile Device (Smartphone, Tablet)',
  'Monitor, TV, Projector',
  'Peripheral (Mouse, Keyboard, Headset, Webcam)',
  'Printer / Scanner',
] as const;

export const SNOW_SYMPTOMS = [
  'functionality its not working',
  'New / Setup / Install / Configure',
  'Move / Change / Modify',
  'Damaged / Broken',
  'Lost / Stolen',
] as const;

export const SNOW_ZONES = ['SAZ', 'NAZ', 'EUR', 'APAC'] as const;

export const SNOW_ASSIGNMENT_GROUPS = [
  'SAZ Digital CORE - Front Tech Argentina',
  'LAS Asset Argentina',
  'LAS Logistica IT Argentina',
  'LAS Help Desk',
  'Networking-LAS',
] as const;

// --- UI ---
export const ESTADO_COLORS: Record<string, string> = {
  ACTIVO: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  STOCK: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  'BAJA EFECTIVA': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  'A RECUPERAR': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  Donado: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  'STOCK AREA': 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  DISPONIBLE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ASIGNADO: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  RESERVADO: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ROBADO: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  // Movimientos
  ASIGNACION_PC: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  DEVOLUCION_PC: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ASIGNACION_CEL: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  DEVOLUCION_CEL: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  ENTREGA_INSUMO: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ROBO: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  ROAMING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  ONBOARDING: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  OFFBOARDING: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  RECAMBIO: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  TRANSFERENCIA: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
  // Lineas
  ACTIVA: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  INACTIVA: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  SUSPENDIDA: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  BAJA: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  // Perfiles de usuario
  SAZ: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  LAS: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  // Reparaciones
  ABIERTA: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  'EN PROGRESO': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  CERRADA: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  CANCELADA: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export const BRAND_COLORS = {
  celeste: '#54A0D6',
  orange: '#FF6B00',
  greyDark: '#334155',
  greyLight: '#F1F5F9',
} as const;
