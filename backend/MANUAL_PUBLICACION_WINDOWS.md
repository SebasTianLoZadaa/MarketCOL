# Manual de publicación de MarketCOL en Windows Server 2022

Este manual explica cómo publicar MarketCOL para que usuarios externos puedan entrar usando:

```text
http://52.201.112.50/
```

El proyecto tiene:

- Frontend: React.
- Backend: Node.js y Express.
- Base de datos: MySQL.
- Backend interno: puerto `5000`.
- Acceso público: puerto `80`.

## 1. Cómo funciona la publicación

El usuario externo entra por el puerto `80`:

```text
Navegador -> http://52.201.112.50/ -> Gateway -> Frontend React
Navegador -> http://52.201.112.50/api -> Gateway -> Backend Node.js:5000
```

El puerto `5000` no se publica directamente. Solo se utiliza internamente en el servidor.

## 2. Requisitos

Antes de comenzar, el servidor debe tener:

1. Windows Server 2022.
2. Node.js instalado.
3. npm instalado.
4. MySQL funcionando.
5. El proyecto copiado en la carpeta del servidor.
6. La IP pública `52.201.112.50` asignada al servidor.
7. Permisos de administrador en PowerShell.

Para comprobar Node.js y npm, abrir PowerShell y ejecutar:

```powershell
node --version
npm --version
```

Si alguno de los comandos no funciona, instalar Node.js desde su instalador oficial antes de continuar.

## 3. Ubicación del proyecto

En esta instalación la carpeta principal es:

```text
C:\Users\Administrator\Downloads\MarketCOL-main\MarketCOL-main\MarketCOL
```

Dentro de ella existen las carpetas:

```text
backend
frontend
```

## 4. Instalar dependencias

Abrir PowerShell y entrar al backend:

```powershell
cd "C:\Users\Administrator\Downloads\MarketCOL-main\MarketCOL-main\MarketCOL\backend"
npm install
```

Después instalar las dependencias del frontend:

```powershell
cd "C:\Users\Administrator\Downloads\MarketCOL-main\MarketCOL-main\MarketCOL\frontend"
npm install
```

## 5. Configurar el backend

El archivo de configuración es:

[backend/.env](backend/.env)

Debe contener los datos correctos de MySQL. La configuración importante es similar a esta:

```env
port=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=3306
DB_NAME=marketcol_db
DB_USER=root
DB_PASSWORD=
JWT_SECRET=mi_clave_secreta_super_segura_2026
```

Cambiar `DB_PASSWORD` si el usuario de MySQL tiene contraseña.

El backend debe responder internamente en:

```text
http://127.0.0.1:5000/api/health
```

## 6. Archivos creados

### 6.1 Gateway público

Archivo creado:

[publish-server.js](publish-server.js)

Este archivo hace tres tareas:

1. Sirve el frontend compilado desde `frontend/build`.
2. Envía las rutas `/api` al backend en `127.0.0.1:5000`.
3. Envía `/uploads` e `/images` al backend para que funcionen las imágenes.

También permite que React Router funcione al devolver `index.html` cuando el usuario abre una ruta del frontend.

### 6.2 Script automático de publicación

Archivo creado:

[publish.ps1](publish.ps1)

Este script realiza automáticamente estas acciones:

1. Compila el frontend React.
2. Crea la carpeta `logs`.
3. Crea la regla de firewall para permitir TCP `80`.
4. Crea una regla para bloquear el acceso externo directo al puerto `5000`.
5. Comprueba si el backend ya está activo.
6. Inicia el backend si no está iniciado.
7. Inicia el gateway público en el puerto `80`.
8. Comprueba que el frontend responda.
9. Comprueba que `/api/health` responda.
10. Muestra la URL pública.

### 6.3 Configuración de React para producción

Archivo creado:

[frontend/.env.production](frontend/.env.production)

Contenido:

```env
REACT_APP_API_URL=/api
```

Esto hace que el navegador utilice la misma dirección pública para llamar al backend. Por ejemplo:

```text
http://52.201.112.50/api/auth/login
```

## 7. Archivos modificados

### 7.1 URLs de imágenes

Archivo modificado:

[frontend/src/utils/helpers.jsx](frontend/src/utils/helpers.jsx)

Se cambiaron las rutas de respaldo que apuntaban a `localhost:5000`. Ahora las imágenes utilizan el mismo origen desde el que se abrió la aplicación.

Antes, un usuario externo podía intentar cargar imágenes desde:

```text
http://localhost:5000/uploads/...
```

Para el usuario externo, `localhost` significa su propio computador, no el servidor. Por eso se corrigió para usar:

```text
http://52.201.112.50/uploads/...
```

### 7.2 Consulta de productos del dashboard

Archivo modificado:

[frontend/src/pages/AdminDashboardPage.jsx](frontend/src/pages/AdminDashboardPage.jsx)

El dashboard solicitaba:

```text
/admin/productos?limite=1000
```

El backend acepta como máximo `100` productos por consulta. Esa solicitud producía un error `400` y mostraba:

```text
No se pudieron cargar las estadísticas.
```

Se corrigió a:

```text
/admin/productos?limite=100
```

## 8. Ejecutar la publicación

Abrir PowerShell como administrador.

Para hacerlo:

1. Abrir el menú Inicio.
2. Buscar `PowerShell`.
3. Hacer clic derecho en PowerShell.
4. Elegir `Ejecutar como administrador`.

Después ejecutar:

