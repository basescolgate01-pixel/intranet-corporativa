# 📋 Sistema de Menús Dinámicos - Guía de Implementación

## ¿Qué se ha implementado?

Un sistema completo que permite al administrador:
- ✅ **Crear menús dinámicamente** en lugar de tenerlos codificados
- ✅ **Crear submenús** (menús con padre)
- ✅ **Asignar menús a usuarios específicos** - cada usuario ve solo lo que le asignaron
- ✅ **Editar y eliminar menús** en tiempo real
- ✅ **Ordenar menús** por prioridad

---

## 📁 Archivos Modificados

### Backend (`/src`)
1. **`db.js`** - Nuevas tablas:
   - `menu_items` - Almacena los ítems de menú (label, icon, path, parent_id, order_index, is_active)
   - `menu_user_access` - Relación usuario-menú (quién ve qué)

2. **`routes.js`** - 8 nuevos endpoints:
   - `GET /api/menu` - Obtener todos los menús (admin only)
   - `GET /api/menu/user/:userId` - Obtener menús accesibles para un usuario
   - `POST /api/menu` - Crear menú (admin only)
   - `PUT /api/menu/:id` - Actualizar menú (admin only)
   - `DELETE /api/menu/:id` - Eliminar menú (admin only)
   - `GET /api/menu-permissions/user/:userId` - Ver qué menús tiene asignados un usuario
   - `POST /api/menu-permissions/user/:userId` - Asignar menús a un usuario

### Frontend (`/public`)
1. **`js/data.js`** - Ya incluye las funciones:
   - `getMenuItems()` - Cargar todos los menús
   - `getMenuForUser(userId)` - Cargar menús del usuario
   - `createMenuItem(data)` - Crear
   - `updateMenuItem(id, data)` - Editar
   - `deleteMenuItem(id)` - Eliminar
   - `getMenuPermissionsForUser(userId)` - Ver asignaciones
   - `setMenuPermissionsForUser(userId, menuItemIds)` - Asignar
   - `buildMenuTree(flatItems)` - Convertir lista plana en árbol jerárquico

2. **`js/ui.js`** - Ya renderiza:
   - Menús dinámicos en el sidebar
   - Estructura de padre-hijo (submenús anidados)
   - Filtrado según rol (admin ve todo, users ven solo lo asignado)

3. **`pages/menu-manager.html`** - NUEVO - Interfaz admin:
   - Pestaña "Menús": Crear, editar, eliminar menús
   - Pestaña "Asignar a Usuarios": Seleccionar qué menús ve cada usuario
   - Modal para crear/editar con campos: Etiqueta, Ícono, Path, Padre, Orden, Activo

---

## 🚀 Cómo Funciona

### 1. **Estructura de Datos**

```javascript
// Cada menú tiene esta estructura:
{
  id: 1,
  label: "Reportes",           // Nombre que ve el usuario
  icon: "chart",               // Ícono (grid, chart, users, etc)
  path: "pages/reports.html",  // Ruta del menú
  parent_id: null,             // null = es raíz, número = es hijo de otro
  order_index: 1,              // Orden de aparición
  is_active: true              // Visible o no
}
```

### 2. **Cómo Crear un Menú con Submenús**

1. Ir a **"Gestor de Menús"** (en el sidebar admin)
2. Click **"+ Nuevo Menú"**
3. Llenar:
   - **Etiqueta**: "Reportes Ventas"
   - **Ícono**: "chart"
   - **Path**: "pages/reports.html"
   - **Menú Padre**: "— Sin padre —" (es raíz)
   - **Orden**: 1
   - **Activo**: ✓

4. Repetir para crear un **submenú**:
   - **Etiqueta**: "Reporte Mensual"
   - **Ícono**: "file-text"
   - **Path**: "pages/report-monthly.html"
   - **Menú Padre**: "Reportes Ventas" ← Aquí selecciona el padre
   - **Orden**: 1

Resultado en el sidebar:
```
📊 Reportes Ventas
  └─ 📄 Reporte Mensual
  └─ 📊 Reporte Anual
```

### 3. **Asignar Menús a Usuarios**

1. Click en pestaña **"Asignar a Usuarios"**
2. Para cada usuario, selecciona qué menús puede ver
3. Click **"Guardar"**

Ejemplo:
- **Juan López** (Ventas): Ve "Reportes Ventas" ✓ + "Dashboard" ✓
- **María García** (Marketing): Ve "Dashboard" ✓ + "Analytics" ✓
- El **Admin** siempre ve todo

---

## 🔧 Pasos para Activar Localmente

### 1. **Actualizar la base de datos**

Si ya tienes datos locales, las nuevas tablas se crearán automáticamente la próxima vez que inicies el servidor.

```bash
# Terminal en la carpeta del proyecto
npm start
```

El servidor detectará que faltan las tablas `menu_items` y `menu_user_access` y las creará.

### 2. **Acceder al Gestor de Menús**

