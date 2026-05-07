# 🏢 Intranet Corporativa — Portal de Reportes Power BI

Sistema de intranet local con autenticación, gestión de usuarios, administración de paneles Power BI y control de permisos por usuario.

---

## 🚀 Cómo ejecutar (local)

### Opción 1 — Python (recomendado)
```bash
cd intranet
python3 -m http.server 8080
# Luego abre: http://localhost:8080
```

### Opción 2 — Node.js (npx serve)
```bash
cd intranet
npx serve .
# Luego abre la URL que te indica el terminal
```

### Opción 3 — VS Code Live Server
Instala la extensión **Live Server** y abre `index.html` con clic derecho → "Open with Live Server".

---

## 👤 Credenciales por defecto

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `Admin2025!` | Administrador |
| `jlopez` | `Pass123!` | Usuario — Ventas |
| `mgarcia` | `Pass123!` | Usuario — Marketing |
| `crodriguez` | `Pass123!` | Usuario — Finanzas |

---

## 📋 Funcionalidades

### Administrador
- ✅ Ver dashboard con estadísticas globales
- ✅ Ver registro de actividad completo (logs)
- ✅ Crear, editar y eliminar usuarios
- ✅ Crear, editar y eliminar paneles Power BI
- ✅ Asignar permisos por panel a cada usuario (toggle switches)
- ✅ Acceso automático a todos los paneles

### Usuarios regulares
- ✅ Ver solo los paneles que el admin les ha asignado
- ✅ Abrir y visualizar paneles Power BI
- ✅ Ver su información de perfil

---

## 🔗 Integrar Power BI real

En la sección **Paneles Power BI**, al crear/editar un panel, pega la URL de incrustación de tu reporte:

```
https://app.powerbi.com/reportEmbed?reportId=TU_REPORT_ID&autoAuth=true&ctid=TU_TENANT_ID
```

Para obtener esta URL:
1. Abre tu reporte en Power BI
2. Archivo → Publicar en web → Crear código de inserción
3. O usa la opción de incrustación segura para organizaciones

---

## 🌐 Despliegue web

Para publicar en web, puedes usar:
- **Netlify** o **Vercel**: Solo sube la carpeta `intranet/` (drag & drop)
- **Apache/Nginx**: Copia la carpeta al directorio web (`/var/www/html/`)
- **GitHub Pages**: Sube el repositorio y activa Pages

> ⚠️ **Nota de seguridad**: Esta versión usa `localStorage` para persistencia, ideal para uso interno/intranet. Para producción con múltiples usuarios reales, se recomienda un backend (Node.js/PHP) con base de datos y autenticación JWT.

---

## 🎨 Paleta de colores (Colgate)

| Color | Hex | Uso |
|-------|-----|-----|
| Rojo corporativo | `#E3000F` | Header, badges admin, acciones |
| Azul principal | `#003DA5` | Sidebar, botones, links |
| Blanco | `#FFFFFF` | Fondos de cards |
| Blanco suave | `#F2F4F8` | Fondo general |

---

## 📁 Estructura de archivos

```
intranet/
├── index.html          ← Página de login
├── css/
│   └── shared.css      ← Estilos compartidos
├── js/
│   ├── data.js         ← Base de datos local (localStorage)
│   ├── auth.js         ← Autenticación y sesiones
│   └── ui.js           ← Sidebar, modales, toasts
└── pages/
    ├── dashboard.html  ← Dashboard principal
    ├── panels.html     ← Paneles Power BI
    ├── users.html      ← Gestión de usuarios (admin)
    ├── permissions.html ← Permisos por panel (admin)
    └── logs.html       ← Registro de actividad (admin)
```