```powershell
cd "C:\Users\Administrator\Downloads\MarketCOL-main\MarketCOL-main\MarketCOL"
Set-ExecutionPolicy -Scope Process Bypass -Force
.\publish.ps1
```

El comando `Set-ExecutionPolicy` permite ejecutar el script solamente durante esa sesión de PowerShell. No cambia permanentemente la política de seguridad del servidor.

Al terminar correctamente se debe mostrar algo parecido a:

```text
Publicacion lista: http://52.201.112.50/
Frontend: HTTP 200
API: HTTP 200
```

## 9. Probar desde el mismo servidor

En PowerShell ejecutar:

```powershell
Invoke-WebRequest "http://127.0.0.1/" -UseBasicParsing
```

Debe devolver `StatusCode 200`.

Probar el backend mediante el gateway:

```powershell
Invoke-WebRequest "http://127.0.0.1/api/health" -UseBasicParsing
```

Debe devolver una respuesta similar a:

```json
{
  "success": true,
  "status": "healthy",
  "database": "connected"
}
```

## 10. Configurar AWS

Si el servidor está en AWS, el firewall de Windows no es suficiente. También se debe abrir el puerto `80` en el Security Group de la instancia.

Crear una regla de entrada con estos valores:

```text
Tipo: HTTP
Protocolo: TCP
Puerto: 80
Origen: 0.0.0.0/0
```

No es necesario abrir el puerto `5000` para Internet.

Después de guardar la regla, probar desde otro computador o desde un teléfono usando datos móviles:

```text
http://52.201.112.50/
```

## 11. Inicio de sesión del administrador

El dashboard necesita un usuario autenticado con rol de administrador o auxiliar.

Datos creados por el seeder del proyecto:

```text
Administrador
Correo: admin@ecommerce.com
Contraseña: admin1234
```

También existe un usuario auxiliar:

```text
Auxiliar
Correo: auxiliar@ecommerce.com
Contraseña: aux123
```

Después de iniciar sesión, entrar al dashboard administrativo.

Por seguridad, cambiar estas contraseñas en un entorno real.

## 12. Qué significa cada código de error

### No abre la página

Posibles causas:

1. El gateway no está ejecutándose.
2. El puerto `80` está ocupado por IIS u otro programa.
3. El puerto `80` no está abierto en AWS.
4. El firewall de Windows está bloqueando la conexión.
5. La IP pública no apunta a ese servidor.

Comprobar el puerto `80`:

```powershell
Get-NetTCPConnection -LocalPort 80 -State Listen
```

Si no aparece ningún resultado, ejecutar nuevamente:

```powershell
.\publish.ps1
```

### Error `401`

Significa que no hay sesión o que el token expiró. Cerrar sesión, volver a iniciar sesión y probar otra vez.

### Error `403`

Significa que el usuario inició sesión, pero no tiene rol de administrador o auxiliar.

### Error `400` en productos

Comprobar que la consulta no utilice un límite superior a `100`:

```text
/admin/productos?limite=100
```

### Error `502 Backend no disponible`

El gateway está activo, pero el backend no responde en el puerto `5000`.

Comprobar:

```powershell
Get-NetTCPConnection -LocalPort 5000 -State Listen
```

También revisar los archivos:

```text
logs\backend.log
logs\backend-error.log
logs\gateway.log
logs\gateway-error.log
```

### Error `EADDRINUSE`

Significa que el puerto ya está ocupado. En esta implementación el script detecta si el backend ya está activo y lo reutiliza.

Para revisar qué proceso usa el puerto:

```powershell
Get-NetTCPConnection -LocalPort 5000 -State Listen | Select-Object OwningProcess
```

## 13. Reiniciar la publicación

Si se necesita detener los procesos Node:

```powershell
Get-Process node | Stop-Process -Force
```

Después iniciar nuevamente:

```powershell
cd "C:\Users\Administrator\Downloads\MarketCOL-main\MarketCOL-main\MarketCOL"
Set-ExecutionPolicy -Scope Process Bypass -Force
.\publish.ps1
```

No ejecutar este comando si existen otros proyectos Node importantes en el mismo servidor, porque detiene todos los procesos Node.

## 14. Resumen de comandos principales

Instalar dependencias:

```powershell
cd "C:\Users\Administrator\Downloads\MarketCOL-main\MarketCOL-main\MarketCOL\backend"
npm install
cd ..\frontend
npm install
```

Publicar:

```powershell
cd "C:\Users\Administrator\Downloads\MarketCOL-main\MarketCOL-main\MarketCOL"
Set-ExecutionPolicy -Scope Process Bypass -Force
.\publish.ps1
```

Probar frontend:

```powershell
Invoke-WebRequest "http://127.0.0.1/" -UseBasicParsing
```

Probar API:

```powershell
Invoke-WebRequest "http://127.0.0.1/api/health" -UseBasicParsing
```

URL para usuarios externos:

```text
http://52.201.112.50/
```

## 15. Resultado final

La publicación completa queda organizada así:

```text
Puerto 80 público
    |
    +-- Frontend React compilado
    |
    +-- /api       -> Backend Node.js en 127.0.0.1:5000
    +-- /uploads   -> Backend Node.js en 127.0.0.1:5000
    +-- /images    -> Backend Node.js en 127.0.0.1:5000

Puerto 5000
    |
    +-- Uso interno del servidor
```

La dirección pública final es:

```text
http://52.201.112.50/
```
