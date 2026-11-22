// ============================================================
//  Lógica del cuestionario
//  - Las preguntas viven en /data (una materia por archivo) y /data/examen
//    (preguntas con el formato del EXCOBA real: escribir, clasificar, etc.).
//  - Cómo se contesta y califica cada tipo de pregunta está en tipos.js.
//  - Modos: práctica (ves si acertaste al momento) y simulacro (con tiempo,
//    sin ver respuestas hasta el final, como el examen real).
// ============================================================
(function () {
  "use strict";

  var materias = window.MATERIAS || [];
  var Tipos = window.TiposPregunta;
  var META = 70; // calificación objetivo

  // Estado del cuestionario actual
  var estado = {
    modo: "practica",  // "practica" | "simulacro"
    titulo: "",
    preguntas: [],     // preguntas preparadas
    cola: [],          // orden en que se van mostrando (índices de preguntas)
    pos: 0,            // posición dentro de la cola
    puntos: 0,
    respuestas: [],    // respuesta de cada pregunta (índice = pregunta)
    notas: [],         // calificación 0..1 de cada pregunta
    respondida: false,
    origen: null,      // para "otra ronda"
    fin: 0,            // hora en que se acaba el tiempo (simulacro)
    reloj: null
  };

  // Avance guardado en la cuenta (Supabase), si hay sesión
  var nube = { activa: false, records: {}, falladas: [] };
  var Cuenta = window.Cuenta;
  var hayCuentas = !!(Cuenta && Cuenta.disponible());

  // ---------- Utilidades ----------
  function $(id) { return document.getElementById(id); }
  function el(tag, clase, texto) {
    var e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }
  function revolver(lista) {
    var c = lista.slice();
    for (var i = c.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = c[i]; c[i] = c[j]; c[j] = t;
    }
    return c;
  }
  function mostrar(idPantalla) {
    ["pantalla-inicio", "pantalla-login", "pantalla-materia", "pantalla-quiz", "pantalla-resultados", "pantalla-progreso"].forEach(function (id) {
      $(id).classList.toggle("oculto", id !== idPantalla);
    });
    window.scrollTo(0, 0);
  }
  function cantidadElegida() { return parseInt($("sel-cantidad").value, 10) || 0; }
  function revolverActivo() { return $("chk-revolver").checked; }
  function buscarMateria(id) {
    for (var i = 0; i < materias.length; i++) if (materias[i].id === id) return materias[i];
    return null;
  }
  function redondear(n) { return Math.round(n * 100) / 100; }
  function esFormatoExamen(p) { return !!p.tipo && p.tipo !== "opcion"; }

  // ---------- Niveles: 1 básico, 2 EXCOBA, 3 difícil ----------
  var NIVELES = { 1: "🟢 Básico", 2: "🟡 Nivel EXCOBA", 3: "🔴 Difícil" };
  function nivelDe(p) {
    if (p.n) return p.n;
    if (esFormatoExamen(p) || /Examen de (práctica|repaso)/.test(p.t)) return 2;
    return 1;
  }
  function nivelElegido() { return parseInt($("sel-nivel").value, 10) || 0; }
  function pasaNivel(p) {
    var n = nivelElegido(), np = nivelDe(p);
    if (!n) return true;
    if (n === 23) return np >= 2;
    return np === n;
  }
  function nombreNivelElegido() { return $("sel-nivel").options[$("sel-nivel").selectedIndex].text; }
  function avisoSinNivel() {
    alert("Todavía no hay preguntas de \"" + nombreNivelElegido() + "\" aquí. Elige otro nivel o \"Todos los niveles\".");
  }
  // Error común: el de la pregunta o, si no trae, el de su tema
  function errorComun(p) { return p.err || (window.ERRORES_COMUNES || {})[p.t] || ""; }

  // Clave fija de cada pregunta (para guardar cuáles falló cada usuario)
  function hashTexto(t) {
    var h = 5381;
    for (var i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  function claveDe(p, materiaId) {
    if (p.gen) return materiaId + ":gen:" + p.gen;
    if (!p.tipo || p.tipo === "opcion") return materiaId + ":" + hashTexto(p.q + "|" + p.o[p.a]);
    return materiaId + ":" + p.tipo + ":" + hashTexto(p.q + "|" + JSON.stringify(p.r || p.items || p.huecos || p.a || p.filas || p.texto || ""));
  }

  // Índice clave → pregunta, para armar el repaso de preguntas guardadas
  var indice = {};
  materias.forEach(function (m) {
    m.preguntas.forEach(function (p) { indice[claveDe(p, m.id)] = { p: p, m: m }; });
  });

  // Prepara una pregunta para mostrarla (revuelve opciones, etc.)
  function prepararPregunta(p, m) {
    // Ejercicio generado: se inventa uno nuevo con otros números cada vez
    if (p.gen && !p.q.indexOf("🎲") && window.GENERADORES && GENERADORES[p.gen]) {
      var real = GENERADORES[p.gen].f();
      real.t = p.t; real.n = p.n; real.tipo = p.tipo; real.gen = p.gen;
      // signo menos tipográfico en los textos (−6 en lugar de -6)
      ["q", "e", "err"].forEach(function (k) { if (real[k]) real[k] = real[k].replace(/(^|[\s(=\[,:])-(\d)/g, "$1−$2"); });
      p = real;
    }
    var tipo = Tipos.de(p);
    return {
      orig: p, m: m,
      tipo: p.tipo || "opcion",
      tema: p.t,
      nivel: nivelDe(p),
      materia: m.nombre,
      pregunta: p.q,
      explicacion: p.e,
      datos: tipo.preparar(p),
      clave: claveDe(p, m.id)
    };
  }
  function preparar(lista, m) { return lista.map(function (p) { return prepararPregunta(p, m); }); }
  function todasPreparadas(filtro) {
    var r = [];
    materias.forEach(function (m) {
      m.preguntas.forEach(function (p) { if (pasaNivel(p) && (!filtro || filtro(p))) r.push(prepararPregunta(p, m)); });
    });
    return r;
  }

  // ---------- Mejores puntajes (en este navegador y en la cuenta) ----------
  function leerRecordsLocales() {
    try { return JSON.parse(localStorage.getItem("excoba-records") || "{}"); } catch (e) { return {}; }
  }
  function leerRecords() {
    var r = leerRecordsLocales();
    if (nube.activa) r = combinarRecords(r, nube.records);
    return r;
  }
  function combinarRecords(a, b) {
    var r = {};
    [a || {}, b || {}].forEach(function (o) {
      Object.keys(o).forEach(function (k) { if (k.indexOf("__") === 0) return; if (r[k] === undefined || o[k] > r[k]) r[k] = o[k]; });
    });
    return r;
  }
  function guardarRecord(clave, porcentaje) {
    try {
      var r = leerRecords();
      if (!r[clave] || porcentaje > r[clave]) r[clave] = porcentaje;
      localStorage.setItem("excoba-records", JSON.stringify(r));
    } catch (e) { /* si el navegador no deja guardar, no pasa nada */ }
  }

  // ---------- Pantalla de inicio ----------
  function pintarInicio() {
    var cont = $("lista-materias");
    cont.innerHTML = "";
    var records = leerRecords();
    var total = 0, formato = 0;

    materias.forEach(function (m) {
      total += m.preguntas.length;
      var nf = m.preguntas.filter(esFormatoExamen).length;
      var nn = nivelElegido() ? m.preguntas.filter(pasaNivel).length : null;
      formato += nf;
      var btn = el("button", "materia-btn"); btn.type = "button";
      btn.appendChild(el("span", "materia-icono", m.icono));
      var textos = el("span");
      textos.appendChild(el("span", "materia-nombre", m.nombre));
      var rec = records[m.id];
      textos.appendChild(el("span", "materia-info",
        (nn !== null ? nn + " de este nivel" : m.preguntas.length + " preguntas") + (nf ? " · " + nf + " tipo examen" : "") + (rec !== undefined ? " · mejor: " + rec + "%" : "")));
      btn.appendChild(textos);
      btn.addEventListener("click", function () { abrirMateria(m); });
      cont.appendChild(btn);
    });

    $("total-preguntas").textContent = "Banco total: " + total + " preguntas de " + materias.length +
      " materias (" + formato + " con el formato del examen real).";
    var rs = records["simulacro"];
    $("simulacro-record").textContent = rs !== undefined ? "Tu mejor simulacro: " + rs + "%" + (rs >= META ? " ✅" : " (meta: " + META + "%)") : "";
  }

  // ---------- Pantalla de una materia (elegir tema) ----------
  function abrirMateria(m) {
    $("materia-titulo").textContent = m.icono + " " + m.nombre;
    var delNivel = m.preguntas.filter(pasaNivel);
    var nf = delNivel.filter(esFormatoExamen).length;
    $("materia-resumen").textContent = delNivel.length + " preguntas" + (nivelElegido() ? " de " + nombreNivelElegido() : " en total") +
      (nf ? " (" + nf + " con formato de examen)." : ".");

    var temas = [], conteo = {};
    delNivel.forEach(function (p) {
      if (!conteo[p.t]) { conteo[p.t] = 0; temas.push(p.t); }
      conteo[p.t]++;
    });

    var cont = $("lista-temas");
    cont.innerHTML = "";
    temas.forEach(function (t) {
      var btn = el("button", "tema-btn"); btn.type = "button";
      btn.appendChild(el("span", "", t));
      btn.appendChild(el("span", "tema-num", String(conteo[t])));
      btn.addEventListener("click", function () { iniciarMateria(m, t); });
      cont.appendChild(btn);
    });

    if (!temas.length) cont.appendChild(el("p", "muted", "Aún no hay preguntas de este nivel en esta materia. Cambia el nivel en la pantalla de inicio."));
    $("btn-empezar-materia").disabled = !temas.length;
    $("btn-empezar-materia").onclick = function () { iniciarMateria(m, null); };
    $("btn-formato-materia").classList.toggle("oculto", !nf);
    $("btn-formato-materia").onclick = function () { iniciarFormatoMateria(m); };
    mostrar("pantalla-materia");
  }

  // ---------- Iniciar rondas ----------
  function iniciarMateria(m, tema) {
    var lista = m.preguntas.filter(function (p) { return pasaNivel(p) && (!tema || p.t === tema); });
    var titulo = tema ? m.nombre + " · " + tema : m.nombre;
    empezar(titulo, preparar(lista, m), !tema, { tipo: "materia", materiaId: m.id, tema: tema });
  }
  function iniciarFormatoMateria(m) {
    empezar(m.nombre + " · formato examen", preparar(m.preguntas.filter(function (p) { return esFormatoExamen(p) && pasaNivel(p); }), m), true,
      { tipo: "formato", materiaId: m.id }, false);
  }
  function iniciarMixto() {
    empezar("Examen mixto", revolver(todasPreparadas()), true, { tipo: "mixto" }, true);
  }
  // Práctica infinita: solo ejercicios generados (Matemáticas, Física y Química)
  function iniciarInfinita() {
    var lugares = [];
    materias.forEach(function (m) { m.preguntas.forEach(function (p) { if (p.gen) lugares.push({ p: p, m: m }); }); });
    var delNivel = lugares.filter(function (x) { return pasaNivel(x.p); });
    if (delNivel.length) lugares = delNivel;
    var n = cantidadElegida() || 20, lista = [];
    for (var i = 0; i < n; i++) {
      var x = lugares[Math.floor(Math.random() * lugares.length)];
      lista.push(prepararPregunta(x.p, x.m));
    }
    arrancar("practica", "🎲 Práctica infinita", lista, { tipo: "infinita" });
  }
  function iniciarFormato() {
    empezar("Práctica formato examen", revolver(todasPreparadas(esFormatoExamen)), true, { tipo: "formato" }, true);
  }

  function empezar(titulo, preguntas, recortar, origen, yaRevuelto) {
    var lista = preguntas;
    if (!lista.length) { avisoSinNivel(); return; }
    if (revolverActivo() && !yaRevuelto) lista = revolver(lista);
    var n = cantidadElegida();
    if (recortar && n > 0) {
      // Repaso inteligente: hasta 40% de la ronda son preguntas que fallaste antes y ya toca repasar
      var pend = lista.filter(function (p) { return window.Progreso && Progreso.esPendiente(p.clave); });
      var cupo = Math.min(pend.length, Math.ceil(n * 0.4));
      var primero = pend.slice(0, cupo);
      lista = revolver(primero.concat(lista.filter(function (p) { return primero.indexOf(p) === -1; }).slice(0, n - cupo)));
    }
    arrancar("practica", titulo, lista, origen);
  }

  function arrancar(modo, titulo, lista, origen) {
    detenerReloj();
    estado.modo = modo;
    estado.titulo = titulo;
    estado.preguntas = lista;
    estado.cola = lista.map(function (_, i) { return i; });
    estado.pos = 0;
    estado.puntos = 0;
    estado.respuestas = lista.map(function () { return null; });
    estado.notas = lista.map(function () { return null; });
    estado.origen = origen;
    estado.cajas = [];
    estado.marcadas = {};
    $("zona-respuesta").innerHTML = "";
    $("pantalla-quiz").classList.toggle("modo-simulacro", modo === "simulacro");
    $("rejilla-caja").classList.toggle("oculto", modo !== "simulacro");
    if (modo === "simulacro") { pintarRejilla(); iniciarReloj(lista.length * 60); }
    else $("reloj").classList.add("oculto");
    mostrar("pantalla-quiz");
    pintarPregunta();
  }

  // ---------- Simulacro (misma estructura que el examen real) ----------
  // 180 preguntas: 40 de primaria, 80 de secundaria y 60 de especialidad (3 materias según la carrera).
  var T_MATE_PRIMARIA = ["Introducción a los números", "Fracciones", "Equivalencias", "Decimales y jerarquía de operaciones", "Porcentajes y regla de 3",
    "Escalas y conversión de unidades", "Geometría (áreas y volúmenes)", "Geometría", "Círculo y esfera", "Probabilidad", "Estadística"];
  var T_MATE_CALCULO = ["Cálculo y funciones", "Parábolas", "Función lineal", "Trigonometría (Pitágoras y funciones)", "Ecuación de segundo grado (fórmula general)",
    "Sistemas de ecuaciones lineales", "Productos notables", "Operaciones con polinomios", "Leyes de exponentes y signos", "Álgebra", "Círculo y esfera",
    "Geometría", "Ángulos", "Triángulos y semejanza", "Ecuaciones no lineales y con radicales", "Vectores"];
  var T_MATE_ESTADISTICA = ["Estadística", "Probabilidad", "Conteo (permutaciones y combinaciones)", "Matemáticas financieras", "Álgebra",
    "Ecuación de segundo grado (fórmula general)", "Productos notables", "Operaciones con polinomios", "Cálculo y funciones", "Ecuaciones lineales"];
  var T_ESP_PRIMARIA = ["Usos de las letras", "Acentuación", "Acentuación (diacrítico)", "Signos de puntuación", "Uso de la coma", "La oración y sus partes",
    "Sinónimos, homófonos y homónimos", "Cuento", "Textos instructivos", "Recuento histórico", "Comprensión lectora", "Resumen", "Tipos de textos"];
  var ESPECIALIDAD = {
    software: { nombre: "Ingeniería de Software", materias: [["Matemáticas para cálculo", "matematicas", T_MATE_CALCULO], ["Física", "fisica"], ["Química", "quimica"]] },
    ingenieria: { nombre: "Ingenierías y Arquitectura", materias: [["Matemáticas para cálculo", "matematicas", T_MATE_CALCULO], ["Física", "fisica"], ["Lenguaje", "espanol"]] },
    salud: { nombre: "Medicina, Optometría y afines", materias: [["Matemáticas para estadística", "matematicas", T_MATE_ESTADISTICA], ["Biología", "biologia"], ["Química", "quimica"]] },
    biologicas: { nombre: "Biología, Enfermería y afines", materias: [["Física", "fisica"], ["Biología", "biologia"], ["Química", "quimica"]] },
    sociales: { nombre: "Administración, Derecho y afines", materias: [["Matemáticas para estadística", "matematicas", T_MATE_ESTADISTICA], ["Lenguaje", "espanol"], ["Humanidades (aprox.: civismo y ciencias sociales)", "geografia"]] }
  };
  function seccionesDe(carrera) {
    var esp = ESPECIALIDAD[carrera] || ESPECIALIDAD.software;
    var s = [
      { nombre: "Primaria · Español", n: 20, fuentes: [["espanol", T_ESP_PRIMARIA]] },
      { nombre: "Primaria · Matemáticas", n: 20, fuentes: [["matematicas", T_MATE_PRIMARIA]] },
      { nombre: "Secundaria · Español", n: 20, fuentes: [["espanol"]] },
      { nombre: "Secundaria · Matemáticas", n: 20, fuentes: [["matematicas"]] },
      { nombre: "Secundaria · Ciencias naturales", n: 20, fuentes: [["biologia", null, 7], ["fisica", null, 7], ["quimica", null, 6]] },
      { nombre: "Secundaria · Ciencias sociales", n: 20, fuentes: [["historia_mexico", null, 6], ["historia_universal", null, 6], ["geografia", null, 8]] }
    ];
    esp.materias.forEach(function (m) { s.push({ nombre: "Especialidad · " + m[0], n: 20, fuentes: [[m[1], m[2] || null]] }); });
    return s;
  }
  function iniciarSimulacro() {
    var n = parseInt($("sel-simulacro").value, 10) || 30;
    var carrera = $("sel-carrera").value;
    var usadas = [], elegidas = [];
    var factor = n / 180;
    seccionesDe(carrera).forEach(function (sec) {
      var cuantasSec = Math.max(1, Math.round(sec.n * factor));
      sec.fuentes.forEach(function (f, fi) {
        var cuantas = f[2] ? Math.max(1, Math.round(f[2] * factor)) : cuantasSec;
        if (fi === sec.fuentes.length - 1 && f[2]) {
          var ya = elegidas.filter(function (x) { return x.seccion === sec.nombre; }).length;
          cuantas = Math.max(0, cuantasSec - ya);
        }
        var m = buscarMateria(f[0]);
        if (!m || !cuantas) return;
        var base = m.preguntas.filter(function (p) { return usadas.indexOf(p) === -1; });
        var conTema = f[1] ? base.filter(function (p) { return f[1].indexOf(p.t) !== -1; }) : base;
        if (conTema.length < cuantas) conTema = conTema.concat(revolver(base.filter(function (p) { return conTema.indexOf(p) === -1; })));
        // Primero las del nivel elegido, la mitad con formato de examen real
        var delNivel = revolver(conTema.filter(pasaNivel)), otras = revolver(conTema.filter(function (p) { return !pasaNivel(p); }));
        var orden = delNivel.concat(otras);
        var formato = orden.filter(esFormatoExamen), opcion = orden.filter(function (p) { return !esFormatoExamen(p); });
        var deFormato = Math.min(formato.length, Math.ceil(cuantas / 2));
        var tomadas = formato.slice(0, deFormato).concat(opcion.slice(0, cuantas - deFormato));
        if (tomadas.length < cuantas) tomadas = tomadas.concat(formato.slice(deFormato, deFormato + cuantas - tomadas.length));
        tomadas.forEach(function (p) {
          usadas.push(p);
          var prep = prepararPregunta(p, m);
          prep.seccion = sec.nombre;
          elegidas.push(prep);
        });
      });
    });
    // Como en el examen, van por secciones (primaria → secundaria → especialidad); dentro de cada sección se revuelven
    var porSeccion = {}, ordenSec = [];
    elegidas.forEach(function (p) { if (!porSeccion[p.seccion]) { porSeccion[p.seccion] = []; ordenSec.push(p.seccion); } porSeccion[p.seccion].push(p); });
    var final = [];
    ordenSec.forEach(function (s) { final = final.concat(revolver(porSeccion[s])); });
    arrancar("simulacro", "Simulacro EXCOBA (" + final.length + " preguntas · " + (ESPECIALIDAD[carrera] || ESPECIALIDAD.software).nombre + ")", final, { tipo: "simulacro" });
  }

  // ---------- Cuadrícula de preguntas del simulacro ----------
  function pintarRejilla() {
    var r = $("rejilla");
    r.innerHTML = "";
    estado.preguntas.forEach(function (p, i) {
      if (i === 0 || p.seccion !== estado.preguntas[i - 1].seccion) r.appendChild(el("span", "rejilla-seccion", p.seccion || ""));
      var b = el("button", "rejilla-btn", String(i + 1));
      b.type = "button";
      b.title = (p.seccion || p.materia) + " · pregunta " + (i + 1);
      b.addEventListener("click", function () { irA(i); });
      r.appendChild(b);
    });
  }
  function contestada(i) {
    var caja = estado.cajas[i], p = estado.preguntas[i];
    return !!caja && Tipos.de(p.orig).leer(p.datos, caja) !== null;
  }
  function actualizarRejilla() {
    if (estado.modo !== "simulacro") return;
    var btns = $("rejilla").querySelectorAll(".rejilla-btn"), hechas = 0;
    btns.forEach(function (b, i) {
      var c = contestada(i); if (c) hechas++;
      b.classList.toggle("hecha", c);
      b.classList.toggle("marcada", !!estado.marcadas[i]);
      b.classList.toggle("actual", i === estado.pos);
    });
    $("puntos").textContent = hechas + "/" + estado.preguntas.length + " contestadas";
    var marc = Object.keys(estado.marcadas).filter(function (k) { return estado.marcadas[k]; }).length;
    $("btn-marcar").textContent = estado.marcadas[estado.pos] ? "🚩 Quitar marca" : "🚩 Marcar para revisar";
    $("btn-marcar").classList.toggle("activa", !!estado.marcadas[estado.pos]);
    $("rejilla-resumen").textContent = marc ? marc + " marcada" + (marc > 1 ? "s" : "") + " para revisar" : "";
  }
  function irA(i) {
    if (i < 0 || i >= estado.preguntas.length) return;
    estado.pos = i;
    pintarPregunta();
    window.scrollTo(0, 0);
  }
  function terminarSimulacro(porTiempo) {
    var sin = estado.preguntas.filter(function (_, i) { return !contestada(i); }).length;
    if (!porTiempo && sin && !confirm("Te faltan " + sin + " preguntas por contestar. ¿Terminar de todos modos?")) return;
    estado.preguntas.forEach(function (p, i) {
      var caja = estado.cajas[i], tipo = Tipos.de(p.orig);
      var r = caja ? tipo.leer(p.datos, caja) : null;
      estado.respuestas[i] = r;
      estado.notas[i] = r === null ? 0 : tipo.calificar(p.datos, r);
    });
    pintarResultados();
  }
  function iniciarReloj(segundos) {
    estado.fin = Date.now() + segundos * 1000;
    $("reloj").classList.remove("oculto");
    tic();
    estado.reloj = setInterval(tic, 1000);
  }
  function detenerReloj() { if (estado.reloj) { clearInterval(estado.reloj); estado.reloj = null; } }
  function tic() {
    var resta = Math.max(0, Math.round((estado.fin - Date.now()) / 1000));
    var m = Math.floor(resta / 60), s = resta % 60;
    $("reloj").textContent = "⏱ " + m + ":" + (s < 10 ? "0" : "") + s;
    $("reloj").classList.toggle("poco-tiempo", resta <= 120);
    if (resta === 0) {
      detenerReloj();
      alert("⏰ Se acabó el tiempo. Las preguntas sin contestar valen 0, igual que en el examen.");
      terminarSimulacro(true);
    }
  }

  // ---------- Pintar una pregunta ----------
  function actual() { return estado.preguntas[estado.cola[estado.pos]]; }

  function pintarPregunta() {
    var p = actual();
    var tipo = Tipos.de(p.orig);
    var total = estado.preguntas.length;
    var simulacro = estado.modo === "simulacro";
    estado.respondida = false;

    $("contador").textContent = "Pregunta " + (estado.pos + 1) + " de " + total;
    $("puntos").textContent = simulacro ? "" : "✔ " + redondear(estado.puntos);
    $("barra").style.width = (estado.pos / total * 100) + "%";
    $("etiqueta-tema").textContent = p.seccion ? p.seccion : (estado.origen && estado.origen.tipo === "materia" ? "" : p.materia + " · ") + p.tema;
    $("etiqueta-tipo").textContent = Tipos.nombre(p.tipo) + (p.orig.gen ? " · 🎲 números nuevos" : "");
    $("etiqueta-tipo").classList.toggle("oculto", p.tipo === "opcion");
    $("etiqueta-nivel").textContent = NIVELES[p.nivel];
    $("etiqueta-nivel").className = "etiqueta etiqueta-nivel nivel-" + p.nivel;
    $("texto-pregunta").textContent = p.pregunta;
    $("lectura").textContent = p.orig.lectura || "";
    $("lectura").classList.toggle("oculto", !p.orig.lectura);
    $("figura").classList.toggle("oculto", !window.Figuras || !Figuras.dibujar(p.orig.fig, $("figura")));
    $("instruccion").textContent = p.tipo === "opcion" ? "" : tipo.instruccion;
    $("instruccion").classList.toggle("oculto", p.tipo === "opcion");

    var cont = $("zona-respuesta");
    // En práctica, las de opción múltiple se califican al tocarlas (como siempre)
    var instantanea = !simulacro && p.tipo === "opcion";
    if (simulacro) {
      // Cada pregunta del simulacro guarda su propia caja: al regresar, la respuesta sigue ahí
      var idx = estado.cola[estado.pos];
      if (!estado.cajas[idx]) {
        var caja = el("div", "zona-respuesta caja-pregunta tipo-" + p.tipo);
        tipo.pintar(p.datos, caja, null);
        caja.addEventListener("click", function () { setTimeout(actualizarRejilla, 0); });
        caja.addEventListener("change", actualizarRejilla);
        caja.addEventListener("input", actualizarRejilla);
        estado.cajas[idx] = caja;
        cont.appendChild(caja);
      }
      cont.className = "zona-sim";
      [].forEach.call(cont.children, function (c) { c.classList.toggle("oculto", c !== estado.cajas[idx]); });
    } else {
      cont.innerHTML = "";
      delete cont.dataset.elegida;
      delete cont.dataset.orden;
      cont.className = "zona-respuesta tipo-" + p.tipo;
      tipo.pintar(p.datos, cont, instantanea ? function () { comprobar(); } : null);
    }

    $("retro").classList.add("oculto");
    $("explicacion").classList.add("oculto");
    $("btn-explicacion").setAttribute("aria-expanded", "false");
    $("btn-explicacion").textContent = "💡 Ver procedimiento";

    var ultima = estado.pos === estado.cola.length - 1;
    $("btn-comprobar").classList.toggle("oculto", simulacro || instantanea);
    $("btn-comprobar").disabled = false;
    $("btn-anterior").classList.toggle("oculto", !simulacro);
    $("btn-anterior").disabled = estado.pos === 0;
    $("btn-marcar").classList.toggle("oculto", !simulacro);
    $("btn-terminar").classList.toggle("oculto", !simulacro);
    $("btn-siguiente").disabled = !simulacro;
    $("btn-siguiente").textContent = ultima ? (simulacro ? "Terminar examen" : "Ver resultados") : "Siguiente →";
    $("btn-siguiente").classList.toggle("oculto", !simulacro && !instantanea);
    actualizarRejilla();
  }

  // ---------- Comprobar (modo práctica) ----------
  function comprobar() {
    if (estado.respondida) return;
    var p = actual(), tipo = Tipos.de(p.orig), cont = $("zona-respuesta");
    var r = tipo.leer(p.datos, cont);
    if (r === null) { avisoVacio(); return; }
    var nota = tipo.calificar(p.datos, r);
    var i = estado.cola[estado.pos];
    estado.respuestas[i] = r;
    estado.notas[i] = nota;
    estado.puntos += nota;
    estado.respondida = true;
    tipo.corregir(p.datos, cont, r);

    var retro = $("retro-texto");
    if (nota === 1) { retro.textContent = "¡Correcto! 🎉"; retro.className = "retro-texto bien"; }
    else if (nota > 0) {
      retro.textContent = "Casi: " + Math.round(nota * 100) + "% bien (" + redondear(nota) + " de 1 punto). En verde lo correcto, en rojo lo que falló.";
      retro.className = "retro-texto parcial";
    } else {
      retro.textContent = p.tipo === "opcion" ? "Incorrecto. La respuesta correcta está en verde." : "Incorrecto. Respuesta correcta: " + tipo.textoCorrecta(p.datos);
      retro.className = "retro-texto mal";
    }
    pintarExplicacion(p);
    if (nota < 1) { $("explicacion").classList.remove("oculto"); marcarExplicacion(true); }

    $("retro").classList.remove("oculto");
    $("puntos").textContent = "✔ " + redondear(estado.puntos);
    $("btn-comprobar").classList.add("oculto");
    $("btn-siguiente").classList.remove("oculto");
    $("btn-siguiente").disabled = false;
    $("btn-siguiente").focus();
  }
  function avisoVacio() {
    var retro = $("retro-texto");
    retro.textContent = "Primero contesta la pregunta 🙂";
    retro.className = "retro-texto mal";
    $("retro").classList.remove("oculto");
    $("btn-explicacion").classList.add("oculto");
    setTimeout(function () { if (!estado.respondida) $("retro").classList.add("oculto"); $("btn-explicacion").classList.remove("oculto"); }, 1800);
  }
  function pintarExplicacion(p) {
    var exp = $("explicacion");
    exp.innerHTML = "";
    exp.appendChild(el("strong", "", "¿Cómo se resuelve?"));
    exp.appendChild(el("div", "", p.explicacion));
    var err = errorComun(p.orig);
    if (err) exp.appendChild(cajaError(err));
  }
  function cajaError(texto) {
    var caja = el("div", "error-comun");
    caja.appendChild(el("strong", "", "⚠️ Error común"));
    caja.appendChild(el("span", "", texto));
    return caja;
  }
  function marcarExplicacion(abierta) {
    $("btn-explicacion").setAttribute("aria-expanded", abierta ? "true" : "false");
    $("btn-explicacion").textContent = abierta ? "🙈 Ocultar procedimiento" : "💡 Ver procedimiento";
  }
  function alternarExplicacion() {
    var abierta = $("explicacion").classList.toggle("oculto") === false;
    marcarExplicacion(abierta);
  }

  // ---------- Avanzar ----------
  function siguiente() {
    if (estado.modo === "simulacro") {
      // En el simulacro no se califica al avanzar: la respuesta se queda guardada en su caja
      if (estado.pos < estado.preguntas.length - 1) irA(estado.pos + 1);
      else terminarSimulacro(false);
      return;
    }
    if (!estado.respondida) return;
    if (estado.pos < estado.cola.length - 1) {
      estado.pos++;
      pintarPregunta();
      window.scrollTo(0, 0);
    } else {
      pintarResultados();
    }
  }

  // ---------- Resultados ----------
  function pintarResultados() {
    detenerReloj();
    var total = estado.preguntas.length;
    var simulacro = estado.modo === "simulacro";
    if (simulacro) estado.puntos = estado.notas.reduce(function (s, n) { return s + (n || 0); }, 0);
    var puntos = redondear(estado.puntos);
    var pct = total ? Math.round(estado.puntos / total * 100) : 0;
    $("barra").style.width = "100%";

    var emoji, mensaje;
    if (pct >= 90) { emoji = "🏆"; mensaje = "¡Excelente! Dominas este tema."; }
    else if (pct >= META) { emoji = "😎"; mensaje = "¡Muy bien! Pasaste la meta de " + META + ". Repasa las que fallaste y quedas perfecto."; }
    else if (pct >= 50) { emoji = "💪"; mensaje = "Vas bien, te faltan " + (META - pct) + " puntos para la meta de " + META + ". Revisa los procedimientos de las que fallaste."; }
    else { emoji = "📖"; mensaje = "Toca repasar. Lee las explicaciones de abajo y vuelve a intentarlo."; }
    if (simulacro) {
      var sin = estado.notas.filter(function (n, i) { return estado.respuestas[i] === null; }).length;
      if (sin) mensaje += " Dejaste " + sin + " sin contestar: en el examen real mejor contesta todas, no se resta por equivocarte.";
    }

    $("resultado-emoji").textContent = emoji;
    $("resultado-titulo").textContent = estado.titulo;
    $("resultado-score").textContent = puntos + " / " + total + "  (" + pct + "%)";
    $("resultado-mensaje").textContent = mensaje;

    if (window.Progreso) {
      estado.preguntas.forEach(function (p, i) {
        if (estado.notas[i] === null || (simulacro && estado.respuestas[i] === null)) return;
        Progreso.registrar(p.clave, p.m.id, p.tema, estado.notas[i]);
      });
      Progreso.guardar();
    }
    var o = estado.origen || {};
    var claveRecord = (o.tipo === "materia" && !o.tema) ? o.materiaId : (simulacro ? "simulacro" : null);
    if (claveRecord) guardarRecord(claveRecord, pct);
    pintarDesglose();

    var errores = [];
    estado.preguntas.forEach(function (p, i) { if ((estado.notas[i] || 0) < 1) errores.push({ p: p, r: estado.respuestas[i], nota: estado.notas[i] || 0 }); });
    estado.errores = errores;
    guardarEnNube(claveRecord, pct, total);

    $("btn-repasar").classList.toggle("oculto", !errores.length);
    $("titulo-errores").classList.toggle("oculto", !errores.length);
    $("titulo-errores").textContent = simulacro ? "Revisión: preguntas que fallaste" : "Preguntas que fallaste";

    var cont = $("lista-errores");
    cont.innerHTML = "";
    errores.forEach(function (err) {
      var p = err.p, tipo = Tipos.de(p.orig);
      var card = el("div", "card error-item");
      card.appendChild(el("span", "etiqueta", p.materia + " · " + p.tema));
      if (p.tipo !== "opcion") card.appendChild(el("span", "etiqueta etiqueta-tipo", Tipos.nombre(p.tipo)));
      card.appendChild(el("p", "pregunta", p.pregunta));
      if (p.orig.lectura) card.appendChild(el("div", "lectura lectura-chica", p.orig.lectura));
      if (p.orig.fig && window.Figuras) { var fg = el("div", "figura figura-chica"); Figuras.dibujar(p.orig.fig, fg); card.appendChild(fg); }
      card.appendChild(el("p", "error-linea tu", (err.nota > 0 ? "◐ Parcial (" + redondear(err.nota) + " pts): " : "✗ Tu respuesta: ") + tipo.textoTuya(p.datos, err.r)));
      card.appendChild(el("p", "error-linea ok", "✔ Correcta: " + tipo.textoCorrecta(p.datos)));
      var det = el("details");
      det.appendChild(el("summary", "", "💡 Ver procedimiento"));
      var expl = el("div", "explicacion", p.explicacion);
      var errC = errorComun(p.orig);
      if (errC) expl.appendChild(cajaError(errC));
      det.appendChild(expl);
      card.appendChild(det);
      cont.appendChild(card);
    });

    mostrar("pantalla-resultados");
  }

  // Calificación por materia (para ver dónde estás flojo)
  function pintarDesglose() {
    var cont = $("desglose");
    cont.innerHTML = "";
    var por = {}, orden = [];
    estado.preguntas.forEach(function (p, i) {
      var g = p.seccion || p.materia;
      if (!por[g]) { por[g] = { pts: 0, n: 0 }; orden.push(g); }
      por[g].pts += estado.notas[i] || 0;
      por[g].n++;
    });
    if (orden.length < 2) { cont.classList.add("oculto"); return; }
    cont.classList.remove("oculto");
    cont.appendChild(el("strong", "", estado.preguntas[0].seccion ? "Tu calificación por sección y materia" : "Tu calificación por materia"));
    orden.sort(function (a, b) { return por[a].pts / por[a].n - por[b].pts / por[b].n; });
    orden.forEach(function (nombre) {
      var d = por[nombre], pct = Math.round(d.pts / d.n * 100);
      var fila = el("div", "desglose-fila");
      fila.appendChild(el("span", "desglose-nombre", nombre));
      var barra = el("span", "desglose-barra");
      var relleno = el("span", "desglose-relleno");
      relleno.style.width = pct + "%";
      relleno.classList.add(pct >= META ? "bien" : (pct >= 50 ? "medio" : "mal"));
      barra.appendChild(relleno);
      fila.appendChild(barra);
      fila.appendChild(el("span", "desglose-pct", redondear(d.pts) + "/" + d.n + " · " + pct + "%"));
      cont.appendChild(fila);
    });
    cont.appendChild(el("p", "muted desglose-nota", "Empieza a estudiar por las de arriba: son las que más puntos te pueden subir."));
  }

  function repasarErrores() {
    var lista = estado.errores.map(function (e) { return prepararPregunta(e.p.orig, e.p.m); });
    empezar("Repaso de errores", lista, false, { tipo: "repaso", lista: lista.map(function (x) { return { p: x.orig, m: x.m }; }) });
  }
  function otraRonda() {
    var o = estado.origen || {};
    if (o.tipo === "materia") { var m = buscarMateria(o.materiaId); if (m) { iniciarMateria(m, o.tema); return; } }
    if (o.tipo === "formato" && o.materiaId) { var mf = buscarMateria(o.materiaId); if (mf) { iniciarFormatoMateria(mf); return; } }
    if (o.tipo === "formato") { iniciarFormato(); return; }
    if (o.tipo === "simulacro") { iniciarSimulacro(); return; }
    if (o.tipo === "infinita") { iniciarInfinita(); return; }
    if (o.tipo === "repasoint") { iniciarRepasoInteligente(); return; }
    if (o.tipo === "repaso" && o.lista) {
      empezar("Repaso de errores", o.lista.map(function (x) { return prepararPregunta(x.p, x.m); }), false, o); return;
    }
    if (o.tipo === "guardadas") { repasarGuardadas(); return; }
    iniciarMixto();
  }

  // ---------- Cuenta: guardar y mostrar el avance ----------
  function guardarEnNube(materiaRecord, pct, total) {
    if (!nube.activa) return;
    if (materiaRecord && (nube.records[materiaRecord] === undefined || pct > nube.records[materiaRecord])) {
      nube.records[materiaRecord] = pct;
    }
    // Las que falló se agregan a "por repasar"; las que contestó bien se quitan
    var pendientes = {};
    nube.falladas.forEach(function (k) { pendientes[k] = true; });
    estado.preguntas.forEach(function (p, i) {
      if (estado.notas[i] === null) return;
      if (estado.notas[i] < 1) pendientes[p.clave] = true; else delete pendientes[p.clave];
    });
    nube.falladas = Object.keys(pendientes).filter(function (k) { return indice[k]; });

    var records = combinarRecords(leerRecordsLocales(), nube.records);
    if (window.Progreso) records.__stats = Progreso.exportar();
    Cuenta.guardarIntento(estado.titulo, Math.round(estado.puntos), total)
      .then(function () { return Cuenta.guardarProgreso(records, nube.falladas); })
      .catch(function (e) {
        console.warn("No se pudo guardar el avance:", e);
        $("resultado-mensaje").textContent += " (No se pudo guardar en tu cuenta; revisa tu conexión.)";
      });
  }

  function pintarProgreso() {
    if (!hayCuentas) return;
    $("caja-progreso").classList.remove("oculto");
    var u = Cuenta.usuario();
    $("progreso-invitado").classList.toggle("oculto", !!u);
    $("progreso-usuario").classList.toggle("oculto", !u);
    $("btn-cuenta").textContent = u ? "👤 " + u.email.split("@")[0] : "👤 Entrar";
    if (!u) return;

    $("progreso-saludo").textContent = "Hola, " + u.email.split("@")[0] + " 👋";
    var n = nube.falladas.length;
    $("progreso-estado").textContent = !nube.activa ? "Cargando tu avance…" :
      (n ? "Tienes " + n + " pregunta" + (n === 1 ? "" : "s") + " por repasar. Cuando las contestes bien, se quitan de la lista." :
           "No tienes preguntas pendientes. Tu avance se guarda solo cada vez que terminas una ronda.");
    var btn = $("btn-repasar-guardadas");
    btn.classList.toggle("oculto", !n);
    btn.textContent = "🔁 Repasar mis " + n + " preguntas falladas";

    var cont = $("historial");
    cont.innerHTML = "";
    if (!nube.activa) return;
    Cuenta.historial(5).then(function (filas) {
      cont.innerHTML = "";
      if (!filas.length) return;
      var t = el("strong", "", "Últimas rondas");
      t.style.fontSize = ".9rem";
      cont.appendChild(t);
      filas.forEach(function (f) {
        var fila = el("div", "historial-fila");
        var fecha = new Date(f.created_at);
        fila.appendChild(el("span", "", f.titulo + " · " + fecha.toLocaleDateString("es-MX", { day: "numeric", month: "short" })));
        var b = el("span", "historial-pct", f.aciertos + "/" + f.total + " (" + f.porcentaje + "%)");
        b.style.color = f.porcentaje >= META ? "var(--ok)" : (f.porcentaje >= 50 ? "var(--text)" : "var(--bad)");
        fila.appendChild(b);
        cont.appendChild(fila);
      });
    }).catch(function () {});
  }

  function enInicio() { return !$("pantalla-inicio").classList.contains("oculto"); }

  function alCambiarUsuario(u) {
    nube = { activa: false, records: {}, falladas: [] };
    pintarProgreso();
    if (!u) { if (enInicio()) pintarInicio(); return; }
    Cuenta.cargarProgreso().then(function (d) {
      nube.records = (d && d.records) || {};
      if (window.Progreso && nube.records.__stats && Progreso.importar(nube.records.__stats) && enInicio()) pintarPlan();
      nube.falladas = ((d && d.falladas) || []).filter(function (k) { return indice[k]; });
      nube.activa = true;
      var combinados = combinarRecords(leerRecordsLocales(), nube.records);
      if (!d || JSON.stringify(combinados) !== JSON.stringify(nube.records)) {
        nube.records = combinados;
        Cuenta.guardarProgreso(nube.records, nube.falladas).catch(function () {});
      }
      if (enInicio()) pintarInicio();
      pintarProgreso();
    }).catch(function (e) {
      console.warn("No se pudo cargar el avance:", e);
      $("progreso-estado").textContent = "No se pudo cargar tu avance. Revisa tu conexión y recarga la página.";
    });
  }

  function repasarGuardadas() {
    var lista = nube.falladas.map(function (k) { return indice[k]; }).filter(Boolean)
      .map(function (x) { return prepararPregunta(x.p, x.m); });
    if (!lista.length) { irInicio(); return; }
    arrancar("practica", "Mis preguntas falladas", revolver(lista), { tipo: "guardadas" });
  }

  // ---------- Pantalla de login ----------
  var modoRegistro = false;
  function abrirLogin() {
    if (Cuenta.usuario()) {
      if (confirm("¿Cerrar sesión de " + Cuenta.usuario().email + "?")) Cuenta.salir().then(irInicio);
      return;
    }
    cambiarModo(false);
    mostrar("pantalla-login");
    $("login-correo").focus();
  }
  function cambiarModo(registro) {
    modoRegistro = registro;
    $("tab-entrar").classList.toggle("activa", !registro);
    $("tab-registro").classList.toggle("activa", registro);
    $("tab-entrar").setAttribute("aria-selected", registro ? "false" : "true");
    $("tab-registro").setAttribute("aria-selected", registro ? "true" : "false");
    $("btn-login-enviar").textContent = registro ? "Crear cuenta" : "Entrar";
    $("login-clave").setAttribute("autocomplete", registro ? "new-password" : "current-password");
    mensajeLogin("", "");
  }
  function mensajeLogin(texto, tipo) {
    var e = $("login-msg");
    e.textContent = texto;
    e.className = "login-msg " + tipo;
    e.classList.toggle("oculto", !texto);
  }
  function enviarLogin(ev) {
    ev.preventDefault();
    var correo = $("login-correo").value.trim();
    var clave = $("login-clave").value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) { mensajeLogin("Escribe un correo válido.", "error"); return; }
    if (clave.length < 6) { mensajeLogin("La contraseña debe tener al menos 6 caracteres.", "error"); return; }
    var btn = $("btn-login-enviar");
    btn.disabled = true;
    btn.textContent = "Un momento…";
    var eraRegistro = modoRegistro;
    (eraRegistro ? Cuenta.registrar(correo, clave) : Cuenta.entrar(correo, clave)).then(function (r) {
      if (eraRegistro && r && r.necesitaConfirmar) {
        cambiarModo(false);
        mensajeLogin("¡Cuenta creada! Te mandamos un correo a " + correo + ". Abre el enlace para confirmarla y luego inicia sesión aquí.", "info");
        return;
      }
      $("login-clave").value = "";
      irInicio();
    }).catch(function (e) {
      mensajeLogin(e.message || String(e), "error");
    }).then(function () {
      btn.disabled = false;
      btn.textContent = modoRegistro ? "Crear cuenta" : "Entrar";
    });
  }

  function irInicio() {
    detenerReloj();
    pintarInicio();
    pintarPlan();
    pintarProgreso();
    mostrar("pantalla-inicio");
  }

  // ---------- Repaso inteligente, progreso por tema y plan de estudio ----------
  function iniciarRepasoInteligente() {
    var claves = Progreso.pendientes(), n = cantidadElegida() || 20;
    var lista = claves.map(function (k) { return indice[k]; }).filter(Boolean).slice(0, n)
      .map(function (x) { return prepararPregunta(x.p, x.m); });
    if (!lista.length) { alert("No tienes preguntas pendientes de repaso por ahora. ¡Bien! Sigue practicando temas nuevos."); return; }
    arrancar("practica", "🧠 Repaso inteligente", revolver(lista), { tipo: "repasoint" });
  }

  // Lista de todos los temas con su estado, ordenados por prioridad para estudiar
  function temasConEstado() {
    var esp = (ESPECIALIDAD[$("sel-carrera").value] || ESPECIALIDAD.software).materias.map(function (x) { return x[1]; });
    var r = [];
    materias.forEach(function (m) {
      var vistos = {};
      m.preguntas.forEach(function (p) {
        if (vistos[p.t]) { vistos[p.t].n++; return; }
        var st = Progreso.tema(m.id, p.t), es = Progreso.estadoTema(st);
        vistos[p.t] = { m: m, t: p.t, n: 1, st: st, est: es, esp: esp.indexOf(m.id) !== -1 };
        r.push(vistos[p.t]);
      });
    });
    var peso = { flojo: 0, nuevo: 1, proceso: 2, dominado: 3 };
    r.sort(function (a, b) {
      if (peso[a.est.clase] !== peso[b.est.clase]) return peso[a.est.clase] - peso[b.est.clase];
      if (a.esp !== b.esp) return a.esp ? -1 : 1;                 // primero las materias de tu especialidad
      if (a.est.pct !== null && b.est.pct !== null) return a.est.pct - b.est.pct;
      return b.n - a.n;                                           // temas con más preguntas primero
    });
    return r;
  }
  function diasParaExamen() {
    var f = Progreso.fechaExamen();
    if (!f) return null;
    var hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    var ex = new Date(f + "T00:00:00");
    return Math.round((ex - hoy) / 86400000);
  }
  function botonTema(x) {
    var b = el("button", "plan-tema estado-" + x.est.clase); b.type = "button";
    b.appendChild(el("span", "", x.m.icono + " " + x.t));
    b.appendChild(el("small", "", x.est.txt + (x.est.pct !== null ? " · " + x.est.pct + "%" : "")));
    b.addEventListener("click", function () { iniciarMateria(x.m, x.t); });
    return b;
  }
  function pintarPlan() {
    if (!window.Progreso) return;
    $("fecha-examen").value = Progreso.fechaExamen();
    var cont = $("plan-hoy");
    cont.innerHTML = "";
    var d = diasParaExamen(), lista = temasConEstado();
    var porEstudiar = lista.filter(function (x) { return x.est.clase !== "dominado"; });
    var dominados = lista.length - porEstudiar.length;
    var pend = Progreso.pendientes().filter(function (k) { return indice[k]; }).length;

    var cab = el("p", "plan-dias");
    if (d === null) cab.textContent = "Pon la fecha de tu examen y te armo un plan para cada día.";
    else if (d < 0) cab.textContent = "La fecha del examen ya pasó. Si cambió, actualízala.";
    else if (d === 0) cab.textContent = "¡Hoy es el examen! Repasa el formulario, descansa y confía en lo que estudiaste. 💪";
    else cab.textContent = "Faltan " + d + " día" + (d === 1 ? "" : "s") + " · " + dominados + " de " + lista.length + " temas dominados.";
    cont.appendChild(cab);
    if (d !== null && d <= 0) return;

    var dias = d === null ? 30 : d;
    var porDia = Math.max(2, Math.min(6, Math.ceil(porEstudiar.length / dias)));
    cont.appendChild(el("strong", "plan-titulo", "Hoy te toca:"));
    var hoy = el("div", "plan-lista");
    $("btn-repaso-int").textContent = "🧠 Repaso inteligente" + (pend ? " (" + pend + " pendientes)" : "");
    $("btn-repaso-int").disabled = !pend;
    if (pend) hoy.appendChild(el("p", "plan-paso", "1. Haz tu repaso inteligente: " + pend + " pregunta" + (pend === 1 ? "" : "s") + " que fallaste y ya toca repasar (botón de abajo)."));
    porEstudiar.slice(0, porDia).forEach(function (x) { hoy.appendChild(botonTema(x)); });
    cont.appendChild(hoy);
    if (d !== null && (d <= 7 || d % 7 === 0)) {
      cont.appendChild(el("p", "plan-paso plan-simulacro", d <= 7
        ? "🎯 Falta poco: haz hoy un simulacro (de 90 o de 180) para practicar el tiempo, y revisa tus errores."
        : "🎯 Hoy toca simulacro semanal: haz uno de 90 preguntas y mira tu calificación por sección."));
    }
    if (porEstudiar.length > porDia) {
      var prox = el("details", "plan-proximos");
      prox.appendChild(el("summary", "", "Próximos días"));
      for (var k = 1; k <= 3 && k * porDia < porEstudiar.length; k++) {
        var nombres = porEstudiar.slice(k * porDia, (k + 1) * porDia).map(function (x) { return x.t; }).join(", ");
        prox.appendChild(el("p", "plan-paso", (k === 1 ? "Mañana" : "En " + k + " días") + ": " + nombres));
      }
      cont.appendChild(prox);
    }
  }
  function pintarProgresoTemas() {
    var cont = $("lista-progreso");
    cont.innerHTML = "";
    var lista = temasConEstado(), cuenta = { dominado: 0, proceso: 0, flojo: 0, nuevo: 0 };
    lista.forEach(function (x) { cuenta[x.est.clase]++; });
    $("progreso-resumen").textContent = cuenta.dominado + " dominados · " + cuenta.proceso + " en proceso · " + cuenta.flojo + " flojos · " + cuenta.nuevo + " sin practicar";
    materias.forEach(function (m) {
      var deM = lista.filter(function (x) { return x.m === m; });
      var det = el("details", "card progreso-materia");
      var dom = deM.filter(function (x) { return x.est.clase === "dominado"; }).length;
      var sum = el("summary", "");
      sum.appendChild(el("span", "", m.icono + " " + m.nombre));
      sum.appendChild(el("small", "muted", dom + "/" + deM.length + " dominados"));
      det.appendChild(sum);
      deM.sort(function (a, b) { return a.t.localeCompare(b.t); }).forEach(function (x) {
        var fila = el("button", "progreso-fila"); fila.type = "button";
        fila.appendChild(el("span", "progreso-tema", x.t));
        var barra = el("span", "desglose-barra"), rell = el("span", "desglose-relleno");
        rell.style.width = (x.est.pct || 0) + "%";
        rell.classList.add(x.est.clase === "dominado" ? "bien" : x.est.clase === "flojo" ? "mal" : "medio");
        barra.appendChild(rell);
        fila.appendChild(barra);
        fila.appendChild(el("span", "progreso-estado estado-" + x.est.clase, x.est.txt + (x.est.pct !== null ? " " + x.est.pct + "% (" + x.st.v + ")" : "")));
        fila.title = "Practicar " + x.t;
        fila.addEventListener("click", function () { iniciarMateria(x.m, x.t); });
        det.appendChild(fila);
      });
      cont.appendChild(det);
    });
    mostrar("pantalla-progreso");
  }

  // ---------- Formulario (como el del examen) ----------
  function abrirFormulario() {
    var d = $("dlg-formulario");
    if (d.showModal) d.showModal(); else d.setAttribute("open", "");
  }
  function cerrarFormulario() {
    var d = $("dlg-formulario");
    if (d.close) d.close(); else d.removeAttribute("open");
  }

  // ---------- Eventos ----------
  $("btn-inicio").addEventListener("click", function () {
    if (!$("pantalla-quiz").classList.contains("oculto") && !confirm("¿Salir al inicio? Se perderá el avance de esta ronda.")) return;
    irInicio();
  });
  $("btn-mixto").addEventListener("click", iniciarMixto);
  $("btn-formato").addEventListener("click", iniciarFormato);
  $("btn-infinita").addEventListener("click", iniciarInfinita);
  $("btn-simulacro").addEventListener("click", iniciarSimulacro);
  $("btn-atras-materia").addEventListener("click", irInicio);
  $("btn-salir").addEventListener("click", function () {
    var algo = estado.notas.some(function (n) { return n !== null; }) || (estado.modo === "simulacro" && estado.cajas.some(Boolean));
    if (!algo) { irInicio(); return; }
    if (estado.modo === "simulacro") { terminarSimulacro(false); return; }
    if (confirm("¿Seguro que quieres salir? Se perderá el avance de esta ronda.")) irInicio();
  });
  $("btn-explicacion").addEventListener("click", alternarExplicacion);
  $("btn-comprobar").addEventListener("click", comprobar);
  $("btn-siguiente").addEventListener("click", siguiente);
  $("btn-anterior").addEventListener("click", function () { irA(estado.pos - 1); });
  $("btn-marcar").addEventListener("click", function () { estado.marcadas[estado.pos] = !estado.marcadas[estado.pos]; actualizarRejilla(); });
  $("btn-terminar").addEventListener("click", function () { terminarSimulacro(false); });
  // Calculadora (calculadora.js): disponible en práctica, simulacro e inicio
  Calculadora.armar();
  $("btn-calc").addEventListener("click", Calculadora.abrir);
  $("btn-calc-inicio").addEventListener("click", Calculadora.abrir);
  $("btn-repaso-int").addEventListener("click", iniciarRepasoInteligente);
  $("btn-progreso").addEventListener("click", pintarProgresoTemas);
  $("btn-atras-progreso").addEventListener("click", irInicio);
  $("fecha-examen").addEventListener("change", function () { Progreso.ponerFecha($("fecha-examen").value); pintarPlan(); });
  $("sel-carrera").addEventListener("change", pintarPlan);
  $("btn-cerrar-calc").addEventListener("click", Calculadora.cerrar);
  $("dlg-calc").addEventListener("click", function (ev) { if (ev.target === ev.currentTarget) Calculadora.cerrar(); });
  try { var carreraGuardada = localStorage.getItem("excoba-carrera"); if (carreraGuardada) $("sel-carrera").value = carreraGuardada; } catch (e) {}
  $("sel-carrera").addEventListener("change", function () { try { localStorage.setItem("excoba-carrera", $("sel-carrera").value); } catch (e) {} });
  $("btn-repasar").addEventListener("click", repasarErrores);
  $("btn-otra-vez").addEventListener("click", otraRonda);
  $("btn-volver-inicio").addEventListener("click", irInicio);
  $("btn-formulario").addEventListener("click", abrirFormulario);
  $("btn-formulario-inicio").addEventListener("click", abrirFormulario);
  $("btn-cerrar-formulario").addEventListener("click", cerrarFormulario);
  $("dlg-formulario").addEventListener("click", function (ev) { if (ev.target === ev.currentTarget) cerrarFormulario(); });

  if (hayCuentas) {
    $("btn-cuenta").classList.remove("oculto");
    $("btn-cuenta").addEventListener("click", abrirLogin);
    $("btn-ir-login").addEventListener("click", abrirLogin);
    $("btn-atras-login").addEventListener("click", irInicio);
    $("tab-entrar").addEventListener("click", function () { cambiarModo(false); });
    $("tab-registro").addEventListener("click", function () { cambiarModo(true); });
    $("form-login").addEventListener("submit", enviarLogin);
    $("btn-repasar-guardadas").addEventListener("click", repasarGuardadas);
    Cuenta.alCambiar(alCambiarUsuario);
  }

  // Atajos de teclado: 1-4 o A-D para opción múltiple, Enter para comprobar/seguir
  document.addEventListener("keydown", function (ev) {
    if ($("pantalla-quiz").classList.contains("oculto")) return;
    if ($("dlg-formulario").open || $("dlg-calc").open) return;
    var enCampo = ev.target && (ev.target.tagName === "SELECT" || ev.target.tagName === "INPUT");
    var p = actual();
    if (ev.key === "Enter" && enCampo && ev.target.tagName === "INPUT") {
      ev.preventDefault();
      if (estado.modo === "practica" && !estado.respondida) comprobar(); else siguiente();
      return;
    }
    if (enCampo) return;
    var k = ev.key.toUpperCase();
    var idx = "1234".indexOf(k);
    if (idx === -1) idx = "ABCD".indexOf(k);
    if (idx !== -1 && !estado.respondida && p.tipo === "opcion") {
      var zonaAct = estado.modo === "simulacro" ? estado.cajas[estado.cola[estado.pos]] : $("zona-respuesta");
      var b = zonaAct && zonaAct.querySelectorAll(".opcion")[idx];
      if (b) b.click();
    } else if (ev.key === "Enter" && document.activeElement === document.body) {
      if (estado.modo === "practica" && !estado.respondida && p.tipo !== "opcion") comprobar();
      else if (estado.respondida || estado.modo === "simulacro") siguiente();
    }
  });

  try { var nivelGuardado = localStorage.getItem("excoba-nivel"); if (nivelGuardado) $("sel-nivel").value = nivelGuardado; } catch (e) {}
  $("sel-nivel").addEventListener("change", function () {
    try { localStorage.setItem("excoba-nivel", $("sel-nivel").value); } catch (e) {}
    pintarInicio();
  });

  irInicio();
})();
