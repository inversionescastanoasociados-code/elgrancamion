# 🚚 Gran Rifa Camionera — Deploy en Netlify

## Pasos para desplegar

1. **Sube el proyecto a GitHub** (o conecta tu repo existente)
2. **Entra a [Netlify](https://app.netlify.com/)** y crea un nuevo sitio desde Git
3. Selecciona el repo y configura:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Node version:** `18` (usa `.nvmrc`)
   - **Environment variable:** `NEXT_PUBLIC_NETLIFY=true`
4. Netlify detecta el framework Next.js automáticamente
5. Si usas rutas API, Netlify las redirige con el block en `netlify.toml`
6. Si tienes imágenes en `/public/uploads/`, asegúrate que estén en el repo

## Notas
- El archivo `netlify.toml` ya está listo
- `.nvmrc` fuerza Node 18 (recomendado por Netlify)
- `.npmrc` con `legacy-peer-deps` para evitar errores de dependencias
- Si usas funciones serverless, ponlas en `/netlify/functions/`

¡Listo para desplegar! 🚀