1. Loguéate como **admin** (user: `admin` / pass: `Admin2025!`)
2. En el sidebar, ve a la sección "Admin" al final
3. Click en **"Gestor de Menús"**

### 3. **Crear menús de ejemplo**

Crea estos menús:
- 📊 Mis Paneles (path: `pages/panels.html`)
- 📈 Dashboard (path: `pages/dashboard.html`)
- 👥 Usuarios (path: `pages/users.html`) ← Solo para admin
- 🔒 Permisos (path: `pages/permissions.html`) ← Solo para admin
- 📝 Registro (path: `pages/logs.html`) ← Solo para admin

### 4. **Asignar a usuarios**

- Usuarios normales: Solo ven "Mis Paneles"
- Admin: Ve todo

---

## 📊 Estructura de Carpetas

```
intranet-corporativa/
├── src/
│   ├── db.js ← [ACTUALIZADO] Nuevas tablas
│   ├── routes.js ← [ACTUALIZADO] Nuevos endpoints
│   └── index.js
├── public/
│   ├── js/
│   │   ├── data.js ← [YA INCLUYE] Funciones de menú
│   │   ├── ui.js ← [YA RENDERIZA] Menús dinámicos
│   │   └── auth.js
│   └── pages/
│       ├── menu-manager.html ← [NUEVO] Interfaz admin
│       ├── panels.html
│       ├── dashboard.html
│       └── ...
└── MENU_DINAMICO_SETUP.md ← Este archivo
```

---

## 🧪 Testing

### ✅ Test 1: Crear menú
1. Admin → Gestor de Menús → "+ Nuevo Menú"
2. Crear "Test Menu"
3. Verificar que aparece en la lista

### ✅ Test 2: Editar menú
1. Click en ✏️ del menú
2. Cambiar etiqueta a "Test Menu Editado"
3. Guardar

### ✅ Test 3: Crear submenú
1. Crear otro menú
2. En "Menú Padre" seleccionar "Test Menu Editado"
3. Guardar
4. Verificar que aparece anidado en la lista

### ✅ Test 4: Asignar a usuario
1. Pestaña "Asignar a Usuarios"
2. Para "Juan López", seleccionar checkboxes
3. Click "Guardar"
4. Logout → Loguea como Juan López
5. Verificar que en el sidebar solo ve los menús asignados

### ✅ Test 5: Eliminar menú
1. Click en 🗑️ de un menú
2. Confirmar
3. Verificar que desaparece

---

## 💡 Notas Técnicas

### Orden de Items
- Menús se renderean ordenados por `order_index` ASC
- Si cambian `order_index`, actualiza manualmente o usa drag-drop (futura mejora)

### Ícones Disponibles
Los ícones se definen en `ui.js` (variable `ICONS`):
```javascript
grid, activity, users, lock, file-text, menu, settings, home, chart, folder, star, chevron, chevron_down
```

Puedes agregar más ícones en `ui.js` si necesitas.

### Seguridad
- Endpoints de creación/edición/eliminación requieren `adminOnly`
- Lectura de menús usa `authMiddleware` - valida que el usuario esté logueado
- Las tablas `menu_user_access` previenen que usuarios normales vean menús no asignados

### Estructura Jerárquica
- **parent_id NULL** = menú raíz (aparece en el sidebar principal)
- **parent_id = ID** = submenú (aparece como hijo en el árbol)
- Máximo nivel de anidamiento: Sin límite (puede ser muy profundo)
- El frontend renderiza automáticamente los niveles

---

## ⚡ Próximas Mejoras (Opcional)

1. **Drag & Drop** - Reordenar menús por arrastrar
2. **Categorías** - Agrupar menús por categoría
3. **Permisos Granulares** - Asignar por rol (no solo usuario)
4. **Historial** - Ver cambios en menús (ya se loguean en `logs`)
5. **Visibilidad Condicional** - Menús visibles si un panel está disponible

---

## ❓ Preguntas Frecuentes

**P: ¿Qué pasa si elimino un menú con submenús?**
R: Los submenús también se eliminan (CASCADE DELETE).

**P: ¿Puedo ocultar un menú sin eliminarlo?**
R: Sí, desactiva el checkbox "Activo" al editar. Seguirá en BD pero no aparecerá en el sidebar.

**P: ¿Los menús se sincronizan en tiempo real?**
R: No, los cambios se aplican en la próxima recarga del navegador o logout/login. Para agregar live updates, usa WebSockets.

**P: ¿Puedo asignar menús por rol (Ventas, Marketing, etc)?**
R: Actualmente es por usuario. Para roles, modifica `menu_user_access` a usar `role` en lugar de `user_id`.

---

## 📞 Soporte

Si hay errores:
1. Abre **DevTools** (F12) → **Console**
2. Verifica mensajes de error
3. Revisa los logs del servidor (`npm start` output)
4. Verifica que la BD se inicializó correctamente

---

**¡Listo para usar! 🎉**

Los menús dinámicos están 100% integrados. Ahora puedes crear, editar y asignar menús sin tocar código.
