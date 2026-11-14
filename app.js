// ============================================================
//  Lógica del cuestionario
//  - Las preguntas viven en /data (una materia por archivo).
//  - En cada pregunta la respuesta correcta es la opción con índice "a".
//    Aquí las opciones se revuelven para que no siempre quede en la misma letra.
// ============================================================
(function () {
  "use strict";

  var LETRAS = ["A", "B", "C", "D", "E", "F"];
  var materias = window.MATERIAS || [];

  // Estado del cuestionario actual
  var estado = {
    titulo: "",
    preguntas: [],   // preguntas de la ronda (ya con opciones revueltas)
    indice: 0,
    aciertos: 0,
    errores: [],     // { p, elegida }
    acertadas: [],   // claves de las preguntas contestadas bien en esta ronda
    respondida: false,
    origen: null     // para "otra ronda": { tipo, materiaId, tema }
  };

  // Avance guardado en la cuenta (Supabase), si hay sesión
  var nube = { activa: false, records: {}, falladas: [] };
  var Cuenta = window.Cuenta;
  var hayCuentas = !!(Cuenta && Cuenta.disponible());

  // ---------- Utilidades ----------
  function $(id) { return document.getElementById(id); }

  function revolver(lista) {
    var copia = lista.slice();
    for (var i = copia.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copia[i]; copia[i] = copia[j]; copia[j] = tmp;
    }
    return copia;
  }

  function mostrar(idPantalla) {
    ["pantalla-inicio", "pantalla-login", "pantalla-materia", "pantalla-quiz", "pantalla-resultados"].forEach(function (id) {
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

  // Clave fija de cada pregunta (para guardar cuáles falló cada usuario)
  function hashTexto(t) {
    var h = 5381;
    for (var i = 0; i < t.length; i++) h = ((h << 5) + h + t.charCodeAt(i)) | 0;
    return (h >>> 0).toString(36);
  }
  function claveDe(p, materiaId) { return materiaId + ":" + hashTexto(p.q + "|" + p.o[p.a]); }

  // Índice clave → pregunta, para poder armar el repaso de preguntas guardadas
  var indice = {};
  materias.forEach(function (m) {
    m.preguntas.forEach(function (p) { indice[claveDe(p, m.id)] = { p: p, m: m }; });
  });

  // Prepara una pregunta: revuelve sus opciones y recuerda cuál es la correcta
  function prepararPregunta(p, nombreMateria, materiaId) {
    var orden = p.o.map(function (texto, i) { return { texto: texto, correcta: i === p.a }; });
    orden = revolver(orden);
    return {
      tema: p.t,
      materia: nombreMateria,
      pregunta: p.q,
      opciones: orden.map(function (x) { return x.texto; }),
      correcta: orden.findIndex(function (x) { return x.correcta; }),
      explicacion: p.e,
      clave: claveDe(p, materiaId)
    };
  }

  // ---------- Guardar mejores puntajes (opcional, solo en este navegador) ----------
  function leerRecordsLocales() {
    try { return JSON.parse(localStorage.getItem("excoba-records") || "{}"); } catch (e) { return {}; }
  }
  // Si hay sesión, se combinan los de este navegador con los guardados en la cuenta
  function leerRecords() {
    var r = leerRecordsLocales();
    if (nube.activa) r = combinarRecords(r, nube.records);
    return r;
  }
  function combinarRecords(a, b) {
    var r = {};
    [a || {}, b || {}].forEach(function (o) {
      Object.keys(o).forEach(function (k) { if (r[k] === undefined || o[k] > r[k]) r[k] = o[k]; });
    });
    return r;
  }
  function guardarRecord(clave, porcentaje) {
    try {
      var r = leerRecords();
      if (!r[clave] || porcentaje > r[clave]) { r[clave] = porcentaje; }
      localStorage.setItem("excoba-records", JSON.stringify(r));
    } catch (e) { /* si el navegador no deja guardar, no pasa nada */ }
  }

  // ---------- Pantalla de inicio ----------
  function pintarInicio() {
    var cont = $("lista-materias");
    cont.innerHTML = "";
    var records = leerRecords();
    var total = 0;

    materias.forEach(function (m) {
      total += m.preguntas.length;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "materia-btn";

      var icono = document.createElement("span");
      icono.className = "materia-icono";
      icono.textContent = m.icono;

      var textos = document.createElement("span");
      var nombre = document.createElement("span");
      nombre.className = "materia-nombre";
      nombre.textContent = m.nombre;
      var info = document.createElement("span");
      info.className = "materia-info";
      var rec = records[m.id];
      info.textContent = m.preguntas.length + " preguntas" + (rec !== undefined ? " · mejor: " + rec + "%" : "");
      textos.appendChild(nombre);
      textos.appendChild(info);

      btn.appendChild(icono);
      btn.appendChild(textos);
      btn.addEventListener("click", function () { abrirMateria(m); });
      cont.appendChild(btn);
    });

    $("total-preguntas").textContent = "Banco total: " + total + " preguntas de " + materias.length + " materias.";
  }

  // ---------- Pantalla de una materia (elegir tema) ----------
  function abrirMateria(m) {
    $("materia-titulo").textContent = m.icono + " " + m.nombre;
    $("materia-resumen").textContent = m.preguntas.length + " preguntas en total.";

    // Agrupar por tema, respetando el orden en que aparecen
    var temas = [];
    var conteo = {};
    m.preguntas.forEach(function (p) {
      if (!conteo[p.t]) { conteo[p.t] = 0; temas.push(p.t); }
      conteo[p.t]++;
    });

    var cont = $("lista-temas");
    cont.innerHTML = "";
    temas.forEach(function (t) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tema-btn";
      var nombre = document.createElement("span");
      nombre.textContent = t;
      var num = document.createElement("span");
      num.className = "tema-num";
      num.textContent = conteo[t];
      btn.appendChild(nombre);
      btn.appendChild(num);
      btn.addEventListener("click", function () { iniciarMateria(m, t); });
      cont.appendChild(btn);
    });

    $("btn-empezar-materia").onclick = function () { iniciarMateria(m, null); };
    mostrar("pantalla-materia");
  }

  // ---------- Iniciar rondas ----------
  function iniciarMateria(m, tema) {
    var lista = m.preguntas.filter(function (p) { return !tema || p.t === tema; });
    var titulo = tema ? m.nombre + " · " + tema : m.nombre;
    var preparadas = lista.map(function (p) { return prepararPregunta(p, m.nombre, m.id); });
    // Si eligió un tema, se muestran todas las de ese tema
    empezar(titulo, preparadas, !tema, { tipo: "materia", materiaId: m.id, tema: tema });
  }

  function iniciarMixto() {
    var todas = [];
    materias.forEach(function (m) {
      m.preguntas.forEach(function (p) { todas.push(prepararPregunta(p, m.nombre, m.id)); });
    });
    // El examen mixto siempre se revuelve para que salgan materias variadas
    empezar("Examen mixto", revolver(todas), true, { tipo: "mixto" }, true);
  }

  function empezar(titulo, preguntas, recortar, origen, yaRevuelto) {
    var lista = preguntas;
    if (revolverActivo() && !yaRevuelto) lista = revolver(lista);
    var n = cantidadElegida();
    if (recortar && n > 0) lista = lista.slice(0, n);

    estado.titulo = titulo;
    estado.preguntas = lista;
    estado.indice = 0;
    estado.aciertos = 0;
    estado.errores = [];
    estado.acertadas = [];
    estado.origen = origen;

    mostrar("pantalla-quiz");
    pintarPregunta();
  }

  // ---------- Pintar una pregunta ----------
  function pintarPregunta() {
    var p = estado.preguntas[estado.indice];
    var total = estado.preguntas.length;
    estado.respondida = false;

    $("contador").textContent = "Pregunta " + (estado.indice + 1) + " de " + total;
    $("puntos").textContent = "✔ " + estado.aciertos;
    $("barra").style.width = (estado.indice / total * 100) + "%";
    $("etiqueta-tema").textContent = (estado.origen && estado.origen.tipo === "materia" ? "" : p.materia + " · ") + p.tema;
    $("texto-pregunta").textContent = p.pregunta;

    var cont = $("opciones");
    cont.innerHTML = "";
    p.opciones.forEach(function (texto, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "opcion";
      var letra = document.createElement("span");
      letra.className = "opcion-letra";
      letra.textContent = LETRAS[i];
      var span = document.createElement("span");
      span.textContent = texto;
      btn.appendChild(letra);
      btn.appendChild(span);
      btn.addEventListener("click", function () { responder(i); });
      cont.appendChild(btn);
    });

    $("retro").classList.add("oculto");
    $("explicacion").classList.add("oculto");
    $("btn-explicacion").setAttribute("aria-expanded", "false");
    $("btn-explicacion").textContent = "💡 Ver procedimiento";
    $("btn-siguiente").disabled = true;
    $("btn-siguiente").textContent = estado.indice === total - 1 ? "Ver resultados" : "Siguiente →";
  }

  // ---------- Responder ----------
  function responder(elegida) {
    if (estado.respondida) return;
    estado.respondida = true;
    var p = estado.preguntas[estado.indice];
    var botones = $("opciones").querySelectorAll(".opcion");

    botones.forEach(function (b, i) {
      b.disabled = true;
      if (i === p.correcta) b.classList.add("correcta");
      if (i === elegida && i !== p.correcta) b.classList.add("incorrecta");
    });

    var retro = $("retro-texto");
    if (elegida === p.correcta) {
      estado.aciertos++;
      estado.acertadas.push(p.clave);
      retro.textContent = "¡Correcto! 🎉";
      retro.className = "retro-texto bien";
    } else {
      estado.errores.push({ p: p, elegida: elegida });
      retro.textContent = "Incorrecto. La respuesta correcta es la " + LETRAS[p.correcta] + ".";
      retro.className = "retro-texto mal";
    }

    // Texto de la explicación
    var exp = $("explicacion");
    exp.innerHTML = "";
    var titulo = document.createElement("strong");
    titulo.textContent = "¿Cómo se resuelve?";
    var cuerpo = document.createElement("div");
    cuerpo.textContent = p.explicacion;
    exp.appendChild(titulo);
    exp.appendChild(cuerpo);

    $("retro").classList.remove("oculto");
    $("puntos").textContent = "✔ " + estado.aciertos;
    $("btn-siguiente").disabled = false;
    $("btn-siguiente").focus();
  }

  function alternarExplicacion() {
    var exp = $("explicacion");
    var abierta = exp.classList.toggle("oculto") === false;
    $("btn-explicacion").setAttribute("aria-expanded", abierta ? "true" : "false");
    $("btn-explicacion").textContent = abierta ? "🙈 Ocultar procedimiento" : "💡 Ver procedimiento";
  }

  function siguiente() {
    if (!estado.respondida) return;
    if (estado.indice < estado.preguntas.length - 1) {
      estado.indice++;
      pintarPregunta();
      window.scrollTo(0, 0);
    } else {
      pintarResultados();
    }
  }

  // ---------- Resultados ----------
  function pintarResultados() {
    var total = estado.preguntas.length;
    var pct = total ? Math.round(estado.aciertos / total * 100) : 0;
    $("barra").style.width = "100%";

    var emoji, mensaje;
    if (pct >= 90) { emoji = "🏆"; mensaje = "¡Excelente! Dominas este tema."; }
    else if (pct >= 70) { emoji = "😎"; mensaje = "¡Muy bien! Repasa las que fallaste y quedas perfecto."; }
    else if (pct >= 50) { emoji = "💪"; mensaje = "Vas bien. Revisa los procedimientos de las que fallaste."; }
    else { emoji = "📖"; mensaje = "Toca repasar este tema. Lee las explicaciones y vuelve a intentarlo."; }

    $("resultado-emoji").textContent = emoji;
    $("resultado-titulo").textContent = estado.titulo;
    $("resultado-score").textContent = estado.aciertos + " / " + total + "  (" + pct + "%)";
    $("resultado-mensaje").textContent = mensaje;

    var esRecord = estado.origen && estado.origen.tipo === "materia" && !estado.origen.tema;
    if (esRecord) guardarRecord(estado.origen.materiaId, pct);
    guardarEnNube(esRecord ? estado.origen.materiaId : null, pct, total);

    var hayErrores = estado.errores.length > 0;
    $("btn-repasar").classList.toggle("oculto", !hayErrores);
    $("titulo-errores").classList.toggle("oculto", !hayErrores);

    var cont = $("lista-errores");
    cont.innerHTML = "";
    estado.errores.forEach(function (err) {
      var p = err.p;
      var card = document.createElement("div");
      card.className = "card error-item";

      var tag = document.createElement("span");
      tag.className = "etiqueta";
      tag.textContent = p.materia + " · " + p.tema;

      var q = document.createElement("p");
      q.className = "pregunta";
      q.textContent = p.pregunta;

      var tu = document.createElement("p");
      tu.className = "error-linea tu";
      tu.textContent = "✗ Tu respuesta: " + p.opciones[err.elegida];

      var ok = document.createElement("p");
      ok.className = "error-linea ok";
      ok.textContent = "✔ Correcta: " + p.opciones[p.correcta];

      var det = document.createElement("details");
      var sum = document.createElement("summary");
      sum.textContent = "💡 Ver procedimiento";
      var exp = document.createElement("div");
      exp.className = "explicacion";
      exp.textContent = p.explicacion;
      det.appendChild(sum);
      det.appendChild(exp);

      card.appendChild(tag);
      card.appendChild(q);
      card.appendChild(tu);
      card.appendChild(ok);
      card.appendChild(det);
      cont.appendChild(card);
    });

    mostrar("pantalla-resultados");
  }

  function repasarErrores() {
    var falladas = estado.errores.map(function (e) {
      // Volver a revolver las opciones de cada pregunta fallada
      var p = e.p;
      var orden = p.opciones.map(function (t, i) { return { texto: t, correcta: i === p.correcta }; });
      orden = revolver(orden);
      return {
        tema: p.tema, materia: p.materia, pregunta: p.pregunta, explicacion: p.explicacion, clave: p.clave,
        opciones: orden.map(function (x) { return x.texto; }),
        correcta: orden.findIndex(function (x) { return x.correcta; })
      };
    });
    var origen = { tipo: "repaso" };
    empezar("Repaso de errores", falladas, false, origen);
  }

  function otraRonda() {
    var o = estado.origen;
    if (o && o.tipo === "materia") {
      var m = buscarMateria(o.materiaId);
      if (m) { iniciarMateria(m, o.tema); return; }
    }
    if (o && o.tipo === "repaso") { repasarErrores(); return; }
    if (o && o.tipo === "guardadas") { repasarGuardadas(); return; }
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
    estado.errores.forEach(function (e) { if (e.p.clave) pendientes[e.p.clave] = true; });
    estado.acertadas.forEach(function (k) { delete pendientes[k]; });
    nube.falladas = Object.keys(pendientes).filter(function (k) { return indice[k]; });

    var records = combinarRecords(leerRecordsLocales(), nube.records);
    Cuenta.guardarIntento(estado.titulo, estado.aciertos, total)
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
      var t = document.createElement("strong");
      t.textContent = "Últimas rondas";
      t.style.fontSize = ".9rem";
      cont.appendChild(t);
      filas.forEach(function (f) {
        var fila = document.createElement("div");
        fila.className = "historial-fila";
        var a = document.createElement("span");
        var fecha = new Date(f.created_at);
        a.textContent = f.titulo + " · " + fecha.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
        var b = document.createElement("span");
        b.className = "historial-pct";
        b.textContent = f.aciertos + "/" + f.total + " (" + f.porcentaje + "%)";
        b.style.color = f.porcentaje >= 70 ? "var(--ok)" : (f.porcentaje >= 50 ? "var(--text)" : "var(--bad)");
        fila.appendChild(a); fila.appendChild(b);
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
      nube.falladas = ((d && d.falladas) || []).filter(function (k) { return indice[k]; });
      nube.activa = true;
      // Sube a la cuenta los récords que ya tenía en este navegador
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
      .map(function (x) { return prepararPregunta(x.p, x.m.nombre, x.m.id); });
    if (!lista.length) { irInicio(); return; }
    empezar("Mis preguntas falladas", revolver(lista), false, { tipo: "guardadas" }, true);
  }

  // ---------- Pantalla de login ----------
  var modoRegistro = false;
  function abrirLogin() {
    if (Cuenta.usuario()) {
      if (confirm("¿Cerrar sesión de " + Cuenta.usuario().email + "?")) {
        Cuenta.salir().then(irInicio);
      }
      return;
    }
    cambiarModo(false);
    mostrar("pantalla-login");
    $("login-correo").focus();
  }
  function cambiarModo(registro, conservarMensaje) {
    modoRegistro = registro;
    $("tab-entrar").classList.toggle("activa", !registro);
    $("tab-registro").classList.toggle("activa", registro);
    $("tab-entrar").setAttribute("aria-selected", registro ? "false" : "true");
    $("tab-registro").setAttribute("aria-selected", registro ? "true" : "false");
    $("btn-login-enviar").textContent = registro ? "Crear cuenta" : "Entrar";
    $("login-clave").setAttribute("autocomplete", registro ? "new-password" : "current-password");
    if (!conservarMensaje) mensajeLogin("", "");
  }
  function mensajeLogin(texto, tipo) {
    var el = $("login-msg");
    el.textContent = texto;
    el.className = "login-msg " + tipo;
    el.classList.toggle("oculto", !texto);
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
    var accion = eraRegistro ? Cuenta.registrar(correo, clave) : Cuenta.entrar(correo, clave);
    accion.then(function (r) {
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
    pintarInicio();
    pintarProgreso();
    mostrar("pantalla-inicio");
  }

  // ---------- Eventos ----------
  $("btn-inicio").addEventListener("click", irInicio);
  $("btn-mixto").addEventListener("click", iniciarMixto);
  $("btn-atras-materia").addEventListener("click", irInicio);
  $("btn-salir").addEventListener("click", function () {
    if (estado.indice === 0 && !estado.respondida) { irInicio(); return; }
    if (confirm("¿Seguro que quieres salir? Se perderá el avance de esta ronda.")) irInicio();
  });
  $("btn-explicacion").addEventListener("click", alternarExplicacion);
  $("btn-siguiente").addEventListener("click", siguiente);
  $("btn-repasar").addEventListener("click", repasarErrores);
  $("btn-otra-vez").addEventListener("click", otraRonda);
  $("btn-volver-inicio").addEventListener("click", irInicio);

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

  // Atajos de teclado: 1-4 o A-D para responder, Enter para seguir
  document.addEventListener("keydown", function (ev) {
    if ($("pantalla-quiz").classList.contains("oculto")) return;
    if (ev.target && (ev.target.tagName === "SELECT" || ev.target.tagName === "INPUT")) return;
    var k = ev.key.toUpperCase();
    var idx = "1234".indexOf(k);
    if (idx === -1) idx = "ABCD".indexOf(k);
    if (idx !== -1 && !estado.respondida) {
      var p = estado.preguntas[estado.indice];
      if (idx < p.opciones.length) responder(idx);
    } else if (ev.key === "Enter" && estado.respondida && document.activeElement === document.body) {
      siguiente();
    }
  });

  irInicio();
})();
