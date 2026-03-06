/**
 * Seed wiki_pages from "Procesos TECH 2025 v1.1" PDF content
 * Usage: npx tsx scripts/seed-wiki.ts
 */
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { wikiPages } from '../src/lib/db/schema';

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql);

interface WikiSeed {
  titulo: string;
  slug: string;
  categoria: string;
  orden: number;
  contenido: string;
}

const pages: WikiSeed[] = [
  // ================================================================
  // POLITICAS
  // ================================================================
  {
    titulo: 'Políticas de Asignaciones',
    slug: 'politicas-asignaciones',
    categoria: 'Políticas',
    orden: 1,
    contenido: `# Políticas de Asignaciones

## Política de Asignaciones de Equipamiento para Posiciones Nuevas

En **todos los casos** que se traten de solicitudes de equipamiento para **Posiciones Nuevas**, sin diferenciar el área, se debe imputar el costo del equipamiento → Proceder con **Proceso Solicitud Cotización**.

## Política de Asignaciones de Equipamiento para Posiciones Existentes

### Area Supply

**Notebooks:**
- Empleados White Collar bandas **I a VII** → corresponde asignación de notebook → Proceso Asignación Predeterminado.
- Empleados White Collar bandas **VIII, IX, X** → deben realizar la compra del equipo, con OK del Manager banda V o superior (Banda IV) → Proceso Solicitud Cotización.

**Celulares:**
- Empleados White Collar bandas **I a VII** → corresponde asignación de celular + línea → Proceso Asignación Predeterminado.
- Empleados White Collar bandas **VIII, IX, X** → deben realizar la compra del equipo + línea, con OK del Manager banda V o superior (Banda IV) → Proceso Solicitud Cotización.
- Empleados **Blue Collar** → deben realizar compra del equipo + línea, con OK del líder banda V o superior (Banda IV) → Proceso Solicitud Cotización.

### Area Ventas

**Notebooks y Celulares:**
- Empleados White Collar **sin importar la banda** → Proceso Asignación Predeterminado.
- Empleados Blue Collar → deben contar con el OK del gerente para proceder con la asignación.`,
  },

  // ================================================================
  // ASIGNACIONES
  // ================================================================
  {
    titulo: 'Asignaciones Predeterminadas',
    slug: 'asignaciones-predeterminadas',
    categoria: 'Asignaciones',
    orden: 2,
    contenido: `# Asignaciones Predeterminadas

El proceso aplica para los casos en que usuarios soliciten asignaciones de Notebooks y/o Celulares. Se deberá validar si corresponde asignación o cotización, según la **Política Vigente**.

## Pasos

1. Cuando se reciba un tkt por solicitud de asignación de Notebook y/o Celular, solicitar al usuario:

> Estimado/a para avanzar con la solicitud necesitamos nos indique la siguiente información:
> - Legajo
> - Área
> - Banda
> - Motivo
> - Sitio

2. Si **no corresponde** asignación según política → cerrar tkt con comentario:

> "Estimado según la política vigente de la compañía, para avanzar con la solicitud debemos realizar la cotización de compra del equipo, cuyo costo deberá ser asumido por el área solicitante. Favor de generar un nuevo tkt solicitando la compra del equipamiento."

3. Si **corresponde** asignación → validar en inventario que el legajo del usuario realmente no tenga asignado equipo (Notebook) y/o (IMEI + Línea).

   En caso de **diferencias** → programar tkt e informar vía mail a Asset Analyst, Coordinador FS y Líder FS.

4. Proceder a realizar la asignación; generar un **tkt hijo** y derivar a la fila de **LAS IMA On site Soporte Técnico**, asumirlo y cerrarlo.

5. Derivar el **tkt Padre** a la fila de **LAS Asset Argentina** con el formato correspondiente.

## Formato Asignación Notebook

| Campo | Valor |
|-------|-------|
| Breve descripción | ASIGNACION NOTEBOOK |
| Legajo | (legajo del usuario) |
| Apellido y Nombre | (nombre del usuario) |
| Notebook Asignada | Marca / Modelo / Serie |
| Motivo | (motivo de asignación) |
| Tipo Asignación | Principal |
| Sitio | (sitio del usuario) |

## Formato Asignación Celular

| Campo | Valor |
|-------|-------|
| Breve descripción | ASIGNACION CELULAR |
| Legajo | (legajo del usuario) |
| Apellido y Nombre | (nombre del usuario) |
| Celular Asignado | Marca / Modelo / IMEI / Línea |
| Motivo | (motivo de asignación) |
| Tipo Asignación | Principal |
| Sitio | (sitio del usuario) |

## Tipos de Asignación

- **Asignación Principal:** El equipo se asigna como Principal cuando va a ser utilizado por un usuario empleado de CMQ con legajo, como único equipo.
- **Asignación Secundaria:** El equipo se asigna como Secundario en los siguientes casos:
  - Cuando va a ser utilizado por un **usuario Externo sin legajo de CMQ**. El equipo se debe pasar asignado al responsable del usuario con Legajo CMQ y en comentario indicar "Asignado a Externo: Nombre y Apellido".
  - Cuando va a ser utilizado como **equipo multiusuario** por personal de CMQ. El equipo se debe pasar asignado al responsable del Área con Legajo CMQ y en comentario indicar; Ejemplo "Asignado Sector Línea 1 – Puesto Lavadora".`,
  },

  // ================================================================
  // CAMBIOS POR ROTURA
  // ================================================================
  {
    titulo: 'Cambio de Notebooks/Celulares por Rotura',
    slug: 'cambio-por-rotura',
    categoria: 'Cambios por Rotura',
    orden: 3,
    contenido: `# Cambio de Notebooks/Celulares por Rotura

El proceso aplica en los casos de solicitudes de cambios de notebooks y/o celulares por rotura y **el técnico cuenta con stock en sitio** para resolver la solicitud.

> Si **no cuenta con stock**, continuar con el Proceso **Solicitudes de Envíos de Notebooks/Celulares por Cambios a EC**.

## Pasos

1. Solicitar al usuario la información del equipo dañado:

**Para Notebooks:**
> - Legajo
> - Marca Notebook
> - Modelo Notebook
> - Número de Serie Notebook
> - Fotos del equipo donde se pueda apreciar la rotura o comentarios sobre la falla
> - Sitio

**Para Celulares:**
> - Legajo
> - Marca Celular Corporativo
> - Modelo Celular Corporativo
> - IMEI Celular Corporativo: Marcando en el teclado el código *#06#
> - Línea Corporativa
> - Fotos del equipo donde se pueda apreciar la rotura
> - Sitio

⚠️ Si el usuario no responde al tercer día → **Proceso Cierre TKTS Falta Respuesta**

2. Validar en el inventario que el legajo del usuario tenga correctamente asignado el equipo indicado en el tkt.

3. Proceder a realizar la asignación; generar un **tkt hijo** y derivar a **LAS IMA On site Soporte Técnico**.

4. Derivar el **tkt Padre** a **LAS Asset Argentina** con formato de asignación correspondiente.

## Formato Asignación Notebook por Rotura

- **Breve descripción:** ASIGNACION NOTEBOOK
- Legajo / Apellido y Nombre
- Notebook Asignada: Marca / Modelo / Serie
- Motivo: **Reposición por rotura**
- Tipo Asignación: Principal / Secundaria
- Notebook Devuelta: Marca / Modelo / Serie
- Estado Equipo: Roto Fuera Garantía – Roto en Garantía – Disponible
- Comentarios: Detallar Falla o Rotura
- Sitio

## Formato Asignación Celular por Rotura

- **Breve descripción:** ASIGNACION CELULAR
- Legajo / Apellido y Nombre
- Celular Asignado: Marca / Modelo / IMEI / Línea
- Motivo: **Reposición por rotura**
- Tipo Asignación: Principal / Secundaria
- Celular Devuelto: Marca / Modelo / IMEI
- Estado Equipo: Roto Fuera Garantía – Disponible
- Comentarios: Detallar Falla o Rotura
- Sitio`,
  },

  // ================================================================
  // ENVIOS DESDE EC
  // ================================================================
  {
    titulo: 'Solicitudes de Envíos de Notebooks/Celulares a EC',
    slug: 'envios-desde-ec',
    categoria: 'Envíos desde EC',
    orden: 4,
    contenido: `# Solicitudes de Envíos de Notebooks/Celulares por Cambios a EC

El proceso aplica en los casos de solicitudes de cambios de Notebooks y/o Celulares por rotura y **el técnico NO cuenta con stock en sitio**.

## Pasos

1. Solicitar al usuario la misma información que en el proceso de cambio por rotura.

2. Validar en inventario que el legajo del usuario tenga correctamente asignado el equipo.

3. Generar un **tkt hijo** para ser derivado a **LAS Logística IT Argentina** con el siguiente formato:

### Solicitud Notebooks

| Campo | Valor |
|-------|-------|
| Breve Descripción | SOLICITUD NOTEBOOK |
| Usuario | (nombre) |
| Legajo | (legajo) |
| Banda | (banda) |
| Área | (área) |
| Solicitud | Se solicita envío de Notebook para recambio |
| Datos Equipo Dañado | Marca / Modelo / Serie |
| Motivo | Recambio por Rotura |
| Comentarios | Detallar Falla o Rotura |
| Sitio | (sitio) |

### Solicitud Celulares

| Campo | Valor |
|-------|-------|
| Breve Descripción | SOLICITUD CELULAR |
| Solicitud | Se solicita envío de Celular para recambio |
| Datos Celular Dañado | Marca / Modelo / IMEI / Número de Línea |
| Motivo | Recambio por Rotura |
| Comentarios | Detallar Falla o Rotura |

4. El **tkt Padre** queda programado hasta recibir el equipo en sitio. Colocar Nota Interna:
> Se deriva tkt hijo XXXXXXXXXX a fila LAS Logística IT Argentina por solicitud del equipo para recambio.

5. **LAS Logística IT Argentina** informa vía mail el equipo enviado. Una vez recibido en sitio, confirmar y proceder con la asignación.

> **Nota:** Los usuarios deben realizar la devolución de los celulares con su correspondiente cargador y formateados sin pin, patrón o clave.`,
  },

  // ================================================================
  // ONBOARDING
  // ================================================================
  {
    titulo: 'Asignación Equipamiento Onboarding',
    slug: 'onboarding',
    categoria: 'Onboarding',
    orden: 5,
    contenido: `# Proceso Asignación Equipamiento Onboarding

El proceso aplica en los casos de asignaciones de equipos para los **nuevos ingresos a la compañía**. Puede consistir en asignación de Notebook y/o Celular, según se requiera.

## Pasos

1. Generar un **tkt Padre** y un **tkt hijo**. Derivar el tkt hijo a **LAS IMA On site Soporte Técnico**, asumirlo y cerrarlo.

2. Derivar el **tkt Padre** a **LAS Asset Argentina** con el formato correspondiente.

## Formato Asignación Notebook Onboarding

- **Breve descripción:** ASIGNACION NOTEBOOK
- Legajo / Apellido y Nombre
- Notebook Asignada: Marca / Modelo / Serie
- Motivo: **Onboarding**
- Tipo Asignación: Principal
- Sitio

## Formato Asignación Celular y Línea Onboarding

- **Breve descripción:** ASIGNACION CELULAR Y LINEA
- Legajo / Apellido y Nombre
- Celular Asignado: Marca / Modelo / IMEI / Línea
- Motivo: **Onboarding**
- Tipo Asignación: Principal
- Sitio

## Solicitud de Línea Celular Onboarding

1. Solicitar número de línea a **LAS Asset Argentina** con formato:
   - Breve: SOLICITUD LINEA CELULAR
   - Legajo, Nombre, Sitio, IMEI del celular asignado
   - Motivo: Onboarding

2. Solicitar vía mail a **Líder FS y Coordinador FS** la generación del chip:
   - Asunto: SOLICITUD CHIP OB – Apellido y Nombre Legajo "Número"
   - Nombre y Apellido, DNI, Número de Línea, Número TKT, Sucursal para retiro de chip

3. Se informará vía mail el número de autorización brindado por el portal Claro.

## Reimpresión de SIM

1. Solicitar al usuario: Legajo, DNI, Marca, Modelo, IMEI (*#06#), Línea Corporativa, Motivo Reimpresión.
2. Solicitar vía mail a Líder FS y Coordinador FS la generación del chip.
3. Se informará el número de autorización correspondiente.`,
  },

  // ================================================================
  // RECUPERO
  // ================================================================
  {
    titulo: 'Proceso Recupero Offboarding',
    slug: 'recupero-offboarding',
    categoria: 'Recupero',
    orden: 6,
    contenido: `# Proceso Recupero Offboarding

El proceso inicia cuando el técnico recibe los equipos (notebooks y/o celular) correspondientes a un **Offboarding** (persona que deja la compañía).

## Pasos

1. Revisar en el momento de la entrega el estado de los equipos recibidos (notebook y/o celular + cargadores). Verificar que:
   - No sean entregados **bloqueados** (contraseñas personales)
   - Sea devuelto con el **cargador** correspondiente

2. Generar un **tkt Padre** y un **tkt hijo**. Derivar el tkt hijo a **LAS IMA On site Soporte Técnico**, asumirlo y cerrarlo.

3. Derivar el **tkt Padre** a **LAS Asset Argentina** con el formato de recupero.

## Formato Recupero Notebook

- **Breve descripción:** RECUPERO DE EQUIPO
- Legajo / Apellido y Nombre
- Equipo Recuperado: Notebook – Marca / Modelo / Serie
- Cargador: SI / NO
- Motivo: **Offboarding**
- Usuario que Devuelve
- Estado Equipo: Roto Fuera Garantía – Roto en Garantía – **Reservada**
- Comentarios
- Sitio

## Formato Recupero Celular

- **Breve descripción:** RECUPERO DE EQUIPO
- Legajo / Apellido y Nombre
- Equipo Recuperado: Celular + Línea – Marca / Modelo / IMEI / Línea
- Cargador: SI / NO
- Bloqueado Patrón/PIN/Clave: SI / NO
- Motivo: **Offboarding**
- Estado Equipo: Roto Fuera Garantía – Disponible – **Reservada**
- Comentarios
- Sitio

> **Nota "Reservada Posición Vacante":** Si el equipo devuelto está en condiciones de volver a ser reasignado, se deberá dejar en estado **Reservada Posición Vacante**. Los equipos devueltos por Offboarding deben reservarse para cubrir las posiciones ante un nuevo Onboarding.`,
  },

  // ================================================================
  // ROBO / PERDIDA
  // ================================================================
  {
    titulo: 'Reposición por Robo o Pérdida',
    slug: 'robo-perdida',
    categoria: 'Robo/Pérdida',
    orden: 7,
    contenido: `# Reposición de Notebooks/Celulares por Robo

## Requisitos

1. Solicitar al usuario:
   - Usuario, Legajo, Área
   - Equipo Robado: Notebook y/o Celular
   - **Denuncia adjunta** – Solo se admite en formato PDF donde se detalle el equipo robado
   - **OK adjunto del responsable** (Banda 6 o superior y/o HRBP) – El OK debe estar adjunto en formato .MSG
   - Sitio

2. Validar en inventario el equipamiento asignado al usuario.

3. Generar **tkt hijo** a **LAS Asset Argentina** para registrar el robo.

## Formato Robo Notebook

- **Breve descripción:** ROBO NOTEBOOK
- Legajo / Apellido y Nombre
- Denuncia Adjunta: Adjuntar copia de denuncia policial
- Autorización Adjunta: Adjuntar OK del Manager o HRBP
- Notebook Robada: Marca / Modelo / Serie
- Sitio

## Formato Robo Celular

- **Breve descripción:** ROBO CELULAR
- Legajo / Apellido y Nombre
- Denuncia Adjunta: Adjuntar copia de denuncia policial
- Autorización Adjunta: Adjuntar OK del Manager o HRBP
- Celular Robado: Marca / Modelo / IMEI / Línea
- Sitio

4. Proceder a la reasignación del equipamiento según el proceso correspondiente.

---

# Reposición de Celulares por Pérdida de Usuario

## Requisitos

1. Solicitar al usuario:
   - Usuario, Legajo, Área
   - **Exposición Policial por pérdida** – Solo se admite en formato PDF
   - **OK adjunto del responsable** (Banda 6 o superior y/o HRBP) – en formato .MSG
   - Sitio

2. Validar en inventario.

3. Generar **tkt hijo** a **LAS Asset Argentina** con formato:
   - Breve: PERDIDA CELULAR
   - Exposición Adjunta, Autorización Adjunta
   - Celular: Marca / Modelo / IMEI / Línea
   - Sitio

4. Proceder a la reasignación según proceso correspondiente.`,
  },

  // ================================================================
  // INSUMOS
  // ================================================================
  {
    titulo: 'Políticas de Solicitud/Asignación de Insumos',
    slug: 'politicas-insumos',
    categoria: 'Insumos',
    orden: 8,
    contenido: `# Políticas Solicitud/Asignación de Insumos

## Insumos para Salas de Reuniones

- Salas **ZOOM ROOM** o **TP CISCO** → insumo lo provee Tech → Proceso: Solicitudes de Envíos de Insumos desde EC
- Salas **comunes** → costo lo asume el área solicitante → Proceso: Solicitud de Cotización

## Insumos Equipamiento del Área IT
Notebooks/Desktops → insumo lo provee Tech → Proceso: Solicitudes de Envíos de Insumos desde EC

## Insumos Equipamiento del Área OT
Costo lo asume el área solicitante → Proceso: Solicitud de Cotización

---

# Asignación de Insumos Stock Sitio

Cuando se reciba un tkt por cambios de insumos por roturas y **se utilice stock del sitio**:

1. Solicitar al usuario: Usuario, Legajo, Área, Equipo Afectado (Marca/Modelo/Serie), Sector, Sitio.
2. Validar en inventario que el legajo del usuario tenga asociado el equipo indicado.
3. Generar tkt hijo a **LAS IMA On site Soporte Técnico**.
4. Derivar tkt Padre a **LAS Asset Argentina** con formato:

| Campo | Valor |
|-------|-------|
| Breve descripción | ASIGNACION INSUMO |
| Legajo / Nombre | (datos usuario) |
| Insumo Asignado | Marca / Modelo / Serie |
| Datos Equipo Afectado | Marca / Modelo / Serie |
| Sector | (sector) |
| Motivo | Recambio por Rotura |
| Comentarios | Detallar Falla o Rotura |
| Sitio | (sitio) |

---

# Solicitudes de Envíos de Insumos a EC

Cuando se necesite envío del insumo desde EC por **falta de stock** en sitio:

1. Solicitar la misma información al usuario.
2. Validar en inventario.
3. Generar tkt hijo a **LAS Logística IT Argentina** con formato:
   - Breve: SOLICITUD INSUMO
   - Insumo Solicitado lo más detallado posible
   - Datos Equipo Afectado, Sector, Motivo, Comentarios, Sitio

### Ejemplos de detalle de insumos:
- **Cables:** Indicar tipo y longitud – HDMI 5 metros
- **Discos:** Indicar tamaño y tipo – SSD 256GB – M2 256GB
- **Memorias:** Indicar Equipo, Tipo, Tamaño, Frecuencia – RAM Notebook DDR4 16 GB 3200 GHz`,
  },

  // ================================================================
  // COTIZACION
  // ================================================================
  {
    titulo: 'Proceso Solicitud Cotización',
    slug: 'solicitud-cotizacion',
    categoria: 'Cotización',
    orden: 9,
    contenido: `# Proceso Solicitud Cotización

1. Solicitar al usuario: Legajo, Banda, Área, Motivo de la Solicitud.

2. Con la información brindada:
   - Validar en inventario que el usuario no posea ningún equipo asignado anteriormente
   - Validar si corresponde asignación o compra según la política vigente

3. Si **no corresponde** asignación según política, informar al usuario vía tkt:
> "Estimado según la política vigente de la compañía, para avanzar con la solicitud debemos realizar la cotización de compra del equipo, cuyo costo deberá ser asumido por el área solicitante. Favor de confirmar si desea avanzar."

4. Con la confirmación del usuario, derivar el tkt a **LAS Logística IT Argentina** con formato:

| Campo | Valor |
|-------|-------|
| Breve descripción | SOLICITUD COTIZACION |
| Insumo Solicitado | Notebook / Celular + Línea |
| Especificaciones Técnicas | Ver ejemplos |
| Cantidad | (cantidad) |
| Solicitante | (nombre) |
| Legajo | (legajo) |
| Área | (área) |
| Lugar de Entrega | (sitio) |

### Ejemplos de especificaciones:
- Notebooks: Procesador I5 – 16 GB de RAM – SSD 256 GB
- Tablet: 10" 8GB RAM
- Desktop: Procesador I5 – 16 GB de RAM – SSD 256 GB (aclarar puertos especiales)
- Cables: Indicar tipo y longitud
- Discos: Indicar tamaño y tipo
- Memorias: Indicar Equipo, Tipo, Tamaño, Frecuencia`,
  },

  // ================================================================
  // ROAMING
  // ================================================================
  {
    titulo: 'Solicitud de Roaming',
    slug: 'solicitud-roaming',
    categoria: 'Roaming',
    orden: 10,
    contenido: `# Solicitud de Roaming

El proceso se inicia cuando el técnico recibe vía SNOW el requerimiento por la habilitación del roaming o Larga Distancia Internacional (LDI).

## Política

| Banda | Tipo | Acción |
|-------|------|--------|
| **0 a 5** | Laboral y Personal (ZBB Tech) | **Siempre Activo** – solicitar directamente la activación |
| **6 a 99** | Laboral | Se activa con OK del Gerente Banda 5 o superior, indicando cuenta y CECO del área |

## Pasos

1. Solicitar en el tkt:
   - Número de línea
   - Legajo, Nombre y Apellido, Banda, Área
   - Destino del viaje
   - Fecha inicio y fin del viaje
   - OK de Gerente Banda 5 o superior
   - Cuenta y CECO

2. Validar vía mail con **Tebouli, Joselyn** (josetebo@quilmes.com.ar) con copia a Coordinador FS y Líder FS, que la Cuenta y CECO estén OK.

3. Cargar la información en el SP Activación Roaming. Solicitar vía mail a **Líder FS** con copia al Coordinador FS la activación del Roaming.

   **Asunto:** SOLICITUD ROAMING – Apellido y Nombre Legajo "Número"

4. Al confirmar la activación, cerrar el tkt con:
> "Estimado Usuario: Atento a lo solicitado, confirmo habilitación del servicio de roaming para la línea (nro).
> En caso de presentar inconvenientes con el servicio:
> - Líneas Claro: +54 911 5555 5555
> - Líneas Movistar: +54 911 5321 4212"

Adjuntar SOP Roaming al cierre.`,
  },

  // ================================================================
  // TELEFONIA
  // ================================================================
  {
    titulo: 'Ingreso de Línea a Flota CMQ',
    slug: 'ingreso-flota',
    categoria: 'Telefonía',
    orden: 11,
    contenido: `# Ingreso de Línea a Flota CMQ

El proceso se inicia cuando el técnico recibe vía SNOW el requerimiento del usuario por el **ingreso a la flota de CMQ de su línea personal**.

> **Requisitos:** Pueden solicitar el ingreso usuarios banda **I a VII** y solo pueden ingresar líneas de **CLARO**. Caso contrario, el usuario previamente deberá gestionar la portabilidad.

## Pasos

1. Solicitar al usuario:
   - Legajo, Nombre y Apellido, Banda
   - Número de Línea
   - Últimas **3 facturas** abonadas en CLARO (si portabilidad: 1 factura)
   - OK de su Manager aprobando el ingreso

2. Enviar vía mail al **Líder IT**, con copia a Coordinador, Líder de FS y Asset Analyst.

3. Con la confirmación del Líder IT, generar tkt hijo a **LAS Asset Argentina**:
   - Breve: INGRESO A FLOTA
   - Legajo, Nombre, Línea
   - Motivo: Ingreso a Flota
   - Número TKT, Tipo Asignación, Sitio
   - Adjuntar copia mail Líder IT autorizando

4. Cerrar tkt informando al usuario:
> "Estimado Usuario: Recuerde que luego del ingreso a la flota de CMQ de su línea celular, deberá abonar el remanente de la factura con el saldo del mes en que se realizó el ingreso."`,
  },
  {
    titulo: 'Cesión Telefonía Móvil',
    slug: 'cesion-telefonia',
    categoria: 'Telefonía',
    orden: 12,
    contenido: `# Cesión Telefonía Móvil

El proceso se inicia cuando el técnico recibe vía SNOW el requerimiento por **cesión de línea telefónica**.

## Pasos

1. Solicitar al usuario:
   - Legajo, Nombre y Apellido, Número de Línea
   - Datos del Celular a Devolver: Marca, Modelo, IMEI (*#06#)
   - Autorización Manager Banda 5 o superior y/o HRBP aprobando la cesión

2. Validar en inventario que el legajo tenga asociado el IMEI y número de línea.

3. Verificar que el usuario haya realizado la **devolución del equipo celular** (formateado, sin pin ni claves). Si no devolvió → informar que la cesión no se puede realizar.

4. Una vez devuelto el equipo → generar tkt de offboarding y continuar.

5. Adjuntar documentación para completar por el usuario:

   **Para líneas Claro Argentina:**
   - SDS - Cambio Titularidad (firmado por nuevo titular)
   - ACP (Aceptación condiciones de activación, firmado por nuevo titular)
   - Imagen frente y dorso de DNI del nuevo titular
   - Plan Vigente elegido

   **Para líneas Movistar Argentina:**
   - Mail al ejecutivo de cuentas con nombre del nuevo titular
   - Plan Vigente
   - Formulario por Cambio Titularidad firmado (cedente y cesionario)

6. Enviar documentación completa al **IT Líder** con copia a Coordinador, Líder de FS y Asset Analyst.

7. Con la confirmación, generar tkt hijo a **LAS Asset Argentina**:
   - Breve: SALIDA DE FLOTA
   - Legajo, Nombre, Línea
   - Motivo: Salida de Flota
   - TKT Offboarding, adjuntar mail Líder IT

8. Cerrar tkt:
> "Estimado Usuario: Se realizó la cesión de la línea correspondiente. El equipo celular debe ser devuelto al RI o entregado en el sitio a Field Support."`,
  },

  // ================================================================
  // IMPRESORAS
  // ================================================================
  {
    titulo: 'Gestión Servicio Impresoras',
    slug: 'gestion-impresoras',
    categoria: 'Impresoras',
    orden: 13,
    contenido: `# Gestión Servicio Impresoras

## Alta de Impresora

1. Generar tkt a **Networking** solicitando asignación de IP dentro de la VLAN del sitio.
2. Generar tkt a **Help Desk** solicitando creación de cola de impresión en \\\\onetamps002 y \\\\onetamps003.
3. Generar tkt a **LAS Asset Argentina** con formato:

   - **Breve:** ALTA IMPRESORA
   - Marca, Modelo, Serie, IP, Cola Impresión, Ubicación Física
   - Estado: ACTIVO
   - Motivo: ALTA

## Gestiones por Rotura - Solicitud Servicio Técnico

1. Enviar mail a **mpshelpdesk@lexmark.com** con copia a Coordinador FS y Líder FS:
   - Asunto: Solicitud Servicio Técnico – Número de Serie – Sitio
   - Marca, Modelo, Serie, IP, Ubicación, Fallas Detectadas

2. Lexmark responde con **número de caso**.

3. Generar tkt a **LAS Asset Argentina**:
   - Breve: ACTUALIZAR INVENTARIO IMPRESORAS
   - Estado: **EN REPARACION**
   - Motivo: REPARACION IMPRESORA
   - Número de Caso Lexmark

4. Cuando Lexmark repare → generar otro tkt cambiando Estado a **ACTIVO**.

## Reemplazo de Impresora

Generar tkt a **LAS Asset Argentina** con formato:
- Breve: CORRECCION INVENTARIO IMPRESORAS
- **Nueva Impresora:** Marca, Modelo, Serie, IP, Ubicación, Estado: ACTIVO
- **Impresora Devuelta:** Marca, Modelo, Serie, IP, Ubicación, Estado: En Reparación, Motivo: Reemplazo

## Baja de Impresora

Con informe de Lexmark + autorización del **Líder de IT**:
- Breve: BAJA IMPRESORA
- Estado: **BAJA**
- Adjuntar mail de autorización

## Cambio Direccionamiento IP

- Breve: CORRECCION INVENTARIO IMPRESORAS
- Motivo: Cambio de IP
- IP Anterior / IP Nueva
- Adjuntar mail de autorización

## Solicitud Retiro de Toner/UI

Mail a **dfmcms@lexmark.com** con copia a Coordinador FS y Líder FS:
- Asunto: Solicitud Retiro Insumos – Sitio
- Indicar cantidad y tipo de insumos
- Adjuntar archivo Excel RETIRO INSUMOS

## Solicitud Pedido de Toner/UI

Mail a **dfmcms@lexmark.com** (adjuntar estadísticas como evidencia):
- Asunto: Solicitud Reposición de Insumos – Serie – Sitio
- Niveles para solicitar: **Toner < 10%**, **UI < 5%**
- Marca, Modelo, Serie, IP, Ubicación, Sitio`,
  },

  // ================================================================
  // CIERRE DE TICKETS
  // ================================================================
  {
    titulo: 'Proceso Cierre TKTS Falta Respuesta',
    slug: 'cierre-tickets',
    categoria: 'Cierre de Tickets',
    orden: 14,
    contenido: `# Proceso Cierre TKTS Falta Respuesta

Se aplica en los casos donde es necesario solicitar información al usuario y este **no contesta** después del **tercer pedido**.

## Configuración del Ticket

En INC como REQ cambiar:
- **State:** ON HOLD (En Espera)
- **On hold Reason:** Awaiting User Information
- **Attempt:** 1 Strike / 2 Strike / 3 Strike

## Secuencia

| Día | Acción | Comentario |
|-----|--------|------------|
| **Día 1** | Enviar consulta. Si no contesta → 1er Strike | ***1ER STRIKE*** Por favor solicitamos que pueda enviarnos la información solicitada, Muchas gracias. |
| **Día 2** | Sin respuesta → 2do Strike | ***2DO STRIKE*** Por favor solicitamos que pueda enviarnos la información solicitada, Muchas gracias. |
| **Día 3** | Sin respuesta → 3er Strike | ***3ER STRIKE*** Por favor solicitamos que pueda enviarnos la información solicitada, Muchas gracias. |
| **Día 4** | Cerrar ticket | Se procede al cierre del ticket por falta de respuesta, en caso de una nueva solicitud por favor generar un nuevo ticket. |`,
  },

  // ================================================================
  // CONTACTOS
  // ================================================================
  {
    titulo: 'Contactos del Equipo TECH',
    slug: 'contactos-equipo',
    categoria: 'Políticas',
    orden: 0,
    contenido: `# Contactos del Equipo TECH

| Función | Nombre | Correo Electrónico |
|---------|--------|-------------------|
| IT Manager RDLP | Garcés Montenegro, Jorge | jorge.garces@ab-inbev.com |
| IT Líder | Federico La Regina | fedelare@quilmes.com.ar |
| Coordinador FS | Correa, Lautaro | Lautaro.Correa@quilmes.com.ar |
| Líder FS | Cristian Vargas | crivarga@quilmes.com.ar |
| Asset Analyst | Vacante | — |
| Asset Logística | Micheli Leiva | Micheli.Leiva@quilmes.com.ar |
| Asset Recupero | Ochera Mariani, Juan Pablo | juan.ochera@quilmes.com.ar |

## Filas de ServiceNow frecuentes

| Fila | Uso |
|------|-----|
| LAS Asset Argentina | Registrar asignaciones, recuperos, robos en inventario |
| LAS IMA On site Soporte Técnico | Registrar tareas de campo (tkt hijo) |
| LAS Logística IT Argentina | Solicitudes de envíos desde EC |
| Networking-LAS | Asignación de IP |
| LAS Help Desk | Creación de colas de impresión |`,
  },
];

async function seed() {
  console.log('Seeding wiki pages...');

  for (const page of pages) {
    try {
      await db
        .insert(wikiPages)
        .values({
          titulo: page.titulo,
          slug: page.slug,
          contenido: page.contenido,
          categoria: page.categoria,
          orden: page.orden,
          activo: true,
        })
        .onConflictDoUpdate({
          target: wikiPages.slug,
          set: {
            titulo: page.titulo,
            contenido: page.contenido,
            categoria: page.categoria,
            orden: page.orden,
            updatedAt: new Date(),
          },
        });
      console.log(`  ✓ ${page.categoria} → ${page.titulo}`);
    } catch (err) {
      console.error(`  ✗ ${page.titulo}:`, (err as Error).message);
    }
  }

  console.log(`\nDone! ${pages.length} wiki pages seeded.`);
  await sql.end();
  process.exit(0);
}

seed();
