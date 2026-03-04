import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  date,
  timestamp,
  jsonb,
  uniqueIndex,
  index,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================
// CATALOGS
// ============================================================

export const empresas = pgTable('empresas', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull().unique(),
  codigo: text('codigo').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const sitios = pgTable('sitios', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull(),
  tipo: text('tipo'),
  direccion: text('direccion'),
  parentId: uuid('parent_id').references((): AnyPgColumn => sitios.id),
  activo: boolean('activo').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// APP USERS (replaces Supabase auth.users)
// ============================================================

export const appUsers = pgTable('app_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  perfil: text('perfil').notNull().default('SAZ'),
  nombre: text('nombre'),
  email: text('email'),
  activo: boolean('activo').default(true),
  permisos: jsonb('permisos').default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// COLABORADORES
// ============================================================

export const colaboradores = pgTable(
  'colaboradores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    globalId: text('global_id').notNull().unique(),
    legajo: text('legajo').notNull().unique(),
    email: text('email'),
    nombre: text('nombre').notNull(),
    businessTitle: text('business_title'),
    band: text('band'),
    empresaId: uuid('empresa_id').references(() => empresas.id),
    costCenterId: text('cost_center_id'),
    costCenterDesc: text('cost_center_desc'),
    positionId: text('position_id'),
    positionName: text('position_name'),
    managerName: text('manager_name'),
    managerId: text('manager_id'),
    area: text('area'),
    subArea: text('sub_area'),
    groupedUnity: text('grouped_unity'),
    unity: text('unity'),
    pais: text('pais').default('Argentina'),
    regional: text('regional'),
    hrbp: text('hrbp'),
    hireDate: date('hire_date'),
    status: text('status').default('Active'),
    collar: text('collar'),
    sitioId: uuid('sitio_id').references(() => sitios.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_colaboradores_legajo').on(table.legajo),
    index('idx_colaboradores_global_id').on(table.globalId),
    index('idx_colaboradores_email').on(table.email),
    index('idx_colaboradores_sitio').on(table.sitioId),
    index('idx_colaboradores_empresa').on(table.empresaId),
    index('idx_colaboradores_status').on(table.status),
  ],
);

// ============================================================
// EQUIPOS
// ============================================================

export const equipos = pgTable(
  'equipos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serialNumber: text('serial_number').notNull().unique(),
    hostname: text('hostname'),
    empresaId: uuid('empresa_id').references(() => empresas.id),
    tipo: text('tipo').notNull(),
    marca: text('marca').notNull(),
    modelo: text('modelo').notNull(),
    procesador: text('procesador'),
    memoria: text('memoria'),
    tipoDisco: text('tipo_disco'),
    tamanoDisco: text('tamano_disco'),
    sistemaOperativo: text('sistema_operativo'),
    compradoPor: text('comprado_por'),
    ordenCompra: text('orden_compra'),
    fechaCompra: date('fecha_compra'),
    diasGarantia: integer('dias_garantia').default(1095),
    vencGarantia: date('venc_garantia'),
    obsoleto: boolean('obsoleto').default(false),
    estado: text('estado').notNull().default('STOCK'),
    estadoSecundario: text('estado_secundario').default('DISPONIBLE'),
    colaboradorId: uuid('colaborador_id').references(() => colaboradores.id),
    principalSecundaria: text('principal_secundaria'),
    motivoAsignacion: text('motivo_asignacion'),
    fechaAsignacion: date('fecha_asignacion'),
    sitioId: uuid('sitio_id').references(() => sitios.id),
    comentarios: text('comentarios'),
    red: boolean('red'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_equipos_serial').on(table.serialNumber),
    index('idx_equipos_hostname').on(table.hostname),
    index('idx_equipos_estado').on(table.estado),
    index('idx_equipos_colaborador').on(table.colaboradorId),
    index('idx_equipos_sitio').on(table.sitioId),
    index('idx_equipos_tipo').on(table.tipo),
  ],
);

// ============================================================
// LINEAS TELEFONICAS
// ============================================================

export const lineas = pgTable('lineas', {
  id: uuid('id').primaryKey().defaultRandom(),
  numero: text('numero').notNull().unique(),
  tipoLinea: text('tipo_linea'),
  proveedor: text('proveedor'),
  plan: text('plan'),
  sitioId: uuid('sitio_id').references(() => sitios.id),
  estado: text('estado').default('ACTIVA'),
  comentarios: text('comentarios'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// CELULARES
// ============================================================

export const celulares = pgTable(
  'celulares',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    imei: text('imei').notNull().unique(),
    empresaId: uuid('empresa_id').references(() => empresas.id),
    tipo: text('tipo').notNull(),
    marca: text('marca').notNull(),
    modelo: text('modelo').notNull(),
    proveedor: text('proveedor'),
    plan: text('plan'),
    fechaCompra: date('fecha_compra'),
    diasGarantia: integer('dias_garantia').default(365),
    obsoleto: boolean('obsoleto').default(false),
    estado: text('estado').notNull().default('STOCK'),
    estadoSecundario: text('estado_secundario').default('DISPONIBLE'),
    colaboradorId: uuid('colaborador_id').references(() => colaboradores.id),
    lineaId: uuid('linea_id').references(() => lineas.id),
    sitioId: uuid('sitio_id').references(() => sitios.id),
    principalSecundaria: text('principal_secundaria'),
    motivoAsignacion: text('motivo_asignacion'),
    fechaAsignacion: date('fecha_asignacion'),
    poseeCargador: boolean('posee_cargador').default(true),
    condicion: text('condicion'),
    comentarios: text('comentarios'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_celulares_imei').on(table.imei),
    index('idx_celulares_estado').on(table.estado),
    index('idx_celulares_colaborador').on(table.colaboradorId),
    index('idx_celulares_sitio').on(table.sitioId),
  ],
);

// ============================================================
// MONITORES
// ============================================================

export const monitores = pgTable(
  'monitores',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    serialNumber: text('serial_number').notNull().unique(),
    empresa: text('empresa'),
    tipoMonitor: text('tipo_monitor'),
    marca: text('marca').notNull(),
    modelo: text('modelo').notNull(),
    pulgadas: text('pulgadas'),
    proveedor: text('proveedor'),
    ordenCompra: text('orden_compra'),
    factura: text('factura'),
    fechaCompra: date('fecha_compra'),
    diasGarantia: integer('dias_garantia').default(365),
    vencGarantia: date('venc_garantia'),
    obsoleto: boolean('obsoleto').default(false),
    compradoPor: text('comprado_por'),
    colaboradorId: uuid('colaborador_id').references(() => colaboradores.id),
    sitioId: uuid('sitio_id').references(() => sitios.id),
    comentarios: text('comentarios'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('idx_monitores_serial').on(table.serialNumber),
    index('idx_monitores_colaborador').on(table.colaboradorId),
  ],
);

// ============================================================
// INSUMOS
// ============================================================

export const insumos = pgTable('insumos', {
  id: uuid('id').primaryKey().defaultRandom(),
  nombre: text('nombre').notNull(),
  tipoInsumo: text('tipo_insumo').notNull(),
  serialInsumo: text('serial_insumo'),
  ordenCompra: text('orden_compra'),
  fechaCompra: date('fecha_compra'),
  areaCompra: text('area_compra'),
  cantidadMin: integer('cantidad_min').default(5),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const insumoStock = pgTable(
  'insumo_stock',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    insumoId: uuid('insumo_id')
      .notNull()
      .references(() => insumos.id),
    sitioId: uuid('sitio_id')
      .notNull()
      .references(() => sitios.id),
    cantidad: integer('cantidad').default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_insumo_stock_unique').on(table.insumoId, table.sitioId),
    index('idx_insumo_stock_sitio').on(table.sitioId),
  ],
);

// ============================================================
// MOVIMIENTOS (audit trail)
// ============================================================

export const movimientos = pgTable(
  'movimientos',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    tipo: text('tipo').notNull(),
    colaboradorId: uuid('colaborador_id').references(() => colaboradores.id),
    operadorId: uuid('operador_id')
      .notNull()
      .references(() => appUsers.id),
    equipoId: uuid('equipo_id').references(() => equipos.id),
    celularId: uuid('celular_id').references(() => celulares.id),
    insumoId: uuid('insumo_id').references(() => insumos.id),
    monitorId: uuid('monitor_id').references(() => monitores.id),
    serialRef: text('serial_ref'),
    imeiRef: text('imei_ref'),
    sitioId: uuid('sitio_id').references(() => sitios.id),
    motivo: text('motivo'),
    estadoAnterior: text('estado_anterior'),
    estadoNuevo: text('estado_nuevo'),
    cantidad: integer('cantidad'),
    comentarios: text('comentarios'),
    ticketSnow: text('ticket_snow'),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_movimientos_tipo').on(table.tipo),
    index('idx_movimientos_colaborador').on(table.colaboradorId),
    index('idx_movimientos_equipo').on(table.equipoId),
    index('idx_movimientos_celular').on(table.celularId),
    index('idx_movimientos_sitio').on(table.sitioId),
    index('idx_movimientos_fecha').on(table.createdAt),
    index('idx_movimientos_ticket').on(table.ticketSnow),
  ],
);

// ============================================================
// CORTES DE STOCK
// ============================================================

export const cortesStock = pgTable(
  'cortes_stock',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fechaCorte: date('fecha_corte').notNull(),
    sitioId: uuid('sitio_id')
      .notNull()
      .references(() => sitios.id),
    generadoPor: uuid('generado_por').references(() => appUsers.id),
    equiposData: jsonb('equipos_data'),
    celularesData: jsonb('celulares_data'),
    insumosData: jsonb('insumos_data'),
    lineasData: jsonb('lineas_data'),
    reconciliado: boolean('reconciliado').default(false),
    diferencias: jsonb('diferencias'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    uniqueIndex('idx_cortes_sitio_fecha_unique').on(table.fechaCorte, table.sitioId),
    index('idx_cortes_sitio_fecha').on(table.sitioId, table.fechaCorte),
  ],
);

// ============================================================
// SERVICENOW TICKETS
// ============================================================

export const ticketsSnow = pgTable('tickets_snow', {
  id: uuid('id').primaryKey().defaultRandom(),
  incNumber: text('inc_number').unique(),
  sysId: text('sys_id'),
  movimientoId: uuid('movimiento_id').references(() => movimientos.id),
  shortDescription: text('short_description'),
  assignmentGroup: text('assignment_group'),
  estado: text('estado').default('New'),
  callerLegajo: text('caller_legajo'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// ============================================================
// RELATIONS
// ============================================================

export const empresasRelations = relations(empresas, ({ many }) => ({
  colaboradores: many(colaboradores),
  equipos: many(equipos),
  celulares: many(celulares),
}));

export const sitiosRelations = relations(sitios, ({ one, many }) => ({
  parent: one(sitios, { fields: [sitios.parentId], references: [sitios.id], relationName: 'sitioHierarchy' }),
  children: many(sitios, { relationName: 'sitioHierarchy' }),
  colaboradores: many(colaboradores),
  equipos: many(equipos),
  celulares: many(celulares),
  insumoStock: many(insumoStock),
}));

export const appUsersRelations = relations(appUsers, ({ many }) => ({
  movimientos: many(movimientos),
  cortesStock: many(cortesStock),
}));

export const colaboradoresRelations = relations(colaboradores, ({ one, many }) => ({
  empresa: one(empresas, { fields: [colaboradores.empresaId], references: [empresas.id] }),
  sitio: one(sitios, { fields: [colaboradores.sitioId], references: [sitios.id] }),
  equipos: many(equipos),
  celulares: many(celulares),
  monitores: many(monitores),
  movimientos: many(movimientos),
}));

export const equiposRelations = relations(equipos, ({ one, many }) => ({
  empresa: one(empresas, { fields: [equipos.empresaId], references: [empresas.id] }),
  colaborador: one(colaboradores, { fields: [equipos.colaboradorId], references: [colaboradores.id] }),
  sitio: one(sitios, { fields: [equipos.sitioId], references: [sitios.id] }),
  movimientos: many(movimientos),
}));

export const lineasRelations = relations(lineas, ({ one, many }) => ({
  sitio: one(sitios, { fields: [lineas.sitioId], references: [sitios.id] }),
  celulares: many(celulares),
}));

export const celularesRelations = relations(celulares, ({ one, many }) => ({
  empresa: one(empresas, { fields: [celulares.empresaId], references: [empresas.id] }),
  colaborador: one(colaboradores, { fields: [celulares.colaboradorId], references: [colaboradores.id] }),
  linea: one(lineas, { fields: [celulares.lineaId], references: [lineas.id] }),
  sitio: one(sitios, { fields: [celulares.sitioId], references: [sitios.id] }),
  movimientos: many(movimientos),
}));

export const monitoresRelations = relations(monitores, ({ one }) => ({
  colaborador: one(colaboradores, { fields: [monitores.colaboradorId], references: [colaboradores.id] }),
  sitio: one(sitios, { fields: [monitores.sitioId], references: [sitios.id] }),
}));

export const insumosRelations = relations(insumos, ({ many }) => ({
  stock: many(insumoStock),
  movimientos: many(movimientos),
}));

export const insumoStockRelations = relations(insumoStock, ({ one }) => ({
  insumo: one(insumos, { fields: [insumoStock.insumoId], references: [insumos.id] }),
  sitio: one(sitios, { fields: [insumoStock.sitioId], references: [sitios.id] }),
}));

export const movimientosRelations = relations(movimientos, ({ one }) => ({
  colaborador: one(colaboradores, { fields: [movimientos.colaboradorId], references: [colaboradores.id] }),
  operador: one(appUsers, { fields: [movimientos.operadorId], references: [appUsers.id] }),
  equipo: one(equipos, { fields: [movimientos.equipoId], references: [equipos.id] }),
  celular: one(celulares, { fields: [movimientos.celularId], references: [celulares.id] }),
  insumo: one(insumos, { fields: [movimientos.insumoId], references: [insumos.id] }),
  monitor: one(monitores, { fields: [movimientos.monitorId], references: [monitores.id] }),
  sitio: one(sitios, { fields: [movimientos.sitioId], references: [sitios.id] }),
}));

export const cortesStockRelations = relations(cortesStock, ({ one }) => ({
  sitio: one(sitios, { fields: [cortesStock.sitioId], references: [sitios.id] }),
  generador: one(appUsers, { fields: [cortesStock.generadoPor], references: [appUsers.id] }),
}));

export const ticketsSnowRelations = relations(ticketsSnow, ({ one }) => ({
  movimiento: one(movimientos, { fields: [ticketsSnow.movimientoId], references: [movimientos.id] }),
}));
