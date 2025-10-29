# 🧠 Proyecto SAP Fiori en SAP Business Application Studio

Aplicación **Planificación de Asignaturas** (SAP UI5 / Fiori) migrada desde SAP Web IDE a **SAP Business Application Studio (BAS)**, con soporte para ejecución local, entorno QAS y despliegue productivo.

---
## 🔖 Guía Rápida GIT 
Documentación base para configurar, iniciar y trabajar con repositorios GIT. Incluye comandos esenciales, tips útiles y algunos atajos pro pa’ devs con estilo. 😎

 
👉 [https://github.com/maxuber79/comand-git?tab=readme-ov-file#%EF%B8%8F-configuraci%C3%B3n-b%C3%A1sica](visitar repositorio)
 
---

## 🚀 1. Clonar el repositorio desde Azure DevOps
### Nota: Al clonar el repositorio, probablemente pedirá credenciales del repositorio de Azure DevOps.

```text
Username: xxxxx.xxxxx
Password: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

```bash
git clone [url azure]
```

Ubicarse en la carpeta a nivel de comandos, terminal:

```bash
cd [carpeta]
```

---

## ⚙️ 2. Instalar dependencias

```bash
npm install
```

Esto descarga las librerías de UI5 Tooling y Fiori Tools definidas en el `package.json`.

---

## 🧩 3. Archivos clave

| Archivo | Descripción |
|--------|-------------|
| `ui5.yaml` | Configura los middlewares y proxy hacia QAS/PRD. |
| `ui5-local.yaml` | Configuración local con `fiori-tools-proxy` apuntando al backend QA. |
| `package.json` | Scripts de ejecución y build. |
| `Component.js` | Inicialización global de modelos y rutas. |
| `Worklist.controller.js` | Controlador principal de la vista inicial. Incluye simulador de usuario local automático. |

---

## 🧑‍💻 4. Ejecutar la aplicación en BAS (modo local)

Para probar la app directamente (sin Fiori Launchpad), ejecutar:

```bash
npm run start-noflp
```

Levantar la app con Launchpad, ejecutar:

```bash
npm run start-mock
```

Esto corre:

```bash
fiori run --open "index.html?sap-client=300&sap-ui-xx-viewCache=false"
```

La app se abrirá automáticamente en una URL similar a:

```
https://port8080-workspaces-ws-<workspace>.applicationstudio.cloud.sap/index.html
```

### 💡 Notas
- Este modo **no requiere FLP Sandbox** ni autenticación Microsoft.
- Se usa el **simulador de usuario local** automáticamente.
- Ideal para pruebas rápidas y desarrollo dentro de BAS.

---

## 🧍‍♂️ 5. Simulador de usuario local (BAS / localhost)

Cuando ejecutas la app **fuera del Launchpad productivo**, el sistema no tiene login Microsoft ni endpoint `/user-api/attributes`.
Por eso, se activa automáticamente un **mock de usuario** definido en `onInit()`.

```js
const sHost = window.location.host;
const bIsLocalBAS = sHost.includes("applicationstudio.cloud.sap") || sHost.includes("localhost");

if (bIsLocalBAS) {
  // Activa usuario simulado
} else {
  // Usa usuario real Microsoft en producción
}
```

Datos simulados:

```js
{
  "login_name": "120003496",
  "displayName": "Usuario Desarrollo BAS",
  "email": "dev@umayor.cl"
}
```

---

## 🌍 6. Conexión a backend SAP QAS

```yaml
server:
  customMiddleware:
    - name: fiori-tools-proxy
      afterMiddleware: compression
      configuration:
        ignoreCertErrors: true
        backend:
          - path: /sap
            url: https://weberpqas.umayor.cl
            client: "300"
```

---

## 📦 7. Construir y desplegar a ABAP (modo clásico)

```bash
npm run build:mta
```

Luego:

```bash
fiori cfDeploy
```

---

## 🧰 8. Comandos útiles de Git

| Acción | Comando |
|--------|---------|
| Ver alias configurados | `git config --get-regexp alias` |
| Crear alias commit | `git config --global alias.cm "commit -m"` |
| Borrar último commit | `git reset --soft HEAD~1` |
| Modificar último commit | `git commit --amend` |
| Ver historial visual | `git log --oneline --graph --all` |

---

## ✅ 9. Checklist rápido

- [x] Repo clonado
- [x] Dependencias instaladas
- [x] Proxy QA configurado
- [x] App ejecutada localmente
- [x] Mock usuario operativo

---

## 🚀 10. Deploy a Cloud Foundry (BTP)

### 10.1 Compilar proyecto MTA

1. Ubicar `mta.yaml`
2. Clic derecho → **Build MTA Project**

Se generará:

```
mta_archives/com.umayor.sclm.zslcmplanningdoc_0.0.1.mtar
```

### 10.2 Desplegar

1. Abrir carpeta `mta_archives/`
2. Clic derecho → **Deploy MTA Archive**
3. Esperar finalización en terminal

### 10.3 Verificación

```bash
cf apps
cf html5-list
```

Aplicación visible en:

- BTP Cockpit → HTML5 Applications
- Launchpad, si configurado

### 10.4 Troubleshooting

| Error | Causa | Solución |
|------|-------|---------|
| `ERR_OSSL_EVP_UNSUPPORTED` | Node incompatible | Usar Node 18 |
| `No space left on device` | Dev Space lleno | Limpiar / ampliar dev space |
| No aparece en Launchpad | Falta content deploy | Revisar `xs-app.json` |

### 10.5 Automatizar

```bash
mbt build -s . && cf deploy mta_archives/*.mtar
```

---

**Desarrollado por:**  
Claudio Muñoz – Universidad Mayor 💙  
SAP Fiori UI5 | Azure DevOps | SAP BAS
