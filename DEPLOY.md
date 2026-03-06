# TechOps Asset Manager - Guia de Despliegue en Red Interna

## Resumen

Este documento describe como desplegar TechOps Asset Manager en la red interna de una empresa.
Hay **4 opciones** de despliegue, ordenadas de mas simple a mas flexible.

---

## Opcion 0: Instalador Windows .exe (Recomendada para empresas)

Un unico archivo `.exe` firmado que instala todo automaticamente: Node.js, PostgreSQL, la aplicacion, y un servicio de Windows que arranca solo.

### Requisitos del servidor destino
- Windows 10/11 o Windows Server 2016+
- 2 GB RAM disponible, 500 MB disco
- Privilegios de Administrador para instalar

### Generar el instalador (desde la PC de desarrollo)

```powershell
# 1. Ir a la carpeta del installer
cd installer

# 2. Ejecutar el script de build (descarga Node.js + PostgreSQL + compila la app)
.\build-installer.ps1

# 3. (Opcional) Reemplazar installer\icon\techops.ico con el logo de la empresa

# 4. Abrir techops-setup.iss con Inno Setup Compiler (https://jrsoftware.org/isinfo.php)
#    Build > Compile
#    El .exe queda en: installer\output\TechOps-Asset-Manager-Setup-v1.0.0.exe
```

### Firmar el instalador

```powershell
# Con certificado .pfx
signtool sign /f "MiCertificado.pfx" /p "password" /tr http://timestamp.digicert.com /td sha256 /fd sha256 "TechOps-Asset-Manager-Setup-v1.0.0.exe"

# O directamente en el build:
.\build-installer.ps1 -SignCert "MiCertificado.pfx" -SignPassword "password"
```

### Instalar en el servidor destino
1. Copiar el `.exe` al servidor (USB, OneDrive, Google Drive)
2. Ejecutar como **Administrador**
3. Siguiente > Siguiente > Instalar
4. El instalador automaticamente:
   - Instala Node.js, PostgreSQL y la app en `C:\TechOps`
   - Inicializa la base de datos y crea tablas
   - Registra PostgreSQL como servicio de Windows
   - Registra la app para auto-inicio con Windows
   - Abre el firewall en puerto 3000
   - Abre el navegador en `http://localhost:3000`
5. Acceder desde cualquier PC en la red: `http://<ip-del-servidor>:3000`

### Desinstalar
Panel de Control > Programas > TechOps Asset Manager > Desinstalar
(Para los servicios, la base de datos y las reglas de firewall automaticamente)

---

## Opcion 1: Docker Compose (Recomendada - Un solo comando)

### Requisitos
- Docker Desktop (Windows/Mac) o Docker Engine (Linux)
- 2 GB RAM disponible, 1 GB disco

### Pasos

```bash
# 1. Clonar/copiar el proyecto en el servidor destino
git clone <repo-url> techops-asset-manager
cd techops-asset-manager

# 2. Crear archivo de configuracion
cp .env.local.example .env.local
# Editar .env.local con los valores de produccion:
#   DB_PASSWORD=<password-seguro>
#   AUTH_SECRET=<string-aleatorio-64-chars>
#   AUTH_URL=http://<ip-del-servidor>:3000

# 3. Levantar todo (PostgreSQL + App)
docker-compose up -d

# 4. Inicializar la base de datos (solo la primera vez)
docker-compose exec app npx drizzle-kit push
docker-compose exec app npx tsx scripts/seed.ts

# 5. Acceder desde cualquier PC en la red
# http://<ip-del-servidor>:3000
```

### Actualizar version
```bash
docker-compose down
git pull  # o copiar archivos nuevos
docker-compose up -d --build
```

### Backup de base de datos
```bash
# Exportar
docker-compose exec db pg_dump -U techops techops_assets > backup_$(date +%Y%m%d).sql

# Restaurar
docker-compose exec -T db psql -U techops techops_assets < backup_20250306.sql
```

---

## Opcion 2: Paquete Standalone (Sin Docker - Windows/Linux)

### Requisitos
- Node.js 20 LTS instalado en el servidor
- PostgreSQL 15 instalado (local o remoto)
- 1 GB RAM, 500 MB disco

### Preparar el paquete (desde la PC de desarrollo)

```bash
# 1. Build del proyecto
npm run build

# 2. Crear carpeta de distribucion
mkdir -p dist/techops-asset-manager
cp -r .next/standalone/* dist/techops-asset-manager/
cp -r .next/static dist/techops-asset-manager/.next/static
cp -r public dist/techops-asset-manager/public
cp .env.local.example dist/techops-asset-manager/.env.local.example
cp drizzle.config.ts dist/techops-asset-manager/
cp -r drizzle dist/techops-asset-manager/
cp -r scripts dist/techops-asset-manager/
cp package.json dist/techops-asset-manager/

# 3. Comprimir para distribuir
# Windows: click derecho > Enviar a > Carpeta comprimida
# Linux: tar -czf techops-asset-manager.tar.gz -C dist techops-asset-manager
```

### Instalar en el servidor destino

