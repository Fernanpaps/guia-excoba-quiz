# 📚 Guía EXCOBA — Cuestionario de estudio

Página web para estudiar el examen **EXCOBA** con preguntas de opción múltiple sobre **todos los temas de la guía**.
Contestas, ves al instante si acertaste y, si tienes duda, presionas **“💡 Ver procedimiento”** para ver cómo se resuelve paso a paso.

Cualquier persona con el enlace puede usarla sin cuenta. Si quiere, puede **crear una cuenta gratis** (correo y contraseña) para guardar su avance: mejores puntajes, historial de rondas y las preguntas que falló, para repasarlas después desde cualquier dispositivo.

## Materias incluidas (1,400+ preguntas y 80 generadores)

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

## Formato del examen real

El EXCOBA no es solo de opción múltiple. Según el instructivo y el demo oficial, se contesta de 4 formas, y la página las practica todas (carpeta `data/examen/`):

| En el examen | En la página | Tipo en los datos |
|---|---|---|
| Escritura numérica | Escribes el número (acepta 3.5, 3,5 o 3/4) | `num` |
| Escritura algebraica | Escribes la expresión (x^2, x^(-2), sqrt(x)); se califica aunque la escribas en otro orden | `alg` |
| Arrastre de elementos | Clasificar en columnas u ordenar tocando los elementos | `clasificar`, `ordenar` |
| Selección de elementos | Elegir palabras en un texto, varias opciones correctas o las 3 frases de un resumen | `huecos`, `varias`, `marcar` |
| Lectura | Leer una noticia o texto y llenar una tabla | `tabla` (cualquier pregunta puede traer `lectura`) |

Las preguntas con varias partes se califican parcial, igual que en el examen (si son 4 elementos, cada uno vale 0.25).

- **🎯 Simulacro EXCOBA**: igual que el examen real, 180 preguntas en 3 horas: 40 de primaria (20 Español, 20 Matemáticas), 80 de secundaria (20 de Español, Matemáticas, Ciencias naturales y Ciencias sociales) y 60 de especialidad (20 por materia, según la carrera; por defecto Ingeniería de Software: Matemáticas para cálculo, Física y Química). Tiene cuadrícula de preguntas, marcar para revisar, calculadora, formulario y calificación por sección. También hay versiones de 90 y 45 preguntas.
- **📐 Formulario** y **🧮 Calculadora**: como los del examen.
- **Niveles**: cada pregunta es 🟢 básica, 🟡 nivel EXCOBA o 🔴 difícil (campo `n: 1|2|3`), y se elige el nivel en el inicio.
- **🎲 Práctica infinita**: 80 generadores (`generadores*.js`) inventan ejercicios de Matemáticas, Física y Química con números nuevos cada vez, con gráficas, triángulos y circuitos dibujados en SVG (`figuras.js`).
- **💡 Procedimiento**: paso a paso con fórmula y sustitución, y un **⚠️ error común** (de la pregunta, campo `err`, o de su tema en `errores.js`).
- **🧠 Repaso inteligente**: las preguntas falladas vuelven a salir hasta acertarlas 3 veces seguidas (al día siguiente, a los 3 días…). **📈 Mi progreso por tema** muestra qué está dominado y qué falta, y **📅 Mi plan de estudio** arma las tareas de cada día según los fallos y los días que faltan para el examen (`progreso.js`).

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

Las preguntas con formato de examen agregan un campo `tipo`. Los ejemplos de cada tipo están al inicio de `tipos.js`. Por ejemplo:

```js
{ tipo: "num", t: "Porcentajes y regla de 3", q: "¿Cuánto es el 35% de 240?", r: 84, e: "..." },
{ tipo: "clasificar", t: "Nutrición", q: "Clasifica...", cats: ["Autótrofo", "Heterótrofo"],
  items: [["Pino", 0], ["León", 1]], e: "...", err: "error común", n: 2 },
{ tipo: "num", t: "Circuitos", q: "...", fig: { tipo: "circuito", modo: "serie", R: ["4 Ω", "6 Ω"], V: "20 V" }, r: 2, e: "..." },
```

Después de cambiar archivos `.js` o `.css`, sube el número `?v=` de las etiquetas en `index.html` para que los navegadores no usen la versión vieja.

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
