'use client';

import { useState } from 'react';
import {
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

type ImportMode = 'merge' | 'replace';
type ExcelType = 'equipamiento' | 'celulares' | 'insumos' | 'colaboradores';

interface ImportResult {
  label: string;
  inserted: number;
  errors: number;
}

export default function DatosPage() {
  const [exporting, setExporting] = useState(false);
  const [importingJson, setImportingJson] = useState(false);
  const [importingExcel, setImportingExcel] = useState(false);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [excelType, setExcelType] = useState<ExcelType>('equipamiento');
  const [jsonResults, setJsonResults] = useState<Record<string, number> | null>(null);
  const [excelResults, setExcelResults] = useState<ImportResult[] | null>(null);

  // ---- Export full DB as JSON ----
  async function handleExportDB() {
    setExporting(true);
    try {
      const res = await fetch('/api/db-management/export');
      if (!res.ok) throw new Error('Error al exportar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const date = new Date().toISOString().split('T')[0];
      a.download = `techops-backup-${date}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Base de datos exportada correctamente');
    } catch (err) {
      toast.error(`Error: ${(err as Error).message}`);
    } finally {
      setExporting(false);
    }
  }

  // ---- Import full DB from JSON ----
  async function handleImportJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (importMode === 'replace') {
      const confirmed = confirm(
        'ATENCION: El modo REEMPLAZAR eliminara TODOS los datos actuales y los reemplazara con los del archivo.\n\nEsta seguro?'
      );
      if (!confirmed) {
        e.target.value = '';
        return;
      }
    }

    setImportingJson(true);
    setJsonResults(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      data.mode = importMode;

      const res = await fetch('/api/db-management/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al importar');

      setJsonResults(result.imported);
      toast.success(`Base de datos importada (modo: ${importMode})`);
    } catch (err) {
      toast.error(`Error: ${(err as Error).message}`);
    } finally {
      setImportingJson(false);
      e.target.value = '';
    }
  }

  // ---- Import from Excel ----
  async function handleImportExcel(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportingExcel(true);
    setExcelResults(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', excelType);

      const res = await fetch('/api/db-management/import-excel', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al importar Excel');

      setExcelResults(result.results);
      toast.success(`Excel importado: ${result.results.length} tablas procesadas`);
    } catch (err) {
      toast.error(`Error: ${(err as Error).message}`);
    } finally {
      setImportingExcel(false);
      e.target.value = '';
    }
  }

  // ---- Export individual Excel files ----
  async function handleExportExcel(type: string, filename: string) {
    try {
      const res = await fetch(`/api/export/${type}`);
      if (!res.ok) throw new Error('Error al exportar');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${filename} exportado`);
    } catch (err) {
      toast.error(`Error: ${(err as Error).message}`);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Gestion de Datos
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Exportar, importar y sincronizar bases de datos entre instancias
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* ---- Export Full DB ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-blue-500" />
              Exportar Base de Datos Completa
            </CardTitle>
            <CardDescription>
              Descarga todas las tablas en formato JSON. Ideal para backup o migrar a otra instancia.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleExportDB} disabled={exporting} className="w-full">
              {exporting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Exportando...</>
              ) : (
                <><Database className="mr-2 h-4 w-4" /> Exportar JSON completo</>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* ---- Import Full DB ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-green-500" />
              Importar Base de Datos
            </CardTitle>
            <CardDescription>
              Importa un archivo JSON exportado previamente. Selecciona el modo de importacion.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Select value={importMode} onValueChange={(v) => setImportMode(v as ImportMode)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="merge">Combinar (agregar faltantes)</SelectItem>
                  <SelectItem value="replace">Reemplazar (borrar todo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {importMode === 'replace' && (
              <div className="flex items-start gap-2 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>REEMPLAZAR eliminara todos los datos actuales antes de importar.</span>
              </div>
            )}
            <label className="block">
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                disabled={importingJson}
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100 dark:text-gray-400 dark:file:bg-blue-900/30 dark:file:text-blue-300"
              />
            </label>
            {importingJson && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Importando...
              </div>
            )}
            {jsonResults && (
              <div className="space-y-1 rounded-md bg-green-50 p-3 text-sm dark:bg-green-900/30">
                <div className="flex items-center gap-1 font-medium text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-4 w-4" /> Importacion completada
                </div>
                {Object.entries(jsonResults).map(([table, count]) => (
                  <div key={table} className="text-green-600 dark:text-green-400">
                    {table}: {count} registros
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ---- Export Excel Files ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-500" />
              Exportar a Excel
            </CardTitle>
            <CardDescription>
              Descarga los archivos Excel con el formato original, actualizados con los datos actuales de la base.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExportExcel('equipos', 'Inventario EQUIPAMIENTO AR.xlsx')}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
              Inventario EQUIPAMIENTO AR.xlsx
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExportExcel('celulares', 'Inventario CELULARES AR.xlsx')}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4 text-blue-600" />
              Inventario CELULARES AR.xlsx
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExportExcel('insumos', 'Inventario Insumos AR.xlsx')}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4 text-orange-600" />
              Inventario Insumos AR.xlsx
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExportExcel('colaboradores', 'INVENTARIOS-Datos Planos ARG.xlsx')}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4 text-purple-600" />
              INVENTARIOS-Datos Planos ARG.xlsx
            </Button>
            <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExportExcel('corte-stock', `Corte_Stock_${new Date().toISOString().split('T')[0]}.xlsx`)}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4 text-red-600" />
              Corte de Stock (Movimientos de baja/entrega)
            </Button>
          </CardContent>
        </Card>

        {/* ---- Import from Excel ---- */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-amber-500" />
              Importar desde Excel
            </CardTitle>
            <CardDescription>
              Sube un archivo Excel para actualizar la base de datos. Selecciona el tipo de archivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select value={excelType} onValueChange={(v) => setExcelType(v as ExcelType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="equipamiento">Inventario EQUIPAMIENTO AR.xlsx</SelectItem>
                <SelectItem value="celulares">Inventario CELULARES AR.xlsx</SelectItem>
                <SelectItem value="insumos">Inventario Insumos AR.xlsx</SelectItem>
                <SelectItem value="colaboradores">INVENTARIOS-Datos Planos ARG.xlsx</SelectItem>
              </SelectContent>
            </Select>
            <label className="block">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                disabled={importingExcel}
                className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-md file:border-0 file:bg-amber-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-amber-700 hover:file:bg-amber-100 dark:text-gray-400 dark:file:bg-amber-900/30 dark:file:text-amber-300"
              />
            </label>
            {importingExcel && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Procesando Excel...
              </div>
            )}
            {excelResults && (
              <div className="space-y-1 rounded-md bg-green-50 p-3 text-sm dark:bg-green-900/30">
                <div className="flex items-center gap-1 font-medium text-green-700 dark:text-green-300">
                  <CheckCircle2 className="h-4 w-4" /> Excel procesado
                </div>
                {excelResults.map((r) => (
                  <div key={r.label} className="text-green-600 dark:text-green-400">
                    {r.label}: {r.inserted} importados{r.errors > 0 ? `, ${r.errors} errores` : ''}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
