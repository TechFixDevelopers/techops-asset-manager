import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as schema from '@/lib/db/schema';

// ============================================================
// Select types (what you get back from queries)
// ============================================================

export type Empresa = InferSelectModel<typeof schema.empresas>;
export type Sitio = InferSelectModel<typeof schema.sitios>;
export type AppUser = InferSelectModel<typeof schema.appUsers>;
export type Colaborador = InferSelectModel<typeof schema.colaboradores>;
export type Equipo = InferSelectModel<typeof schema.equipos>;
export type Linea = InferSelectModel<typeof schema.lineas>;
export type Celular = InferSelectModel<typeof schema.celulares>;
export type Monitor = InferSelectModel<typeof schema.monitores>;
export type Insumo = InferSelectModel<typeof schema.insumos>;
export type InsumoStock = InferSelectModel<typeof schema.insumoStock>;
export type Movimiento = InferSelectModel<typeof schema.movimientos>;
export type CorteStock = InferSelectModel<typeof schema.cortesStock>;
export type TicketSnow = InferSelectModel<typeof schema.ticketsSnow>;

// ============================================================
// Insert types (what you pass when creating)
// ============================================================

export type NewEmpresa = InferInsertModel<typeof schema.empresas>;
export type NewSitio = InferInsertModel<typeof schema.sitios>;
export type NewAppUser = InferInsertModel<typeof schema.appUsers>;
export type NewColaborador = InferInsertModel<typeof schema.colaboradores>;
export type NewEquipo = InferInsertModel<typeof schema.equipos>;
export type NewLinea = InferInsertModel<typeof schema.lineas>;
export type NewCelular = InferInsertModel<typeof schema.celulares>;
export type NewMonitor = InferInsertModel<typeof schema.monitores>;
export type NewInsumo = InferInsertModel<typeof schema.insumos>;
export type NewInsumoStock = InferInsertModel<typeof schema.insumoStock>;
export type NewMovimiento = InferInsertModel<typeof schema.movimientos>;
export type NewCorteStock = InferInsertModel<typeof schema.cortesStock>;
export type NewTicketSnow = InferInsertModel<typeof schema.ticketsSnow>;

// ============================================================
// API Types
// ============================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  equipos: {
    total: number;
    asignados: number;
    enStock: number;
    obsoletos: number;
  };
  celulares: {
    total: number;
    activos: number;
    enStock: number;
    robados: number;
  };
  insumos: {
    bajoStock: number;
  };
  movimientos: {
    ultimoMes: number;
  };
}

// ============================================================
// Types with Relations (for joined queries)
// ============================================================

export interface ColaboradorWithRelations extends Colaborador {
  empresa: Empresa | null;
  sitio: Sitio | null;
  equipos?: Equipo[];
  celulares?: Celular[];
  monitores?: Monitor[];
}

export interface EquipoWithRelations extends Equipo {
  empresa: Empresa | null;
  colaborador: Colaborador | null;
  sitio: Sitio | null;
}

export interface CelularWithRelations extends Celular {
  empresa: Empresa | null;
  colaborador: Colaborador | null;
  linea: Linea | null;
  sitio: Sitio | null;
}

export interface MonitorWithRelations extends Monitor {
  colaborador: Colaborador | null;
  sitio: Sitio | null;
}

export interface InsumoWithStock extends Insumo {
  stockTotal: number;
  stockEntries?: InsumoStock[];
}

export interface MovimientoWithRelations extends Movimiento {
  colaborador: { nombre: string } | null;
  operador: { nombre: string | null } | null;
  equipo: { serialNumber: string } | null;
  celular: { imei: string } | null;
  insumo: { nombre: string } | null;
  monitor: { serialNumber: string } | null;
  sitio: { nombre: string } | null;
}
