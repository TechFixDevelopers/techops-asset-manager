'use client';

import { useState, useCallback, useEffect } from 'react';
import { ExternalLink, Check, Ticket, ChevronDown, ChevronUp, GripHorizontal } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ColaboradorCombobox } from '@/components/shared/colaborador-combobox';
import { useColaboradores } from '@/lib/hooks/use-colaboradores';
import { useEquipos } from '@/lib/hooks/use-equipos';
import { useCelulares } from '@/lib/hooks/use-celulares';
import { useSitios } from '@/lib/hooks/use-catalogos';
import { SNOW_GESTION_TEMPLATES, type SnowGestionType } from '@/lib/utils/snow-ticket-templates';

const SNOW_INSTANCE = 'https://abinbevww.service-now.com';
const SNOW_NEW_INC = `${SNOW_INSTANCE}/nav_to.do?uri=incident.do?sys_id=-1`;
const CLIPBOARD_PREFIX = 'SAZ_V13::';

// Bookmarklet — exact code from user (sR=setRef, sS=setStr)
const BOOKMARKLET_CODE = `javascript:(function(){navigator.clipboard.readText().then(function(t){if(!t.startsWith('SAZ_V13::')){alert('No hay datos.');return}var d=JSON.parse(t.substring(9));var f=window.frames['gsft_main']||window;var g=f.g_form;if(!g){alert('No se detecta formulario.');return}function sR(k,v){try{var di=f.document.getElementById('sys_display.incident.'+k);if(di){di.value=v;di.focus();di.dispatchEvent(new Event('input',{bubbles:true}));di.dispatchEvent(new Event('change',{bubbles:true}));setTimeout(function(){di.blur()},100)}}catch(x){}}function sS(k,v){try{g.setValue(k,v)}catch(x){}}sR('caller_id',d.c);sR('business_service',d.s);sR('assignment_group',d.g);sR('location',d.loc);sS('short_description',d.t);sS('description',d.d);sS('u_symptom',d.y);sS('contact_type',d.canal);sS('impact',d.impact);sS('urgency',d.impact);sS('category',d.cat);setTimeout(function(){try{g.setValue('u_select_zone',d.zone)}catch(x){}},800)}).catch(function(){alert('Permiso denegado.')})})();`;

// Clipboard fallback for non-secure contexts (HTTP on LAN IPs)
async function copyToClipboard(text: string): Promise<boolean> {
  // Modern API (only works on HTTPS / localhost)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch { /* fallback below */ }
  }
  // execCommand fallback for HTTP
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// ============================================================
// ServiceNow config defaults (persisted in localStorage)
// ============================================================

interface SnowConfig {
  canal: string;
  serviceClass: string;
  servicio: string;
  symptom: string;
  zone: string;
  assignmentGroup: string;
  impact: string;
}

const SNOW_DEFAULTS: SnowConfig = {
  canal: 'Walk-in',
  serviceClass: 'Hardware y accesorios informaticos',
  servicio: 'Corporate Device (Desktop, Notebook, Computer, Laptop, Tablet)',
  symptom: 'functionality its not working',
  zone: 'SAZ',
  assignmentGroup: 'SAZ Digital CORE - Front Tech Argentina',
  impact: '3',
};

const SNOW_OPTIONS = {
  canal: ['Service Desk', 'Walk-in', 'Email', 'Chat', 'Phone', 'Self-service', 'Monitoring'],
  serviceClass: ['Hardware y accesorios informaticos', 'Software', 'Network', 'Telecom', 'Security', 'Account Management', 'Printing'],
  servicio: [
    'Corporate Device (Desktop, Notebook, Computer, Laptop, Tablet)',
    'Mobile Device (Smartphone, Tablet)',
    'Monitor, TV, Projector',
    'Peripheral (Mouse, Keyboard, Headset, Webcam)',
    'Printer / Scanner',
    'Thin Client / VDI',
    'Network Equipment',
  ],
  symptom: [
    'functionality its not working',
    'New / Setup / Install / Configure',
    'Move / Change / Modify',
    'Decommission / Remove / Disable',
    'Performance / Slow',
    'Damaged / Broken',
    'Lost / Stolen',
    'How to / Information',
  ],
  zone: ['SAZ', 'NAZ', 'EUR', 'APAC', 'AFR', 'MAZ', 'GHQ'],
  assignmentGroup: [
    'SAZ Digital CORE - Front Tech Argentina',
    'LAS Asset Argentina',
    'LAS Logistica IT Argentina',
    'LAS Help Desk',
    'Networking-LAS',
    'LAS Workplace',
    'LAS Networking NOC',
    'SAZ N1 and NOC Network',
    'LAS IMA Seguridad Informatica',
    'LAS IMA Soporte Comercial Truck Soporte',
    'LAS MXP Team',
  ],
  impact: [
    { value: '3', label: '3 - Media' },
    { value: '2', label: '2 - Alta' },
    { value: '1', label: '1 - Critica' },
  ],
};

