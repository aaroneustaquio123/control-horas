# 🕐 Control de Horas — Sistema de Personal

Sistema web en **Angular 19** con autenticación JWT para registrar y controlar las horas de entrada, salida y horas extras del personal.

---

## ✅ Características

- 🔐 Login con JWT (Supabase Auth) — rutas protegidas, nadie entra sin contraseña
- 👥 CRUD de empleados (crear, editar, activar/desactivar, eliminar)
- 🕐 Registro de horas entrada/salida con cálculo automático de horas extras
- 💰 Precio por hora normal y extra configurable
- 📊 Reportes por semana, mes o período personalizado
- 🗑️ Editar/borrar cualquier registro si hay un error
- 📱 100% responsive (móvil, tablet, escritorio)

---

## 🚀 Paso 1: Configurar Supabase (base de datos gratis)

### 1.1 Crear cuenta en Supabase
1. Ve a **[supabase.com](https://supabase.com)** → "Start your project"
2. Regístrate con GitHub o email
3. Crea un nuevo proyecto (nombre: `control-horas`)
4. Espera 1-2 minutos a que se inicialice

### 1.2 Crear las tablas
1. En el panel de Supabase → **SQL Editor** → "New Query"
2. Copia y pega todo el contenido del archivo `supabase-schema.sql`
3. Haz clic en **Run** ✅

### 1.3 Crear el usuario administrador
1. En Supabase → **Authentication** → **Users** → "Invite user"
2. Escribe el email de tu tía y una contraseña
3. ¡Ese será el único acceso al sistema!

### 1.4 Obtener las claves de API
1. En Supabase → **Settings** → **API**
2. Copia:
   - **Project URL** (ej: `https://xxxxx.supabase.co`)
   - **anon public key** (empieza con `eyJ...`)

### 1.5 Configurar el proyecto Angular
Abre el archivo `src/environments/environment.ts` y reemplaza:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'PEGA_TU_URL_AQUI',       // ← tu Project URL
  supabaseKey: 'PEGA_TU_ANON_KEY_AQUI'   // ← tu anon key
};
```

Haz lo mismo en `src/environments/environment.prod.ts`

---

## 💻 Paso 2: Ejecutar en tu computadora (desarrollo)

```bash
# Instalar dependencias (solo la primera vez)
npm install

# Iniciar el servidor de desarrollo
npm start
```

Abre el navegador en: **http://localhost:4200**

---

## 🌐 Paso 3: Publicar en Netlify (gratis, con link para tu tía)

### 3.1 Subir el código a GitHub
1. Ve a **[github.com](https://github.com)** → crea una cuenta si no tienes
2. Crea un repositorio nuevo (nombre: `control-horas`, privado recomendado)
3. En tu carpeta del proyecto ejecuta:

```bash
git remote add origin https://github.com/TU_USUARIO/control-horas.git
git push -u origin main
```

### 3.2 Conectar con Netlify
1. Ve a **[netlify.com](https://netlify.com)** → "Sign up" con GitHub
2. "Add new site" → "Import an existing project"
3. Selecciona GitHub → busca `control-horas`
4. Configuración de build (se llena automática desde `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist/control-horas/browser`
5. **¡Deploy site!** 🎉

### 3.3 ¡Listo! Tu sitio estará en:
```
https://tu-nombre.netlify.app
```

Cada vez que hagas `git push`, Netlify actualiza el sitio automáticamente.

---

## 🔄 Cómo actualizar el sitio

```bash
# Después de hacer cambios
git add .
git commit -m "Descripción del cambio"
git push
# Netlify lo actualiza automáticamente en ~1 minuto
```

---

## 📁 Estructura del proyecto

```
src/app/
├── core/
│   ├── guards/        auth.guard.ts        ← Protección JWT de rutas
│   ├── interceptors/  auth.interceptor.ts  ← Agrega token a requests
│   ├── models/        models.ts            ← Interfaces TypeScript
│   └── services/      *.service.ts         ← Lógica de negocio
└── features/
    ├── login/         ← Página de acceso
    ├── layout/        ← Sidebar + navbar
    ├── dashboard/     ← Resumen del día
    ├── empleados/     ← CRUD empleados
    ├── registros/     ← CRUD horas
    ├── configuracion/ ← Precios por hora
    └── reportes/      ← Totales por período
```

---

## ❓ Preguntas frecuentes

**¿Es gratis?**
Sí. Supabase gratis: hasta 500MB de datos. Netlify gratis: 100GB de tráfico/mes.

**¿Qué pasa si tu tía olvida la contraseña?**
En Supabase → Authentication → Users → puede enviarle un email de recuperación.

**¿Puede usarlo desde el teléfono?**
Sí, el diseño es 100% responsive y funciona en cualquier dispositivo.

**¿Cómo hacer una copia de seguridad?**
Supabase → Settings → Database → "Database Backups" (automático cada día en plan gratis).
