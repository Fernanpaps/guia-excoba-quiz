// ============================================================
//  Tutorial: recorrido guiado por todas las zonas de la guía
//  - Sale solo la primera vez que alguien inicia sesión (app.js lo llama).
//  - Se puede repetir con el botón "❓ Cómo se usa".
//  Cada paso resalta una zona de la página y explica para qué sirve.
// ============================================================
window.Tutorial = (function () {
  "use strict";

  var App = null;       // funciones de app.js (demo, inicio…)
  var pasos = [], i = 0, capa, foco, burbuja, alTerminar = null, activo = false;

  function $(id) { return document.getElementById(id); }
  function el(tag, clase, texto) { var e = document.createElement(tag); if (clase) e.className = clase; if (texto !== undefined) e.textContent = texto; return e; }

  // ---------- Los pasos ----------
  // zona: selector de lo que se resalta (o null para un mensaje al centro)
  // pant: en qué pantalla va el paso ("inicio", "demo" = pregunta de ejemplo, "contestada" = ejemplo ya contestado).
  //       Si no se indica, usa la del paso anterior.
  function armarPasos() {
    return [
      { zona: null, titulo: "👋 ¡Bienvenido a tu Guía EXCOBA!",
        texto: "Te voy a enseñar en 2 minutos cómo usar cada parte de la página para que llegues a 70 en el examen. Puedes saltar el tutorial cuando quieras y repetirlo con el botón «❓ Cómo se usa».", pant: "inicio" },
      { zona: "#btn-cuenta", titulo: "👤 Tu cuenta",
        texto: "Aquí ves con qué cuenta entraste. Tócalo para cerrar sesión. Con tu cuenta, tu avance se guarda en la nube y lo ves en cualquier celular o compu." },
      { zona: "#caja-progreso", titulo: "💾 Tu avance guardado",
        texto: "Aquí aparecen tus últimas rondas y el botón para repasar las preguntas que fallaste. Cuando las contestas bien, se quitan de la lista." },
      { zona: ".config", titulo: "⚙️ Cómo quieres practicar",
        texto: "Elige cuántas preguntas quieres por ronda y el NIVEL: 🟢 básico, 🟡 nivel EXCOBA o 🔴 difícil. Tip: empieza en básico y sube a EXCOBA cuando saques más de 70." },
      { zona: ".plan-card", titulo: "📅 Tu plan de estudio",
        texto: "Pon la fecha de tu examen y cada día te dice qué temas estudiar, empezando por los que más fallas. «📈 Mi progreso por tema» te muestra qué ya dominas y qué te falta." },
      { zona: "#btn-repaso-int", titulo: "🧠 Repaso inteligente",
        texto: "Las preguntas que fallas regresan aquí: al día siguiente, a los 3 días… hasta que las aciertes 3 veces seguidas. Hazlo todos los días, son los puntos más fáciles de recuperar." },
      { zona: ".simulacro-card", titulo: "🎯 Simulacro EXCOBA",
        texto: "Es igual al examen real: 180 preguntas en 3 horas, por secciones (primaria, secundaria y tu especialidad). Elige tu carrera para que te toquen tus 3 materias. Al final ves tu calificación por sección." },
      { zona: ".atajos", titulo: "🧰 Atajos",
        texto: "🎲 Práctica infinita: ejercicios de Matemáticas, Física y Química con números nuevos cada vez. ✍️ Formato examen: solo preguntas para escribir, clasificar y ordenar. 📐 Formulario y 🧮 Calculadora: los mismos que te dan en el examen." },
      { zona: "#btn-mixto", titulo: "🎲 Examen mixto",
        texto: "Preguntas al azar de todas las materias. Sirve para calentar o repasar de todo un poco." },
      { zona: "#lista-materias", titulo: "📚 Materias",
        texto: "Toca una materia para practicarla completa o elegir un tema específico. Debajo de cada una ves cuántas preguntas hay y tu mejor calificación." },

      // ---- Pantalla de una pregunta (con una pregunta de ejemplo) ----
      { zona: ".etiquetas", titulo: "🏷️ Así se ve una pregunta",
        texto: "Arriba ves la materia y el tema, el TIPO de respuesta (escribir un número, clasificar, ordenar…) y el nivel. Esta es una pregunta de ejemplo.", pant: "demo" },
      { zona: "#btn-formulario", titulo: "📐 Formulario y 🧮 Calculadora",
        texto: "En cualquier pregunta puedes abrir el formulario con todas las fórmulas del examen y la calculadora (igual a la del EXCOBA: sen, cos, tan, xʸ, √, log)." },
      { zona: "#figura", titulo: "📊 Gráficas y figuras",
        texto: "Muchas preguntas traen una gráfica, un triángulo, un circuito o una tabla. Los datos que necesitas están en la figura." },
      { zona: "#zona-respuesta", titulo: "✍️ Dónde contestas",
        texto: "Lee la instrucción gris: te dice cómo contestar. En las de número escribes el resultado (acepta 3.5, 3,5 o 3/4). En las de clasificar tocas un elemento y luego su columna. Las de varias partes dan puntos parciales, como en el examen." },
      { zona: "#btn-comprobar", titulo: "✅ Comprobar",
        texto: "Cuando termines, toca «Comprobar» (o Enter). En las de opción múltiple basta con tocar la respuesta." },
      { zona: "#retro", titulo: "💡 Ver procedimiento",
        texto: "Después de contestar ves si acertaste y el procedimiento paso a paso: la fórmula, la sustitución, el resultado y el ⚠️ ERROR COMÚN para que no caigas en la trampa. Si fallas, se abre solo.", pant: "contestada" },
      { zona: null, titulo: "🏁 Al terminar una ronda",
        texto: "Verás tu calificación, tu desglose por materia y la lista de las que fallaste con su procedimiento. Con «Repasar las que fallé» las vuelves a intentar." },
      { zona: "#btn-ayuda", titulo: "¡Listo! 🎉",
        texto: "Ya sabes usar toda la guía. Si se te olvida algo, toca «❓ Cómo se usa» y repites este recorrido. ¡Mucho éxito, tú puedes sacar 70!", pant: "inicio" }
    ];
  }

  // ---------- Dibujo del resaltado y la burbuja ----------
  function crearCapa() {
    capa = el("div", "tuto-capa");
    foco = el("div", "tuto-foco");
    burbuja = el("div", "tuto-burbuja");
    burbuja.setAttribute("role", "dialog");
    burbuja.setAttribute("aria-modal", "true");
    burbuja.setAttribute("aria-labelledby", "tuto-titulo");
    capa.appendChild(foco);
    capa.appendChild(burbuja);
    document.body.appendChild(capa);
    capa.addEventListener("click", function (ev) { if (ev.target === capa) { /* clic fuera: no hace nada */ } });
    window.addEventListener("resize", acomodar);
    window.addEventListener("scroll", acomodar, { passive: true });
    document.addEventListener("keydown", teclas);
  }
  function teclas(ev) {
    if (!activo) return;
    if (ev.key === "Escape") { ev.preventDefault(); terminar(); }
    else if (ev.key === "ArrowRight" || ev.key === "Enter") { ev.preventDefault(); ir(i + 1); }
    else if (ev.key === "ArrowLeft") { ev.preventDefault(); ir(i - 1); }
  }
  function objetivo() {
    var p = pasos[i];
    if (!p.zona) return null;
    var e = document.querySelector(p.zona);
    if (!e || e.offsetParent === null || e.classList.contains("oculto")) return null;
    return e;
  }
  function acomodar() {
    if (!activo) return;
    var e = objetivo(), m = 8;
    var W = window.innerWidth, H = window.innerHeight;
    if (!e) {
      foco.style.cssText = "left:50%;top:50%;width:0;height:0";
      burbuja.classList.add("tuto-centro");
      burbuja.style.left = ""; burbuja.style.top = "";
      return;
    }
    burbuja.classList.remove("tuto-centro");
    var r = e.getBoundingClientRect();
    foco.style.cssText = "left:" + (r.left - m) + "px;top:" + (r.top - m) + "px;width:" + (r.width + 2 * m) + "px;height:" + (r.height + 2 * m) + "px";
    // La burbuja va abajo de la zona si cabe; si no, arriba; si no, en la parte baja de la pantalla
    var bw = Math.min(360, W - 24), bh = burbuja.offsetHeight || 180;
    var left = Math.max(12, Math.min(r.left + r.width / 2 - bw / 2, W - bw - 12));
    var top;
    if (r.bottom + m + 12 + bh < H) top = r.bottom + m + 12;
    else if (r.top - m - 12 - bh > 0) top = r.top - m - 12 - bh;
    else if (W - r.right - m >= 304) { bw = Math.min(360, W - r.right - m - 24); left = r.right + m + 12; top = Math.min(Math.max(12, r.top), H - bh - 12); }   // a un lado (pantallas anchas)
    else if (r.left - m >= 304) { bw = Math.min(360, r.left - m - 24); left = r.left - m - 12 - bw; top = Math.min(Math.max(12, r.top), H - bh - 12); }
    else top = H - bh - 12;   // la zona es muy grande: la burbuja va abajo encima de ella
    burbuja.style.width = bw + "px";
    burbuja.style.left = left + "px";
    burbuja.style.top = Math.max(12, top) + "px";
  }
  function pintar() {
    var p = pasos[i];
    burbuja.innerHTML = "";
    burbuja.appendChild(el("p", "tuto-num", "Paso " + (i + 1) + " de " + pasos.length));
    var h = el("h3", "tuto-titulo", p.titulo); h.id = "tuto-titulo";
    burbuja.appendChild(h);
    burbuja.appendChild(el("p", "tuto-texto", p.texto));
    var barra = el("div", "tuto-barra"), rell = el("span");
    rell.style.width = ((i + 1) / pasos.length * 100) + "%";
    barra.appendChild(rell);
    burbuja.appendChild(barra);
    var acc = el("div", "tuto-acciones");
    var saltar = el("button", "btn btn-fantasma tuto-saltar", i === pasos.length - 1 ? "Cerrar" : "Saltar tutorial");
    saltar.type = "button"; saltar.addEventListener("click", terminar);
    var ant = el("button", "btn btn-secundario", "← Atrás");
    ant.type = "button"; ant.disabled = i === 0; ant.addEventListener("click", function () { ir(i - 1); });
    var sig = el("button", "btn btn-primario", i === pasos.length - 1 ? "¡Empezar a estudiar!" : "Siguiente →");
    sig.type = "button"; sig.addEventListener("click", function () { ir(i + 1); });
    acc.appendChild(saltar); acc.appendChild(ant); acc.appendChild(sig);
    burbuja.appendChild(acc);
    sig.focus();
  }
  function ir(n) {
    if (n >= pasos.length) { terminar(); return; }
    if (n < 0) return;
    i = n;
    prepararPantalla(pantallaDe(i));
    var e = objetivo();
    if (e) e.scrollIntoView({ block: "center" });
    pintar();
    // Espera a que el navegador acomode la página antes de medir
    acomodar();
    setTimeout(acomodar, 60);
    setTimeout(acomodar, 300);
  }
  var pantallaActual = null;
  function pantallaDe(n) { for (var k = n; k >= 0; k--) if (pasos[k].pant) return pasos[k].pant; return "inicio"; }
  function prepararPantalla(quiere) {
    if (quiere === pantallaActual) return;
    if (quiere === "inicio") App.irInicio();
    else if (quiere === "demo") App.demoPregunta();
    else if (quiere === "contestada") { if (pantallaActual !== "demo") App.demoPregunta(); App.demoContestar(); }
    pantallaActual = quiere;
  }
  function terminar() {
    if (!activo) return;
    activo = false;
    capa.classList.add("oculto");
    document.body.classList.remove("tuto-activo");
    App.irInicio();
    window.scrollTo(0, 0);
    if (alTerminar) alTerminar();
  }

  return {
    conectar: function (app) { App = app; },
    iniciar: function (cb) {
      if (!App || activo) return;
      alTerminar = cb || null;
      if (!capa) crearCapa();
      pasos = armarPasos();
      activo = true;
      capa.classList.remove("oculto");
      document.body.classList.add("tuto-activo");
      i = -1;
      pantallaActual = null;
      ir(0);
    },
    activo: function () { return activo; }
  };
})();
