# 📚 Guía EXCOBA — Cuestionario de estudio

Página web para estudiar el examen **EXCOBA** con preguntas de opción múltiple sobre **todos los temas de la guía**.
Contestas, ves al instante si acertaste y, si tienes duda, presionas **“💡 Ver procedimiento”** para ver cómo se resuelve paso a paso.

Cualquier persona con el enlace puede usarla sin cuenta. Si quiere, puede **crear una cuenta gratis** (correo y contraseña) para guardar su avance: mejores puntajes, historial de rondas y las preguntas que falló, para repasarlas después desde cualquier dispositivo.

## Materias incluidas (1,100+ preguntas)

| Materia | Archivo |
|---|---|
| 📝 Español (gramática, ortografía, figuras retóricas, literatura) | `data/espanol.js` |
| ➗ Matemáticas (fracciones, álgebra, geometría, probabilidad, estadística…) | `data/matematicas.js` |
| 🌍 Historia Universal | `data/historia_universal.js` |
| 🗺️ Geografía y Civismo | `data/geografia_civismo.js` |
| 🇲🇽 Historia de México | `data/historia_mexico.js` |
| 🧬 Biología y Ciencias Naturales | `data/biologia.js` |
| ⚗️ Química | `data/quimica.js` |
| 🧲 Física | `data/fisica.js` |

También se incluyen las preguntas de los exámenes de repaso y de práctica que vienen en la guía.

## Cómo se usa

1. Elige cuántas preguntas quieres (10, 20, 40 o todas).
2. Toca una materia (y si quieres, un tema específico) o el **Examen mixto**.
3. Responde. Si fallas o tienes duda, abre **“Ver procedimiento”**.
4. Al final verás tu calificación y podrás **repasar solo las que fallaste**.

Atajos en computadora: teclas `1`–`4` (o `A`–`D`) para responder y `Enter` para pasar a la siguiente.

## Cómo agregar o corregir una pregunta

Cada materia es un archivo dentro de la carpeta `data/`. Cada pregunta se ve así:

```js
{ t: "Fracciones",                     // tema
  q: "Resuelve: 1/3 + 2/5",             // pregunta
  o: ["11/15", "3/8", "3/15", "2/15"],  // opciones
  a: 0,                                  // número de la opción correcta (la primera es 0)
  e: "1) Denominador común: 15 ..." },   // explicación / procedimiento
```

La página revuelve las opciones sola, así que la correcta no siempre sale en la misma letra.

## Verla en tu computadora

Es una página estática (solo HTML, CSS y JavaScript, sin instalar nada). Desde esta carpeta:

```bash
python -m http.server 8765
```

y abre <http://localhost:8765>.

## Cuentas y avance guardado (Supabase)

- `config.js` tiene la dirección del proyecto de Supabase y su **publishable key** (es pública, puede ir aquí). Nunca pongas aquí la *secret key*.
- `cuenta.js` maneja el inicio de sesión y guarda el avance.
- `supabase/schema.sql` crea las tablas `progreso` e `intentos` con reglas de seguridad (RLS): cada usuario solo ve y cambia lo suyo. Si algún día se crea otro proyecto, se pega en **SQL Editor → Run**.
- En Supabase está apagado **Authentication → Email → Confirm email**, para que la gente entre al instante (el correo gratis de Supabase manda muy pocos mensajes por hora).
- Los usuarios registrados se ven en **Authentication → Users**.

Si `config.js` se deja vacío, la página funciona igual pero sin cuentas.

## Publicación

El sitio está publicado en **Netlify**: <https://guia-excoba-quiz.netlify.app>

No hay paso de compilación: se sirve la carpeta tal cual (ver `netlify.toml`). Después de cambiar preguntas hay que volver a desplegar. Si quieres que se actualice solo con cada `git push`, en Netlify ve a **Project configuration → Build & deploy → Link repository** y elige este repo de GitHub.

---

made by us :v
