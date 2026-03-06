// ============================================================
// ServiceNow Ticket Templates for Movimientos
// Based on "Procesos TECH 2025 v1.1" document
// ============================================================

export interface SnowGestionField {
  key: string;
  label: string;
  type: 'colaborador' | 'equipo' | 'celular' | 'insumo' | 'sitio' | 'text' | 'select' | 'checkbox';
  options?: string[];
  required?: boolean;
}

export interface SnowGestionType {
  id: string;
  label: string;
  shortDesc: string;
  fields: SnowGestionField[];
  buildDescription: (data: Record<string, string>) => string;
}

export const SNOW_GESTION_TEMPLATES: SnowGestionType[] = [
  {
    id: 'ASIGNACION_EQUIPO',
    label: 'Asignacion de Equipo',
    shortDesc: 'ASIGNACION NOTEBOOK',
    fields: [
      { key: 'colaborador', label: 'Colaborador', type: 'colaborador', required: true },
      { key: 'equipo', label: 'Equipo', type: 'equipo', required: true },
      { key: 'motivo', label: 'Motivo', type: 'select', options: ['Nueva Posición', 'Posición Vacante', 'Programa People (Trainee, GMT)', 'Asignación a Tercero', 'Préstamo', 'Recambio equipo'], required: true },
      { key: 'tipoAsignacion', label: 'Tipo Asignacion', type: 'select', options: ['Principal', 'Secundaria'], required: true },
      { key: 'sitio', label: 'Sitio', type: 'sitio', required: true },
    ],
    buildDescription: (d) => [
      'ASIGNACION NOTEBOOK',
      '',
      `* Legajo: ${d.legajo || ''}`,
      `* Apellido y Nombre: ${d.nombre || ''}`,
      `* Banda: ${d.banda || ''}`,
      '* Notebook Asignada:',
      `  - Marca: ${d.equipoMarca || ''}`,
      `  - Modelo: ${d.equipoModelo || ''}`,
      `  - Serie: ${d.equipoSerial || ''}`,
      `  - Motivo: ${d.motivo || ''}`,
      `  - Tipo Asignacion: ${d.tipoAsignacion || ''}`,
      `* Sitio: ${d.sitioNombre || ''}`,
    ].join('\n'),
  },
  {
    id: 'ASIGNACION_CELULAR',
    label: 'Asignacion de Celular',
    shortDesc: 'ASIGNACION CELULAR',
    fields: [
      { key: 'colaborador', label: 'Colaborador', type: 'colaborador', required: true },
      { key: 'celular', label: 'Celular', type: 'celular', required: true },
      { key: 'motivo', label: 'Motivo', type: 'select', options: ['Nueva Posición', 'Posición Vacante', 'Recambio equipo', 'Préstamo'], required: true },
      { key: 'tipoAsignacion', label: 'Tipo Asignacion', type: 'select', options: ['Principal', 'Secundaria'], required: true },
      { key: 'sitio', label: 'Sitio', type: 'sitio', required: true },
    ],
    buildDescription: (d) => [
      'ASIGNACION CELULAR',
      '',
      `* Legajo: ${d.legajo || ''}`,
      `* Apellido y Nombre: ${d.nombre || ''}`,
      '* Celular Asignado:',
      `  - Marca: ${d.celularMarca || ''}`,
      `  - Modelo: ${d.celularModelo || ''}`,
      `  - IMEI: ${d.celularImei || ''}`,
      `  - Linea: ${d.celularLinea || ''}`,
      `  - Motivo: ${d.motivo || ''}`,
      `  - Tipo Asignacion: ${d.tipoAsignacion || ''}`,
      `* Sitio: ${d.sitioNombre || ''}`,
    ].join('\n'),
  },
  {
    id: 'ASIGNACION_INSUMO',
    label: 'Asignacion de Insumo',
    shortDesc: 'ASIGNACION INSUMO',
    fields: [
      { key: 'colaborador', label: 'Colaborador', type: 'colaborador', required: true },
      { key: 'insumo', label: 'Insumo', type: 'text', required: true },
      { key: 'equipoAfectado', label: 'Equipo Afectado (Marca/Modelo/Serie)', type: 'text' },
      { key: 'sector', label: 'Sector', type: 'text' },
      { key: 'motivo', label: 'Motivo', type: 'text', required: true },
      { key: 'comentarios', label: 'Comentarios', type: 'text' },
      { key: 'sitio', label: 'Sitio', type: 'sitio', required: true },
    ],
    buildDescription: (d) => [
      'ASIGNACION INSUMO',
      '',
      `* Legajo: ${d.legajo || ''}`,
      `* Apellido y Nombre: ${d.nombre || ''}`,
      `* Insumo: ${d.insumo || ''}`,
      `* Equipo Afectado: ${d.equipoAfectado || ''}`,
      `* Sector: ${d.sector || ''}`,
      `* Motivo: ${d.motivo || ''}`,
      `* Comentarios: ${d.comentarios || ''}`,
      `* Sitio: ${d.sitioNombre || ''}`,
    ].join('\n'),
  },
  {
    id: 'ASIGNACION_INSUMO_SEC',
    label: 'Asignacion de Insumo Secundario',
    shortDesc: 'ASIGNACION INSUMO',
    fields: [
      { key: 'colaborador', label: 'Colaborador Principal', type: 'colaborador', required: true },
      { key: 'nombreSecundario', label: 'Nombre Secundario', type: 'text', required: true },
      { key: 'insumo', label: 'Insumo (Serial/Cantidad)', type: 'text', required: true },
      { key: 'motivo', label: 'Motivo', type: 'text', required: true },
    ],
    buildDescription: (d) => [
      'ASIGNACION INSUMO (Secundario)',
      '',
      `* Legajo Principal: ${d.legajo || ''}`,
      `* Nombre Principal: ${d.nombre || ''}`,
      `* Nombre Secundario: ${d.nombreSecundario || ''}`,
      `* Insumo: ${d.insumo || ''}`,
      `* Motivo: ${d.motivo || ''}`,
    ].join('\n'),
  },
  {
    id: 'RECUPERO_EQUIPO',
    label: 'Recupero de Equipo',
    shortDesc: 'RECUPERO DE EQUIPO',
    fields: [
      { key: 'colaborador', label: 'Colaborador', type: 'colaborador', required: true },
      { key: 'equipo', label: 'Equipo', type: 'equipo', required: true },
      { key: 'cargador', label: 'Cargador', type: 'select', options: ['SI', 'NO'], required: true },
      { key: 'motivo', label: 'Motivo', type: 'text', required: true },
      { key: 'estadoEquipo', label: 'Estado Equipo', type: 'select', options: ['STOCK', 'A RECUPERAR', 'BAJA EFECTIVA', 'ROTURA FUERA GARANTIA'], required: true },
      { key: 'comentarios', label: 'Comentarios', type: 'text' },
      { key: 'sitio', label: 'Sitio', type: 'sitio', required: true },
    ],
    buildDescription: (d) => [
      'RECUPERO DE EQUIPO',
      '',
      `* Legajo: ${d.legajo || ''}`,
      `* Apellido y Nombre: ${d.nombre || ''}`,
      '* Equipo Recuperado:',
      `  - Marca: ${d.equipoMarca || ''}`,
      `  - Modelo: ${d.equipoModelo || ''}`,
      `  - Serie: ${d.equipoSerial || ''}`,
      `* Cargador: ${d.cargador || ''}`,
      `* Motivo: ${d.motivo || ''}`,
      `* Estado Equipo: ${d.estadoEquipo || ''}`,
      `* Comentarios: ${d.comentarios || ''}`,
      `* Sitio: ${d.sitioNombre || ''}`,
    ].join('\n'),
  },
  {
    id: 'ROBO_NOTEBOOK',
    label: 'Robo de Notebook',
    shortDesc: 'ROBO NOTEBOOK',
    fields: [
      { key: 'colaborador', label: 'Colaborador', type: 'colaborador', required: true },
      { key: 'equipo', label: 'Equipo', type: 'equipo', required: true },
      { key: 'denunciaAdjunta', label: 'Denuncia Adjunta', type: 'select', options: ['SI', 'NO'], required: true },
      { key: 'sitio', label: 'Sitio', type: 'sitio', required: true },
    ],
    buildDescription: (d) => [
      'ROBO NOTEBOOK',
      '',
      `* Legajo: ${d.legajo || ''}`,
      `* Apellido y Nombre: ${d.nombre || ''}`,
      `* Denuncia Adjunta: ${d.denunciaAdjunta || ''}`,
      '* Notebook Robada:',
      `  - Marca: ${d.equipoMarca || ''}`,
      `  - Modelo: ${d.equipoModelo || ''}`,
      `  - Serie: ${d.equipoSerial || ''}`,
      `* Sitio: ${d.sitioNombre || ''}`,
    ].join('\n'),
  },
  {
    id: 'ROBO_CELULAR',
    label: 'Robo de Celular',
    shortDesc: 'ROBO CELULAR',
    fields: [
      { key: 'colaborador', label: 'Colaborador', type: 'colaborador', required: true },
      { key: 'celular', label: 'Celular', type: 'celular', required: true },
      { key: 'denunciaAdjunta', label: 'Denuncia Adjunta', type: 'select', options: ['SI', 'NO'], required: true },
      { key: 'autorizacionAdjunta', label: 'Autorizacion Adjunta', type: 'select', options: ['SI', 'NO'], required: true },
      { key: 'sitio', label: 'Sitio', type: 'sitio', required: true },
    ],
    buildDescription: (d) => [
      'ROBO CELULAR',
      '',
      `* Legajo: ${d.legajo || ''}`,
      `* Apellido y Nombre: ${d.nombre || ''}`,
      `* Denuncia Adjunta: ${d.denunciaAdjunta || ''}`,
      `* Autorizacion Adjunta: ${d.autorizacionAdjunta || ''}`,
      '* Celular Robado:',
      `  - Marca: ${d.celularMarca || ''}`,
      `  - Modelo: ${d.celularModelo || ''}`,
      `  - IMEI: ${d.celularImei || ''}`,
      `  - Linea: ${d.celularLinea || ''}`,
      `* Sitio: ${d.sitioNombre || ''}`,
    ].join('\n'),
  },
];