const SHORT_DESC_PRESETS = [
  'REPARACION DE EQUIPO',
  'ASIGNACION DE EQUIPO',
  'DEVOLUCION',
  'ROBO DE EQUIPO IT',
  'Problemas con Monitores, TVs, Proyectores',
  'Problema con periferico (Mouse, Teclado, Headset)',
  'Equipo no enciende / BSOD',
  'Problema de conectividad / Red / WiFi',
  'Problema con impresora',
  'Solicitud de periferico',
  'SOLICITUD ROAMING',
];

function loadSnowConfig(): SnowConfig {
  if (typeof window === 'undefined') return SNOW_DEFAULTS;
  try {
    const saved = localStorage.getItem('TO_snow_config');
    if (saved) return { ...SNOW_DEFAULTS, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return SNOW_DEFAULTS;
}

function saveSnowConfig(config: SnowConfig) {
  try { localStorage.setItem('TO_snow_config', JSON.stringify(config)); } catch { /* ignore */ }
}

// ============================================================
// Component
// ============================================================

export interface SnowTicketGenerateData {
  typeId: string;
  shortDesc: string;
  description: string;
  formData: Record<string, string>;
}

interface SnowTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTypeId?: string;
  initialFormData?: Record<string, string>;
  onGenerate?: (data: SnowTicketGenerateData) => void;
}

export function SnowTicketDialog({ open, onOpenChange, initialTypeId, initialFormData, onGenerate }: SnowTicketDialogProps) {
  const [selectedType, setSelectedType] = useState<SnowGestionType | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [snowConfig, setSnowConfig] = useState<SnowConfig>(SNOW_DEFAULTS);
  const [shortDesc, setShortDesc] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [showBookmarklet, setShowBookmarklet] = useState(false);
  const [generated, setGenerated] = useState(false);

  // Load saved config on mount
  useEffect(() => {
    setSnowConfig(loadSnowConfig());
  }, []);

  // Pre-fill when initialTypeId/initialFormData change (e.g. from reparaciones row)
  useEffect(() => {
    if (open && initialTypeId) {
      const t = SNOW_GESTION_TEMPLATES.find((g) => g.id === initialTypeId);
      if (t) {
        setSelectedType(t);
        setFormData(initialFormData ?? {});
        setShortDesc(initialFormData?.shortDesc || t.shortDesc);
        setGenerated(false);
      }
    }
  }, [open, initialTypeId, initialFormData]);

  // Data hooks
  const { data: colaboradoresData } = useColaboradores({ pageSize: 500 });
  const { data: equiposData } = useEquipos({ pageSize: 500 });
  const { data: celularesData } = useCelulares({ pageSize: 500 });
  const { data: sitiosData } = useSitios();

  const colaboradores = colaboradoresData?.data ?? [];
  const equipos = equiposData?.data ?? [];
  const celularesList = celularesData?.data ?? [];
  const sitios = sitiosData ?? [];

  // Auto-match equipo from DB when pre-filling from reparacion row
  useEffect(() => {
    if (open && initialFormData?.equipoRef && !formData.equipoId && equipos.length > 0) {
      const ref = initialFormData.equipoRef.toLowerCase();
      const match = equipos.find((e) =>
        e.serialNumber?.toLowerCase() === ref ||
        ref.includes(e.serialNumber?.toLowerCase() ?? '___')
      );
      if (match) {
        setFormData((prev) => ({
          ...prev,
          equipoId: match.id,
          equipoMarca: match.marca,
          equipoModelo: match.modelo,
          equipoSerial: match.serialNumber,
        }));
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, equipos.length]);

  const reset = useCallback(() => {
    setSelectedType(null);
    setFormData({});
    setShortDesc('');
    setGenerated(false);
  }, []);

  const handleClose = useCallback((v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  }, [onOpenChange, reset]);

  const handleSelectType = (typeId: string) => {
    const t = SNOW_GESTION_TEMPLATES.find((g) => g.id === typeId);
    if (t) {
      setSelectedType(t);
      setFormData({});
      setShortDesc(t.shortDesc);
      setGenerated(false);
    }
  };

  const setField = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const updateSnowConfig = (key: keyof SnowConfig, value: string) => {
    setSnowConfig((prev) => {
      const next = { ...prev, [key]: value };
      saveSnowConfig(next);
      return next;
    });
  };

  // Auto-fill helpers
  const handleColaboradorSelect = (id: string | null) => {
    if (!id) {
      setFormData((prev) => ({ ...prev, colaboradorId: '', legajo: '', nombre: '', banda: '' }));
      return;
    }
    const c = colaboradores.find((x) => x.id === id);
    if (c) {
      setFormData((prev) => ({
        ...prev,
        colaboradorId: c.id,
        legajo: c.legajo,
        nombre: c.nombre,
        banda: (c as Record<string, unknown>).band as string || '',
      }));
    }
  };

  const handleEquipoSelect = (id: string) => {
    const e = equipos.find((x) => x.id === id);
    if (e) {
      setFormData((prev) => ({
        ...prev,
        equipoId: e.id,
        equipoMarca: e.marca,
        equipoModelo: e.modelo,
        equipoSerial: e.serialNumber,
      }));
    }
  };

  const handleCelularSelect = (id: string) => {
    const c = celularesList.find((x) => x.id === id);
    if (c) {
      setFormData((prev) => ({
        ...prev,
        celularId: c.id,
        celularMarca: c.marca,
        celularModelo: c.modelo,
        celularImei: c.imei,
        celularLinea: (c as Record<string, unknown>).lineaNumero as string || '',
      }));
    }
  };

  const handleSitioSelect = (id: string) => {
    const s = sitios.find((x) => x.id === id);
    if (s) {
      setFormData((prev) => ({ ...prev, sitioId: s.id, sitioNombre: s.nombre }));
    }
  };

  // ============================================================
  // Generate ticket — copies SAZ_V13::JSON to clipboard + opens ServiceNow
  // ============================================================
  const handleGenerate = async () => {
    if (!selectedType) return;
    const descriptionText = selectedType.buildDescription(formData);

    const payload = {
      c: formData.legajo || '',
      s: snowConfig.servicio,
      g: snowConfig.assignmentGroup,
      y: snowConfig.symptom,
      t: shortDesc || selectedType.shortDesc,
      d: descriptionText,
      canal: snowConfig.canal,
      impact: snowConfig.impact,
      zone: snowConfig.zone,
      loc: formData.sitioNombre || '',
      cat: snowConfig.serviceClass,
    };

    const clipText = CLIPBOARD_PREFIX + JSON.stringify(payload);

    const ok = await copyToClipboard(clipText);
    if (ok) {
      onGenerate?.({
        typeId: selectedType.id,
        shortDesc: shortDesc || selectedType.shortDesc,
        description: descriptionText,
        formData,
      });
      toast.warning(
        'Datos copiados al portapapeles. En ServiceNow, haga clic en el favorito "AUTO-FILL SAZ".',
        { duration: 8000 },
      );
      window.open(SNOW_NEW_INC, '_blank');
      setGenerated(true);
    } else {
      toast.error('No se pudo copiar al portapapeles. Intente desde HTTPS o copie manualmente.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Crear Ticket ServiceNow
          </DialogTitle>
          <DialogDescription>
            Complete los datos, haga clic en &quot;Generar Ticket&quot; y luego use el favorito AUTO-FILL en ServiceNow.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de gestion */}
          <div>
            <Label>Tipo de Gestion</Label>
            <Select
              value={selectedType?.id ?? ''}
              onValueChange={handleSelectType}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar tipo de gestion..." />
              </SelectTrigger>
              <SelectContent position="popper">
                {SNOW_GESTION_TEMPLATES.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic form fields */}
          {selectedType && (
            <>
              <div className="space-y-3 border-t pt-4">
                {selectedType.fields.map((field) => {
                  if (field.type === 'colaborador') {
                    return (
                      <div key={field.key}>
                        <Label>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
                        <ColaboradorCombobox
                          value={formData.colaboradorId || null}
                          onValueChange={handleColaboradorSelect}
                        />
                        {formData.legajo && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            Legajo: {formData.legajo} | Banda: {formData.banda || 'N/A'}
                          </p>
                        )}
                      </div>
                    );
                  }
                  if (field.type === 'equipo') {
                    return (
                      <div key={field.key}>
                        <Label>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
                        <Select value={formData.equipoId ?? ''} onValueChange={handleEquipoSelect}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar equipo..." />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {equipos.map((e) => (
                              <SelectItem key={e.id} value={e.id}>
                                {e.serialNumber} - {e.marca} {e.modelo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.equipoSerial && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formData.equipoMarca} {formData.equipoModelo} — S/N: {formData.equipoSerial}
                          </p>
                        )}
                      </div>
                    );
                  }
                  if (field.type === 'celular') {
                    return (
                      <div key={field.key}>
                        <Label>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
                        <Select value={formData.celularId ?? ''} onValueChange={handleCelularSelect}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar celular..." />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {celularesList.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.imei} - {c.marca} {c.modelo}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.celularImei && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formData.celularMarca} {formData.celularModelo} — IMEI: {formData.celularImei}
                          </p>
                        )}
                      </div>
                    );
                  }
                  if (field.type === 'sitio') {
                    return (
                      <div key={field.key}>
                        <Label>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
                        <Select value={formData.sitioId ?? ''} onValueChange={handleSitioSelect}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleccionar sitio..." />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {sitios.map((s) => (
                              <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }
                  if (field.type === 'select') {
                    return (
                      <div key={field.key}>
                        <Label>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
                        <Select value={formData[field.key] ?? ''} onValueChange={(v) => setField(field.key, v)}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder={`Seleccionar ${field.label.toLowerCase()}...`} />
                          </SelectTrigger>
                          <SelectContent position="popper">
                            {field.options?.map((opt) => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  }
                  if (field.type === 'checkboxes' && field.options) {
                    const selected = (formData[field.key] ?? '').split(',').map((s) => s.trim()).filter(Boolean);
                    const toggleItem = (item: string) => {
                      const next = selected.includes(item)
                        ? selected.filter((s) => s !== item)
                        : [...selected, item];
                      setField(field.key, next.join(', '));
                    };
                    return (
                      <div key={field.key} className="space-y-2">
                        <Label>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
                        <div className="rounded-md border p-3">
                          <div className="grid gap-2 sm:grid-cols-3">
                            {field.options.map((item) => (
                              <label key={item} className="flex items-center gap-2 text-sm cursor-pointer">
                                <Checkbox
                                  checked={selected.includes(item)}
                                  onCheckedChange={() => toggleItem(item)}
                                />
                                {item}
                              </label>
                            ))}
                          </div>
                        </div>
                        {selected.length > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Seleccionados: {selected.join(', ')}
                          </p>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div key={field.key}>
                      <Label>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
                      <Input
                        value={formData[field.key] ?? ''}
                        onChange={(e) => setField(field.key, e.target.value)}
                        placeholder={field.label}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Short Description */}
              <div className="space-y-2 border-t pt-4">
                <Label>Descripcion Breve (Short Description)</Label>
                <Select value="" onValueChange={(v) => setShortDesc(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Presets..." />
                  </SelectTrigger>
                  <SelectContent position="popper">
                    {SHORT_DESC_PRESETS.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={shortDesc}
                  onChange={(e) => setShortDesc(e.target.value)}
                  placeholder="O escribir manualmente..."
                />
              </div>

              {/* ServiceNow Config (collapsible) */}
              <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-slate-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950 dark:border-blue-800">
                <button
                  type="button"
                  className="flex w-full items-center justify-between p-3 text-left"
                  onClick={() => setShowConfig(!showConfig)}
                >
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    Configuracion del Ticket ServiceNow
                  </span>
                  {showConfig ? <ChevronUp className="h-4 w-4 text-blue-600" /> : <ChevronDown className="h-4 w-4 text-blue-600" />}
                </button>
                {showConfig && (
                  <div className="space-y-3 px-3 pb-3">
                    {/* Row 1: Canal + Service Classification */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="min-w-0">
                        <Label className="text-[11px] font-medium text-muted-foreground">Canal</Label>
                        <Select value={snowConfig.canal} onValueChange={(v) => updateSnowConfig('canal', v)}>
                          <SelectTrigger className="h-9 text-xs w-full"><SelectValue /></SelectTrigger>
                          <SelectContent position="popper">
                            {SNOW_OPTIONS.canal.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="min-w-0">
                        <Label className="text-[11px] font-medium text-muted-foreground">Service Classification</Label>
                        <Select value={snowConfig.serviceClass} onValueChange={(v) => updateSnowConfig('serviceClass', v)}>
                          <SelectTrigger className="h-9 text-xs w-full truncate"><SelectValue /></SelectTrigger>
                          <SelectContent position="popper">
                            {SNOW_OPTIONS.serviceClass.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Row 2: Servicio (full width) */}
                    <div className="min-w-0">
                      <Label className="text-[11px] font-medium text-muted-foreground">Servicio</Label>
                      <Select value={snowConfig.servicio} onValueChange={(v) => updateSnowConfig('servicio', v)}>
                        <SelectTrigger className="h-9 text-xs w-full truncate"><SelectValue /></SelectTrigger>
                        <SelectContent position="popper">
                          {SNOW_OPTIONS.servicio.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Row 3: Symptom + Zone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="min-w-0">
                        <Label className="text-[11px] font-medium text-muted-foreground">Symptom</Label>
                        <Select value={snowConfig.symptom} onValueChange={(v) => updateSnowConfig('symptom', v)}>
                          <SelectTrigger className="h-9 text-xs w-full truncate"><SelectValue /></SelectTrigger>
                          <SelectContent position="popper">
                            {SNOW_OPTIONS.symptom.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="min-w-0">
                        <Label className="text-[11px] font-medium text-muted-foreground">Zone</Label>
                        <Select value={snowConfig.zone} onValueChange={(v) => updateSnowConfig('zone', v)}>
                          <SelectTrigger className="h-9 text-xs w-full"><SelectValue /></SelectTrigger>
                          <SelectContent position="popper">
                            {SNOW_OPTIONS.zone.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {/* Row 4: Grupo de Asignacion (full width) */}
                    <div className="min-w-0">
                      <Label className="text-[11px] font-medium text-muted-foreground">Grupo de Asignacion</Label>
                      <Select value={snowConfig.assignmentGroup} onValueChange={(v) => updateSnowConfig('assignmentGroup', v)}>
                        <SelectTrigger className="h-9 text-xs w-full truncate"><SelectValue /></SelectTrigger>
                        <SelectContent position="popper">
                          {SNOW_OPTIONS.assignmentGroup.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Row 5: Impacto */}
                    <div className="max-w-[200px]">
                      <Label className="text-[11px] font-medium text-muted-foreground">Impacto</Label>
                      <Select value={snowConfig.impact} onValueChange={(v) => updateSnowConfig('impact', v)}>
                        <SelectTrigger className="h-9 text-xs w-full"><SelectValue /></SelectTrigger>
                        <SelectContent position="popper">
                          {SNOW_OPTIONS.impact.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* Bookmarklet install */}
              <div className="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-3 text-center dark:border-amber-700 dark:bg-amber-950">
                <button
                  type="button"
                  className="text-xs text-amber-800 dark:text-amber-200 font-medium flex items-center justify-center gap-1 w-full"
                  onClick={() => setShowBookmarklet(!showBookmarklet)}
                >
                  <GripHorizontal className="h-3 w-3" />
                  {showBookmarklet ? 'Ocultar instrucciones del bookmarklet' : 'Instalar bookmarklet AUTO-FILL (solo una vez)'}
                </button>
                {showBookmarklet && (
                  <div className="mt-2 space-y-2">
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      <strong>PASO UNICO:</strong> Arrastra este boton a tu barra de favoritos del navegador.
                    </p>
                    {/* eslint-disable-next-line react/jsx-no-script-url */}
                    <a
                      href={BOOKMARKLET_CODE}
                      className="inline-block rounded-full bg-[#54A0D6] px-4 py-1.5 text-xs font-bold text-white shadow-md cursor-grab hover:brightness-110"
                      onClick={(e) => {
                        e.preventDefault();
                        toast.info('Arrastra este boton a tu barra de favoritos. No hagas clic.');
                      }}
                    >
                      AUTO-FILL SAZ
                    </a>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400">
                      Solo necesitas hacer esto una vez. Luego al crear tickets, hace clic en el favorito.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 border-t pt-4">
                <Button className="flex-1" onClick={handleGenerate} disabled={generated}>
                  <Ticket className="mr-2 h-4 w-4" />
                  {generated ? 'Ticket Generado' : 'Generar Ticket'}
                </Button>
                {generated && (
                  <Button variant="outline" asChild>
                    <a href={SNOW_NEW_INC} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Abrir ServiceNow
                    </a>
                  </Button>
                )}
              </div>

              {/* Post-generation: success message */}
              {generated && (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200 flex items-center gap-2">
                    <Check className="h-4 w-4" /> Datos copiados al portapapeles
                  </p>
                  <p className="mt-1 text-xs text-green-700 dark:text-green-300">
                    En ServiceNow, haga clic en el favorito <strong>&quot;AUTO-FILL SAZ&quot;</strong> de la barra de marcadores para completar los campos automaticamente.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="ghost" onClick={reset}>
                      Crear otro ticket
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
