# 📦 Guía de Deploy - Aplicación SAP Fiori `ZSLCM_PLANNING_DOC`

Este documento describe el proceso estándar para compilar y desplegar la aplicación SAP Fiori en el entorno **SAP Cloud Foundry (BTP)**.

---

## 🧱 Prerrequisitos

- Dev Space activo en **SAP Business Application Studio (BAS)**.
- Acceso a **SAP BTP Subaccount** y permisos para despliegue.
- Dependencias instaladas (`npm install` si corresponde).
- Versión de Node.js recomendada: **Node 18**.

---

## 🚀 Proceso de Deploy

### **1) Compilar el proyecto MTA**

1. En BAS, abrir la raíz del proyecto.
2. Ubicar el archivo `mta.yaml`.
3. Hacer clic derecho sobre el archivo → seleccionar:
   **Build MTA Project**

Esto generará un archivo `.mtar` dentro de la carpeta:

```
mta_archives/
```

**Ejemplo de archivo generado:**

```
com.umayor.sclm.zslcmplanningdoc_0.0.1.mtar
```

---

### **2) Desplegar el artefacto en Cloud Foundry**

1. Abrir la carpeta `mta_archives/`.
2. Hacer clic derecho en el archivo `.mtar`.
3. Seleccionar:
   **Deploy MTA Archive**

La terminal iniciará el proceso.  
**No cerrar la terminal** hasta que aparezca el mensaje de éxito.

---

## ✅ Confirmación de Deploy

Una vez desplegado, la aplicación deberá quedar visible en:

- **BTP Cockpit → HTML5 Applications**
- **Launchpad / Portal** (si está configurado)

---

## 🔍 Verificación por Terminal (opcional)

```bash
cf apps
cf html5-list
```

---

## 🛠 Troubleshooting Rápido

| Mensaje / Error | Causa Probable | Solución |
|-----------------|----------------|----------|
| `ERR_OSSL_EVP_UNSUPPORTED` | Versión de Node incompatible | Usar Node 18 o exportar `NODE_OPTIONS=--openssl-legacy-provider` |
| `No space left on device` | Dev Space lleno | Eliminar proyectos no utilizados o aumentar espacio del Dev Space |
| Aplicación no aparece en Launchpad | Falta publication / content deploy | Revisar `xs-app.json` y destino configurado en BTP |

---

## 💡 Automatización (Opcional)

Se puede ejecutar build + deploy desde terminal:

```bash
mbt build -s . && cf deploy mta_archives/*.mtar
```

O agregarlo a `package.json`:

```json
"scripts": {
  "deploy": "mbt build -s . && cf deploy mta_archives/*.mtar"
}
```

Luego ejecutar:

```bash
npm run deploy
```

---

## 👤 Responsable / Referencias

| Rol | Nombre |
|----|--------|
| Mantención / Desarrollo | Claudio |
| Backend ABAP | (Asignar si aplica) |

---

**Fin del documento**