```bash
# 1. Descomprimir en el servidor
# Copiar techops-asset-manager.tar.gz al servidor via OneDrive/Google Drive/USB
tar -xzf techops-asset-manager.tar.gz -C /opt/
cd /opt/techops-asset-manager

# 2. Configurar
cp .env.local.example .env.local
# Editar .env.local:
#   DATABASE_URL=postgresql://user:password@localhost:5432/techops_assets
#   AUTH_SECRET=<string-aleatorio>
#   AUTH_URL=http://<ip-servidor>:3000

# 3. Crear base de datos PostgreSQL
psql -U postgres -c "CREATE DATABASE techops_assets;"
psql -U postgres -c "CREATE USER techops WITH PASSWORD 'tu-password';"
psql -U postgres -c "GRANT ALL ON DATABASE techops_assets TO techops;"

# 4. Migrar esquema e insertar datos iniciales
npx drizzle-kit push
npx tsx scripts/seed.ts

# 5. Iniciar la aplicacion
# Windows:
set NODE_ENV=production
set PORT=3000
set HOSTNAME=0.0.0.0
node server.js

# Linux:
NODE_ENV=production PORT=3000 HOSTNAME=0.0.0.0 node server.js
```

### Mantener corriendo con PM2 (Linux)
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Para auto-iniciar con el SO
```

### Mantener corriendo como Servicio Windows
```powershell
# Instalar node-windows
npm install -g node-windows

# Crear servicio (ejecutar como Administrador)
# Crear archivo install-service.js:
# var Service = require('node-windows').Service;
# var svc = new Service({
#   name: 'TechOps Asset Manager',
#   description: 'Sistema de gestion de activos IT',
#   script: 'C:\\techops-asset-manager\\server.js',
#   env: [
#     { name: 'NODE_ENV', value: 'production' },
#     { name: 'PORT', value: '3000' },
#     { name: 'HOSTNAME', value: '0.0.0.0' }
#   ]
# });
# svc.install();

node install-service.js
```

---

## Opcion 3: Vercel (Cloud - Para demos/desarrollo)

```bash
# Requiere cuenta Vercel + PostgreSQL externo (Neon, Supabase, etc.)
npx vercel deploy --prod
# Configurar variables de entorno en el dashboard de Vercel
```

---

## Distribucion via OneDrive/Google Drive

Para compartir el paquete con otra empresa:

1. **Build** el proyecto: `npm run build`
2. **Ejecutar** el script de empaquetado:
   ```bash
   npm run package
   ```
   Esto crea `techops-asset-manager-vX.X.X.zip` en la raiz del proyecto.
3. **Subir** el .zip a OneDrive o Google Drive
4. **Compartir** el enlace con instrucciones de la Opcion 2

### Que incluye el paquete:
- Aplicacion compilada (standalone, ~50 MB)
- Scripts de migracion de BD
- Script de seed (datos iniciales)
- Archivo de configuracion de ejemplo
- Esta guia de despliegue

---

## Configuracion de Red

### Firewall
Abrir puerto **3000** (o el que se configure) para acceso desde la red interna:

```bash
# Linux (ufw)
sudo ufw allow 3000/tcp

# Windows (PowerShell como Admin)
New-NetFirewallRule -DisplayName "TechOps Asset Manager" -Direction Inbound -Port 3000 -Protocol TCP -Action Allow
```

### Proxy Reverso (Opcional - nginx)
Para acceder sin especificar puerto (http://techops.empresa.local):

```nginx
server {
    listen 80;
    server_name techops.empresa.local;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### DNS Interno (Opcional)
Agregar registro A en el DNS interno de la empresa:
```
techops.empresa.local  ->  192.168.x.x  (IP del servidor)
```

---

## Variables de Entorno

| Variable | Requerida | Descripcion |
|----------|-----------|-------------|
| `DATABASE_URL` | Si | URL de conexion a PostgreSQL |
| `AUTH_SECRET` | Si | Secreto para firmar JWT (min 32 chars) |
| `AUTH_URL` | Si | URL base de la app (ej: http://192.168.1.100:3000) |
| `DB_PASSWORD` | Docker | Password de PostgreSQL (solo docker-compose) |
| `SERVICENOW_INSTANCE_URL` | No | URL de ServiceNow |
| `SERVICENOW_USERNAME` | No | Usuario ServiceNow |
| `SERVICENOW_PASSWORD` | No | Password ServiceNow |
| `EXCEL_TEMPLATES_PATH` | No | Ruta a templates Excel (para export) |

---

## Generar AUTH_SECRET

```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
-join ((1..32) | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) })

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Troubleshooting

| Problema | Solucion |
|----------|----------|
| "ECONNREFUSED" al iniciar | PostgreSQL no esta corriendo. Verificar servicio. |
| "relation does not exist" | Ejecutar `npx drizzle-kit push` para crear tablas. |
| No se puede acceder desde otra PC | Verificar firewall y que HOSTNAME=0.0.0.0 |
| Error de autenticacion | Verificar AUTH_SECRET y AUTH_URL coincidan |
| Puerto 3000 en uso | Cambiar PORT en .env.local |
