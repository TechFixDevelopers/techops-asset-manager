import type { SnowTicketData, SnowApiResult, SnowClipboardResult } from '@/lib/types/servicenow';

// ============================================================
// MODE DETECTION
// ============================================================

export function getServiceNowMode(): 'api' | 'clipboard' {
  const { SERVICENOW_INSTANCE_URL, SERVICENOW_USERNAME, SERVICENOW_PASSWORD } = process.env;
  if (SERVICENOW_INSTANCE_URL && SERVICENOW_USERNAME && SERVICENOW_PASSWORD) {
    return 'api';
  }
  return 'clipboard';
}

function getInstanceUrl(): string {
  return process.env.SERVICENOW_INSTANCE_URL || 'https://abinbevww.service-now.com';
}

// ============================================================
// API MODE
// ============================================================

export async function createIncidentAPI(data: SnowTicketData): Promise<SnowApiResult> {
  const instanceUrl = process.env.SERVICENOW_INSTANCE_URL!;
  const username = process.env.SERVICENOW_USERNAME!;
  const password = process.env.SERVICENOW_PASSWORD!;

  const response = await fetch(`${instanceUrl}/api/now/table/incident`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
    },
    body: JSON.stringify({
      caller_id: data.callerLegajo,
      assignment_group: data.assignmentGroup,
      short_description: data.shortDescription,
      description: data.description,
      u_symptom: data.symptom,
      contact_type: data.contactType,
      impact: data.impact,
      urgency: data.urgency,
      category: data.category,
      u_select_zone: data.zone,
      location: data.location,
    }),
  });

  if (!response.ok) {
    throw new Error(`ServiceNow API error: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  return {
    mode: 'api',
    incNumber: result.result.number,
    sysId: result.result.sys_id,
  };
}

// ============================================================
// CLIPBOARD MODE
// ============================================================

export function generateClipboardText(data: SnowTicketData): string {
  return [
    `Caller: ${data.callerName} (${data.callerLegajo})`,
    `Assignment Group: ${data.assignmentGroup}`,
    `Short Description: ${data.shortDescription}`,
    `Description: ${data.description}`,
    `Symptom: ${data.symptom}`,
    `Contact Type: ${data.contactType}`,
    `Impact: ${data.impact}`,
    `Urgency: ${data.urgency}`,
    `Category: ${data.category}`,
    `Zone: ${data.zone}`,
    `Location: ${data.location}`,
  ].join('\n');
}

function sanitizeForJs(input: string): string {
  return input
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
}

export function generateBookmarklet(data: SnowTicketData): string {
  const s = (v: string) => sanitizeForJs(v);
  const script = `
    (function(){
      try{
        g_form.setValue('assignment_group','${s(data.assignmentGroup)}');
        g_form.setValue('short_description','${s(data.shortDescription)}');
        g_form.setValue('u_symptom','${s(data.symptom)}');
        g_form.setValue('contact_type','${s(data.contactType)}');
        g_form.setValue('impact','${s(data.impact)}');
        g_form.setValue('urgency','${s(data.urgency)}');
        g_form.setValue('category','${s(data.category)}');
        g_form.setValue('u_select_zone','${s(data.zone)}');
        alert('Campos completados. Ingrese caller_id manualmente: ${s(data.callerLegajo)}');
      }catch(e){
        alert('Error: '+e.message+'\\nAsegurese de estar en el formulario de nuevo incidente de ServiceNow.');
      }
    })();
  `
    .replace(/\s+/g, ' ')
    .trim();

  return `javascript:${encodeURIComponent(script)}`;
}

export function generateConsoleScript(data: SnowTicketData): string {
  const s = (v: string) => sanitizeForJs(v);
  return [
    `g_form.setValue('short_description', '${s(data.shortDescription)}');`,
    `g_form.setValue('description', '${s(data.description)}');`,
    `g_form.setValue('u_symptom', '${s(data.symptom)}');`,
    `g_form.setValue('contact_type', '${s(data.contactType)}');`,
    `g_form.setValue('impact', '${s(data.impact)}');`,
    `g_form.setValue('urgency', '${s(data.urgency)}');`,
    `g_form.setValue('category', '${s(data.category)}');`,
    `g_form.setValue('u_select_zone', '${s(data.zone)}');`,
    `alert('Campos completados. Ingrese caller_id manualmente: ${s(data.callerLegajo)}');`,
  ].join('\n');
}

export function generateClipboardResult(data: SnowTicketData): SnowClipboardResult {
  return {
    mode: 'clipboard',
    clipboardText: generateClipboardText(data),
    consoleScript: generateConsoleScript(data),
    bookmarklet: generateBookmarklet(data),
    snowUrl: `${getInstanceUrl()}/nav_to.do?uri=incident.do?sys_id=-1`,
  };
}
