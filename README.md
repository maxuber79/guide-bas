# 🧠 Proyecto SAP Fiori – ZSLCM_PLANNING_DOC

Aplicación **Planificación de Asignaturas** (SAP UI5 / Fiori) migrada desde SAP Web IDE a **SAP Business Application Studio (BAS)**, con soporte para ejecución local, entorno QAS y despliegue productivo.

---

## 🚀 1. Clonar el repositorio desde Azure DevOps
### nota: Al clonar el repositorio , probablemente pedira credenicales del repositorio de Azure DevOps

```text
User: <tu-usuario-azure-devops>
Password: <tu-personal-access-token>
```

```bash
git clone [url azure] 
```



Ubircarce en la carpeta a nivel de comandos, terminal

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
|----------|--------------|
| `ui5.yaml` | Configura los middlewares y proxy hacia QAS/PRD. |
| `ui5-local.yaml` | Configuración local con `fiori-tools-proxy` apuntando al backend QA. |
| `package.json` | Scripts de ejecución y build. |
| `Component.js` | Inicialización global de modelos y rutas. |
| `Worklist.controller.js` | Controlador principal de la vista inicial. Incluye simulador de usuario local automático. |

---

## 🧑‍💻 4. Ejecutar la aplicación en BAS (modo local)

Para probar la app directamente (sin Fiori Launchpad), ejecuta:

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

La app se abrirá automáticamente en el navegador en la URL similar a:
```
https://port8080-workspaces-ws-<workspace>.applicationstudio.cloud.sap/index.html
```

### 💡 Notas
- Este modo **no requiere FLP Sandbox** ni autenticación Microsoft.
- Se usa el **simulador de usuario local** automáticamente.
- Ideal para pruebas rápidas y desarrollo dentro de BAS.

---

## 🧍‍♂️ 5. Simulador de usuario local (BAS / localhost)

### 🔹 Descripción
Cuando ejecutas la app **fuera del Launchpad productivo**, el sistema no tiene login Microsoft ni endpoint `/user-api/attributes`.  
Por eso, se activa automáticamente un **mock de usuario** definido en el `onInit()` del `Worklist.controller.js`.

### 🧩 Detección automática
El bloque evalúa el host del entorno:

```js
const sHost = window.location.host;
const bIsLocalBAS = sHost.includes("applicationstudio.cloud.sap") || sHost.includes("localhost");

if (bIsLocalBAS) {
  // Activa usuario simulado
} else {
  // Usa usuario real Microsoft en producción
}
```

### 🧪 Datos simulados
```js
{
  "login_name": "120003496",
  "displayName": "Usuario Desarrollo BAS",
  "email": "dev@umayor.cl"
}
```

➡️ No es necesario comentar nada antes del despliegue.  
El mock solo se ejecuta en BAS/local y se omite automáticamente en PRD.

---

## 🌍 6. Conexión a backend SAP QAS

En el archivo `ui5-local.yaml`:

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

Esto redirige todas las llamadas `/sap/opu/odata/...` hacia el sistema QA.

---

## 📦 7. Construir y desplegar a ABAP

```bash
npm run build:mta
```

Luego desplegar el MTA resultante a tu entorno (QAS o PRD) mediante:

```bash
fiori cfDeploy
```

---

## 🧰 8. Comandos útiles de Git

| Acción | Comando |
|--------|----------|
| Ver alias configurados | `git config --get-regexp alias` |
| Crear un nuevo alias | `git config --global alias.cm "commit -m"` |
| Borrar último commit | `git reset --soft HEAD~1` |
| Modificar último commit | `git commit --amend` |
| Ver historial de ramas | `git log --oneline --graph --all` |

---

## ✅ 9. Checklist rápido de ejecución

- [x] Repositorio clonado  
- [x] Dependencias instaladas  
- [x] Proxy QA configurado (`ui5-local.yaml`)  
- [x] `npm run start-noflp` ejecutado  
- [x] Usuario simulado activo (solo BAS)  
- [x] Datos cargados correctamente en vista principal  

---

**Desarrollado por:**  
Claudio Muñoz – Universidad Mayor 💙  
SAP Fiori UI5 | Azure DevOps | SAP BAS
