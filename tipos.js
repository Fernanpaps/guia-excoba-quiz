// ============================================================
//  Tipos de pregunta (como en el EXCOBA real)
//
//  Cada pregunta del banco puede tener un campo "tipo". Si no lo tiene,
//  es de opción múltiple normal. Los demás tipos imitan las formas de
//  contestar del examen:
//
//   opcion      { q, o:[...], a:0 }                         una respuesta
//   varias      { q, o:[...], a:[0,2] }                     elegir todas las correctas
//   num         { q, r:54 }  o  { q, campos:["x =","y ="], r:[2,3] }   escribir número(s)
//   alg         { q, r:"9x^(-8)y^4" }                       escribir expresión algebraica
//   clasificar  { q, cats:["A","B"], items:[["texto",0],["texto",1]] }
//   huecos      { q, texto:"Los animales {} como...", huecos:[["correcta","otra"],...] }
//   ordenar     { q, items:["primero","segundo",...] }      (en el orden correcto)
//
//  Las de varias respuestas se califican parcial, igual que el examen:
//  si son 4 elementos, cada uno vale 0.25.
// ============================================================
(function () {
  "use strict";

  var LETRAS = ["A", "B", "C", "D", "E", "F", "G", "H"];

  function revolver(lista) {
    var c = lista.slice();
    for (var i = c.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = c[i]; c[i] = c[j]; c[j] = t;
    }
    return c;
  }
  // Revuelve sin dejar el orden original (para ordenar/clasificar)
  function revolverDistinto(lista) {
    if (lista.length < 2) return lista.slice();
    var r, intentos = 0;
    do { r = revolver(lista); intentos++; } while (intentos < 10 && r.every(function (x, i) { return x === lista[i]; }));
    return r;
  }
  function el(tag, clase, texto) {
    var e = document.createElement(tag);
    if (clase) e.className = clase;
    if (texto !== undefined) e.textContent = texto;
    return e;
  }

  // ---------- Números: acepta 3.5, 3,5, 3/4, -2, 1 1/2, 2.5e3 ----------
  function leerNumero(t) {
    if (t === null || t === undefined) return NaN;
    var s = String(t).trim().replace(/\s+/g, " ").replace(/−/g, "-").replace(/,/g, ".");
    s = s.replace(/[%$°]/g, "").trim();
    if (!s) return NaN;
    var m = s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);           // número mixto 1 1/2
    if (m) { var ent = parseFloat(m[1]); var f = parseFloat(m[2]) / parseFloat(m[3]); return ent < 0 ? ent - f : ent + f; }
    m = s.match(/^(-?\d*\.?\d+)\s*\/\s*(-?\d*\.?\d+)$/);   // fracción
    if (m) return parseFloat(m[1]) / parseFloat(m[2]);
    s = s.replace(/ /g, "");
    if (!/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(s)) return NaN;
    return parseFloat(s);
  }
  function numerosIguales(u, r, tol) {
    if (isNaN(u)) return false;
    var margen = tol !== undefined ? tol : Math.max(0.011, Math.abs(r) * 0.005);
    return Math.abs(u - r) <= margen + 1e-12;
  }
  function formatoNumero(n) {
    if (typeof n === "string") return n;
    var r = Math.round(n * 10000) / 10000;
    return String(r);
  }

  // ---------- Expresiones algebraicas (sin eval) ----------
  // Convierte lo que escribe el alumno a una función que se puede evaluar
  function normalizarExpr(s) {
    return String(s)
      .replace(/\s+/g, "")
      .replace(/[−–]/g, "-").replace(/[×·∙]/g, "*").replace(/÷/g, "/")
      .replace(/²/g, "^2").replace(/³/g, "^3").replace(/⁴/g, "^4")
      .replace(/√/g, "sqrt")
      .replace(/\*\*/g, "^")
      .toLowerCase();
  }
  function tokenizar(s) {
    var toks = [], i = 0;
    while (i < s.length) {
      var c = s[i];
      if (/[0-9.]/.test(c)) {
        var j = i; while (j < s.length && /[0-9.]/.test(s[j])) j++;
        toks.push({ t: "n", v: parseFloat(s.slice(i, j)) }); i = j;
      } else if (s.substr(i, 4) === "sqrt") { toks.push({ t: "f", v: "sqrt" }); i += 4; }
      else if (/[a-z]/.test(c)) { toks.push({ t: "v", v: c }); i++; }
      else if ("+-*/^()".indexOf(c) !== -1) { toks.push({ t: c }); i++; }
      else throw new Error("Símbolo no válido: " + c);
    }
    // multiplicación implícita: 3x, x(…), )(…), 2sqrt(…), xy
    var out = [];
    toks.forEach(function (tk, k) {
      var prev = out[out.length - 1];
      if (prev && (prev.t === "n" || prev.t === "v" || prev.t === ")") &&
          (tk.t === "n" || tk.t === "v" || tk.t === "(" || tk.t === "f")) out.push({ t: "*" });
      out.push(tk);
    });
    return out;
  }
  function compilar(texto) {
    var toks = tokenizar(normalizarExpr(texto)), pos = 0;
    function ver() { return toks[pos]; }
    function tomar(t) { if (!toks[pos] || toks[pos].t !== t) throw new Error("Falta " + t); pos++; }
    function expr() {
      var n = term();
      while (ver() && (ver().t === "+" || ver().t === "-")) {
        var op = toks[pos++].t, a = n, b = term();
        n = op === "+" ? (function (a, b) { return function (v) { return a(v) + b(v); }; })(a, b)
                       : (function (a, b) { return function (v) { return a(v) - b(v); }; })(a, b);
      }
      return n;
    }
    function term() {
      var n = unario();
      while (ver() && (ver().t === "*" || ver().t === "/")) {
        var op = toks[pos++].t, a = n, b = unario();
        n = op === "*" ? (function (a, b) { return function (v) { return a(v) * b(v); }; })(a, b)
                       : (function (a, b) { return function (v) { return a(v) / b(v); }; })(a, b);
      }
      return n;
    }
    function unario() {
      if (ver() && ver().t === "-") { pos++; var a = unario(); return function (v) { return -a(v); }; }
      if (ver() && ver().t === "+") { pos++; return unario(); }
      return potencia();
    }
    function potencia() {
      var base = atomo();
      if (ver() && ver().t === "^") { pos++; var e = unario(); return function (v) { return Math.pow(base(v), e(v)); }; }
      return base;
    }
    function atomo() {
      var tk = toks[pos++];
      if (!tk) throw new Error("Expresión incompleta");
      if (tk.t === "n") return function () { return tk.v; };
      if (tk.t === "v") return function (v) { return v[tk.v]; };
      if (tk.t === "f") { tomar("("); var a = expr(); tomar(")"); return function (v) { return Math.sqrt(a(v)); }; }
      if (tk.t === "(") { var b = expr(); tomar(")"); return b; }
      throw new Error("Expresión no válida");
    }
    var f = expr();
    if (pos !== toks.length) throw new Error("Sobra algo en la expresión");
    return f;
  }
  function expresionesIguales(usuario, correcta) {
    var fu, fc;
    try { fu = compilar(usuario); fc = compilar(correcta); } catch (e) { return false; }
    var letras = "abcdefghijkmnpqrstuvwxyz".split("");
    for (var prueba = 0; prueba < 6; prueba++) {
      var vals = {};
      letras.forEach(function (l) { vals[l] = 1.13 + Math.random() * 1.9; });
      var a = fu(vals), b = fc(vals);
      if (!isFinite(a) || !isFinite(b)) return false;
      if (Math.abs(a - b) > 1e-6 * Math.max(1, Math.abs(b))) return false;
    }
    return true;
  }

  // ============================================================
  //  Definición de cada tipo
  //   preparar(p)        → datos listos para mostrar (opciones revueltas, etc.)
  //   pintar(prep, cont) → dibuja los controles para contestar
  //   leer(prep, cont)   → lo que contestó (o null si no contestó nada)
  //   calificar(prep, r) → número de 0 a 1
  //   corregir(prep, cont, r) → marca en verde/rojo
  //   textoTuya / textoCorrecta → para la lista de errores
  // ============================================================
  var T = {};

  T.opcion = {
    instruccion: "Elige una respuesta.",
    preparar: function (p) {
      var orden = revolver(p.o.map(function (t, i) { return { t: t, ok: i === p.a }; }));
      return { opciones: orden.map(function (x) { return x.t; }), correcta: orden.findIndex(function (x) { return x.ok; }) };
    },
    pintar: function (prep, cont, alElegir) {
      prep.opciones.forEach(function (texto, i) {
        var b = el("button", "opcion"); b.type = "button";
        b.appendChild(el("span", "opcion-letra", LETRAS[i]));
        b.appendChild(el("span", "", texto));
        b.addEventListener("click", function () {
          cont.querySelectorAll(".opcion").forEach(function (x) { x.classList.remove("elegida"); });
          b.classList.add("elegida");
          cont.dataset.elegida = i;
          if (alElegir) alElegir(i);
        });
        cont.appendChild(b);
      });
    },
    leer: function (prep, cont) { return cont.dataset.elegida === undefined ? null : parseInt(cont.dataset.elegida, 10); },
    calificar: function (prep, r) { return r === prep.correcta ? 1 : 0; },
    corregir: function (prep, cont, r) {
      cont.querySelectorAll(".opcion").forEach(function (b, i) {
        b.disabled = true; b.classList.remove("elegida");
        if (i === prep.correcta) b.classList.add("correcta");
        if (i === r && i !== prep.correcta) b.classList.add("incorrecta");
      });
    },
    textoTuya: function (prep, r) { return r === null ? "(sin contestar)" : prep.opciones[r]; },
    textoCorrecta: function (prep) { return prep.opciones[prep.correcta]; }
  };

  T.varias = {
    instruccion: "Puede haber más de una correcta: selecciona todas las que apliquen.",
    preparar: function (p) {
      var orden = revolver(p.o.map(function (t, i) { return { t: t, ok: p.a.indexOf(i) !== -1 }; }));
      return { opciones: orden.map(function (x) { return x.t; }), correctas: orden.map(function (x) { return x.ok; }), max: p.max || 0 };
    },
    pintar: function (prep, cont) {
      prep.opciones.forEach(function (texto) {
        var b = el("button", "opcion opcion-check"); b.type = "button";
        b.setAttribute("aria-pressed", "false");
        b.appendChild(el("span", "opcion-letra", "☐"));
        b.appendChild(el("span", "", texto));
        b.addEventListener("click", function () {
          var on = b.getAttribute("aria-pressed") !== "true";
          // Si la pregunta pide exactamente N, no deja marcar más
          if (on && prep.max && cont.querySelectorAll('.opcion[aria-pressed="true"]').length >= prep.max) {
            b.classList.add("tope"); setTimeout(function () { b.classList.remove("tope"); }, 400); return;
          }
          b.setAttribute("aria-pressed", on ? "true" : "false");
          b.classList.toggle("elegida", on);
          b.firstChild.textContent = on ? "☑" : "☐";
        });
        cont.appendChild(b);
      });
    },
    leer: function (prep, cont) {
      var r = [].map.call(cont.querySelectorAll(".opcion"), function (b) { return b.getAttribute("aria-pressed") === "true"; });
      return r.some(Boolean) ? r : null;
    },
    calificar: function (prep, r) {
      if (!r) return 0;
      var total = prep.correctas.filter(Boolean).length, bien = 0, mal = 0;
      r.forEach(function (sel, i) { if (sel && prep.correctas[i]) bien++; if (sel && !prep.correctas[i]) mal++; });
      return Math.max(0, (bien - mal) / total);
    },
    corregir: function (prep, cont, r) {
      cont.querySelectorAll(".opcion").forEach(function (b, i) {
        b.disabled = true; b.classList.remove("elegida");
        var sel = r && r[i];
        if (prep.correctas[i]) b.classList.add(sel ? "correcta" : "faltante");
        else if (sel) b.classList.add("incorrecta");
      });
    },
    textoTuya: function (prep, r) {
      if (!r) return "(sin contestar)";
      return prep.opciones.filter(function (_, i) { return r[i]; }).join(" · ");
    },
    textoCorrecta: function (prep) { return prep.opciones.filter(function (_, i) { return prep.correctas[i]; }).join(" · "); }
  };

  T.num = {
    instruccion: "Escribe tu resultado con números. Puedes usar punto decimal o fracción (ej. 3/4).",
    preparar: function (p) {
      var r = Array.isArray(p.r) ? p.r : [p.r];
      var campos = p.campos || r.map(function () { return ""; });
      return { r: r, campos: campos, tol: p.tol, unidad: p.u || "", mostrar: p.rm };
    },
    pintar: function (prep, cont) {
      prep.campos.forEach(function (etq, i) {
        var fila = el("label", "campo-num");
        if (etq) fila.appendChild(el("span", "campo-etq", etq));
        var inp = el("input", "input-resp");
        inp.type = "text"; inp.inputMode = "decimal"; inp.autocomplete = "off";
        inp.setAttribute("aria-label", etq || "Tu respuesta");
        inp.placeholder = "Tu respuesta";
        fila.appendChild(inp);
        if (prep.unidad) fila.appendChild(el("span", "campo-unidad", prep.unidad));
        cont.appendChild(fila);
      });
    },
    leer: function (prep, cont) {
      var vals = [].map.call(cont.querySelectorAll("input"), function (i) { return i.value.trim(); });
      return vals.some(function (v) { return v !== ""; }) ? vals : null;
    },
    calificar: function (prep, r) {
      if (!r) return 0;
      var bien = 0;
      prep.r.forEach(function (c, i) { if (numerosIguales(leerNumero(r[i]), c, prep.tol)) bien++; });
      return bien / prep.r.length;
    },
    corregir: function (prep, cont, r) {
      cont.querySelectorAll("input").forEach(function (inp, i) {
        inp.disabled = true;
        var ok = r && numerosIguales(leerNumero(r[i]), prep.r[i], prep.tol);
        inp.classList.add(ok ? "correcta" : "incorrecta");
      });
    },
    textoTuya: function (prep, r) {
      if (!r) return "(sin contestar)";
      return prep.campos.map(function (c, i) { return (c ? c + " " : "") + (r[i] || "—"); }).join("   ") + (prep.unidad ? " " + prep.unidad : "");
    },
    textoCorrecta: function (prep) {
      if (prep.mostrar) return prep.mostrar;
      return prep.campos.map(function (c, i) { return (c ? c + " " : "") + formatoNumero(prep.r[i]); }).join("   ") + (prep.unidad ? " " + prep.unidad : "");
    }
  };

  T.alg = {
    instruccion: "Escribe la expresión. Potencias con ^ : x² se escribe x^2 y x⁻² se escribe x^(-2). Raíz: sqrt(x).",
    preparar: function (p) { return { r: p.r, mostrar: p.rm || p.r }; },
    pintar: function (prep, cont) {
      var fila = el("label", "campo-num");
      fila.appendChild(el("span", "campo-etq", "Escribe aquí:"));
      var inp = el("input", "input-resp input-alg");
      inp.type = "text"; inp.autocomplete = "off"; inp.spellcheck = false;
      inp.setAttribute("autocapitalize", "off");
      inp.placeholder = "ej. 3x^2 - 5x + 2";
      fila.appendChild(inp);
      cont.appendChild(fila);
      var vista = el("p", "vista-alg muted", "");
      cont.appendChild(vista);
      inp.addEventListener("input", function () {
        var v = inp.value.trim();
        if (!v) { vista.textContent = ""; return; }
        try { compilar(v); vista.textContent = "Se lee: " + bonito(v); vista.classList.remove("error-texto"); }
        catch (e) { vista.textContent = "Revisa: " + e.message; vista.classList.add("error-texto"); }
      });
    },
    leer: function (prep, cont) { var v = cont.querySelector("input").value.trim(); return v || null; },
    calificar: function (prep, r) { return r && expresionesIguales(r, prep.r) ? 1 : 0; },
    corregir: function (prep, cont, r) {
      var inp = cont.querySelector("input");
      inp.disabled = true;
      inp.classList.add(r && expresionesIguales(r, prep.r) ? "correcta" : "incorrecta");
    },
    textoTuya: function (prep, r) { return r ? bonito(r) : "(sin contestar)"; },
    textoCorrecta: function (prep) { return bonito(prep.mostrar); }
  };
  // Muestra x^2 como x², x^(-8) como x⁻⁸, etc. (solo para leer)
  function bonito(s) {
    var sup = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
    return String(s).replace(/\^\(?(-?\d+)\)?/g, function (_, n) { return n.split("").map(function (c) { return sup[c] || c; }).join(""); })
      .replace(/\*/g, "·").replace(/sqrt/g, "√");
  }

  T.clasificar = {
    instruccion: "Toca un elemento y después toca la columna donde va. Para quitarlo, tócalo otra vez.",
    preparar: function (p) {
      return { cats: p.cats, items: revolver(p.items.map(function (x) { return { t: x[0], c: x[1] }; })) };
    },
    pintar: function (prep, cont) {
      var seleccionado = null;
      var banco = el("div", "banco");
      banco.appendChild(el("span", "banco-titulo", "Elementos"));
      var zonaBanco = el("div", "chips");
      banco.appendChild(zonaBanco);
      var cols = el("div", "columnas");
      var zonas = prep.cats.map(function (c, ci) {
        var col = el("div", "columna"); col.dataset.cat = ci;
        col.appendChild(el("span", "columna-titulo", c));
        var z = el("div", "chips"); col.appendChild(z);
        col.addEventListener("click", function () {
          if (!seleccionado) return;
          z.appendChild(seleccionado); seleccionado.classList.remove("seleccionado");
          seleccionado.dataset.puesto = ci; seleccionado = null;
          cont.classList.remove("eligiendo");
        });
        cols.appendChild(col);
        return z;
      });
      prep.items.forEach(function (it, i) {
        var chip = el("button", "chip", it.t); chip.type = "button"; chip.dataset.i = i;
        chip.addEventListener("click", function (ev) {
          ev.stopPropagation();
          if (chip.dataset.puesto !== undefined) {          // regresar al banco
            delete chip.dataset.puesto; zonaBanco.appendChild(chip);
            if (seleccionado) seleccionado.classList.remove("seleccionado");
            seleccionado = null; cont.classList.remove("eligiendo"); return;
          }
          if (seleccionado === chip) { chip.classList.remove("seleccionado"); seleccionado = null; cont.classList.remove("eligiendo"); return; }
          if (seleccionado) seleccionado.classList.remove("seleccionado");
          seleccionado = chip; chip.classList.add("seleccionado"); cont.classList.add("eligiendo");
        });
        zonaBanco.appendChild(chip);
      });
      cont.appendChild(banco);
      cont.appendChild(cols);
      void zonas;
    },
    leer: function (prep, cont) {
      var r = prep.items.map(function () { return null; }), alguno = false;
      cont.querySelectorAll(".chip").forEach(function (ch) {
        if (ch.dataset.puesto !== undefined) { r[+ch.dataset.i] = +ch.dataset.puesto; alguno = true; }
      });
      return alguno ? r : null;
    },
    calificar: function (prep, r) {
      if (!r) return 0;
      var bien = 0; prep.items.forEach(function (it, i) { if (r[i] === it.c) bien++; });
      return bien / prep.items.length;
    },
    corregir: function (prep, cont, r) {
      cont.querySelectorAll(".chip").forEach(function (ch) {
        ch.disabled = true;
        var i = +ch.dataset.i, puesto = r ? r[i] : null;
        ch.classList.add(puesto === prep.items[i].c ? "correcta" : "incorrecta");
        if (puesto !== prep.items[i].c) ch.title = "Va en: " + prep.cats[prep.items[i].c];
        if (puesto !== prep.items[i].c) ch.textContent = prep.items[i].t + " → " + prep.cats[prep.items[i].c];
      });
    },
    textoTuya: function (prep, r) {
      if (!r) return "(sin contestar)";
      return prep.cats.map(function (c, ci) {
        var xs = prep.items.filter(function (_, i) { return r[i] === ci; }).map(function (x) { return x.t; });
        return c + ": " + (xs.join(", ") || "—");
      }).join("\n");
    },
    textoCorrecta: function (prep) {
      return prep.cats.map(function (c, ci) {
        return c + ": " + prep.items.filter(function (x) { return x.c === ci; }).map(function (x) { return x.t; }).join(", ");
      }).join("\n");
    }
  };

  T.huecos = {
    instruccion: "Toca cada espacio y elige la palabra correcta.",
    preparar: function (p) {
      return {
        partes: p.texto.split("{}"),
        huecos: p.huecos.map(function (h) { return { correcta: h[0], opciones: revolver(h) }; })
      };
    },
    pintar: function (prep, cont) {
      var parrafo = el("p", "texto-huecos");
      prep.partes.forEach(function (parte, i) {
        parrafo.appendChild(document.createTextNode(parte));
        if (i < prep.huecos.length) {
          var s = el("select", "hueco"); s.setAttribute("aria-label", "Espacio " + (i + 1));
          s.appendChild(new Option("______", ""));
          prep.huecos[i].opciones.forEach(function (o) { s.appendChild(new Option(o, o)); });
          parrafo.appendChild(s);
        }
      });
      cont.appendChild(parrafo);
    },
    leer: function (prep, cont) {
      var r = [].map.call(cont.querySelectorAll("select"), function (s) { return s.value; });
      return r.some(Boolean) ? r : null;
    },
    calificar: function (prep, r) {
      if (!r) return 0;
      var bien = 0; prep.huecos.forEach(function (h, i) { if (r[i] === h.correcta) bien++; });
      return bien / prep.huecos.length;
    },
    corregir: function (prep, cont, r) {
      cont.querySelectorAll("select").forEach(function (s, i) {
        s.disabled = true;
        var ok = r && r[i] === prep.huecos[i].correcta;
        s.classList.add(ok ? "correcta" : "incorrecta");
        if (!ok) {
          var n = el("span", "hueco-correcto", "(" + prep.huecos[i].correcta + ")");
          s.insertAdjacentElement("afterend", n);
        }
      });
    },
    textoTuya: function (prep, r) { return r ? r.map(function (x) { return x || "—"; }).join(" · ") : "(sin contestar)"; },
    textoCorrecta: function (prep) { return prep.huecos.map(function (h) { return h.correcta; }).join(" · "); }
  };

  T.ordenar = {
    instruccion: "Toca los elementos en el orden correcto (el primero, luego el segundo…). Toca uno ya numerado para quitarlo.",
    preparar: function (p) {
      return { correcto: p.items.slice(), mostrados: revolverDistinto(p.items) };
    },
    pintar: function (prep, cont) {
      var orden = [];
      var lista = el("div", "lista-ordenar");
      function renumerar() {
        lista.querySelectorAll(".orden-item").forEach(function (b) {
          var pos = orden.indexOf(b.dataset.t);
          b.querySelector(".opcion-letra").textContent = pos === -1 ? "·" : String(pos + 1);
          b.classList.toggle("elegida", pos !== -1);
        });
        cont.dataset.orden = JSON.stringify(orden);
      }
      prep.mostrados.forEach(function (t) {
        var b = el("button", "opcion orden-item"); b.type = "button"; b.dataset.t = t;
        b.appendChild(el("span", "opcion-letra", "·"));
        b.appendChild(el("span", "", t));
        b.addEventListener("click", function () {
          var pos = orden.indexOf(t);
          if (pos === -1) orden.push(t); else orden.splice(pos, 1);
          renumerar();
        });
        lista.appendChild(b);
      });
      cont.appendChild(lista);
    },
    leer: function (prep, cont) {
      var o = cont.dataset.orden ? JSON.parse(cont.dataset.orden) : [];
      return o.length ? o : null;
    },
    calificar: function (prep, r) {
      if (!r) return 0;
      var bien = 0; prep.correcto.forEach(function (t, i) { if (r[i] === t) bien++; });
      return bien / prep.correcto.length;
    },
    corregir: function (prep, cont, r) {
      cont.querySelectorAll(".orden-item").forEach(function (b) {
        b.disabled = true; b.classList.remove("elegida");
        var t = b.dataset.t, bien = prep.correcto.indexOf(t);
        var ok = r && r[bien] === t;
        b.classList.add(ok ? "correcta" : "incorrecta");
        b.querySelector(".opcion-letra").textContent = String(bien + 1);
      });
      // mostrarlos ya en el orden correcto
      var lista = cont.querySelector(".lista-ordenar");
      prep.correcto.forEach(function (t) {
        var b = [].find.call(lista.children, function (x) { return x.dataset.t === t; });
        if (b) lista.appendChild(b);
      });
    },
    textoTuya: function (prep, r) { return r ? r.map(function (t, i) { return (i + 1) + ". " + t; }).join("\n") : "(sin contestar)"; },
    textoCorrecta: function (prep) { return prep.correcto.map(function (t, i) { return (i + 1) + ". " + t; }).join("\n"); }
  };

  // ---------- Tabla: leer un texto y llenar cada fila con la frase correcta ----------
  //  { tipo:"tabla", lectura:"...", cab:["Pregunta","Respuesta"], filas:[["¿Qué pasó?","frase correcta"],...], extra:["distractor"] }
  T.tabla = {
    instruccion: "Lee el texto y, en cada fila, elige la frase que corresponde.",
    preparar: function (p) {
      var pool = p.filas.map(function (f) { return f[1]; }).concat(p.extra || []);
      return { cab: p.cab || ["", "Respuesta"], filas: p.filas.map(function (f) { return { etq: f[0], correcta: f[1] }; }), opciones: revolver(pool) };
    },
    pintar: function (prep, cont) {
      var t = el("table", "tabla-resp");
      var tr = el("tr");
      prep.cab.forEach(function (c) { tr.appendChild(el("th", "", c)); });
      var thead = el("thead"); thead.appendChild(tr); t.appendChild(thead);
      var tb = el("tbody");
      prep.filas.forEach(function (f, i) {
        var fila = el("tr");
        fila.appendChild(el("td", "tabla-etq", f.etq));
        var td = el("td"), s = el("select", "hueco");
        s.setAttribute("aria-label", f.etq);
        s.appendChild(new Option("Elige…", ""));
        prep.opciones.forEach(function (o) { s.appendChild(new Option(o, o)); });
        td.appendChild(s); fila.appendChild(td); tb.appendChild(fila);
      });
      t.appendChild(tb);
      cont.appendChild(t);
    },
    leer: function (prep, cont) {
      var r = [].map.call(cont.querySelectorAll("select"), function (s) { return s.value; });
      return r.some(Boolean) ? r : null;
    },
    calificar: function (prep, r) {
      if (!r) return 0;
      var bien = 0; prep.filas.forEach(function (f, i) { if (r[i] === f.correcta) bien++; });
      return bien / prep.filas.length;
    },
    corregir: function (prep, cont, r) {
      cont.querySelectorAll("select").forEach(function (s, i) {
        s.disabled = true;
        var ok = r && r[i] === prep.filas[i].correcta;
        s.classList.add(ok ? "correcta" : "incorrecta");
        if (!ok) s.insertAdjacentElement("afterend", el("div", "hueco-correcto", "✔ " + prep.filas[i].correcta));
      });
    },
    textoTuya: function (prep, r) { return r ? prep.filas.map(function (f, i) { return f.etq + " " + (r[i] || "—"); }).join("\n") : "(sin contestar)"; },
    textoCorrecta: function (prep) { return prep.filas.map(function (f) { return f.etq + " " + f.correcta; }).join("\n"); }
  };

  // ---------- Marcar en el texto: tocar las palabras o frases que se piden ----------
  //  texto con fragmentos tocables entre llaves: {fragmento} (no va) y {+fragmento} (sí va).
  //  Un fragmento {,} o {+,} es un lugar donde podría ir una coma.
  T.marcar = {
    instruccion: "Toca en el texto las partes que se piden. Tócalas otra vez para quitarlas.",
    preparar: function (p) {
      var partes = [], re = /\{(\+?)([^}]*)\}/g, ult = 0, m;
      while ((m = re.exec(p.texto))) {
        if (m.index > ult) partes.push({ t: p.texto.slice(ult, m.index) });
        partes.push({ t: m[2], ok: m[1] === "+", toca: true });
        ult = re.lastIndex;
      }
      if (ult < p.texto.length) partes.push({ t: p.texto.slice(ult) });
      return { partes: partes };
    },
    pintar: function (prep, cont) {
      var par = el("p", "texto-marcar");
      prep.partes.forEach(function (pt, i) {
        if (!pt.toca) { par.appendChild(document.createTextNode(pt.t)); return; }
        var coma = pt.t === ",";
        var b = el("button", "marca" + (coma ? " marca-coma" : ""), coma ? "ˬ" : pt.t);
        b.type = "button"; b.dataset.i = i; b.setAttribute("aria-pressed", "false");
        if (coma) b.setAttribute("aria-label", "Lugar para una coma");
        b.addEventListener("click", function () {
          var on = b.getAttribute("aria-pressed") !== "true";
          b.setAttribute("aria-pressed", on ? "true" : "false");
          b.classList.toggle("elegida", on);
          if (coma) b.textContent = on ? "," : "ˬ";
        });
        par.appendChild(b);
      });
      cont.appendChild(par);
    },
    leer: function (prep, cont) {
      var r = {}, alguno = false;
      cont.querySelectorAll(".marca").forEach(function (b) { var on = b.getAttribute("aria-pressed") === "true"; r[b.dataset.i] = on; if (on) alguno = true; });
      return alguno ? r : null;
    },
    calificar: function (prep, r) {
      if (!r) return 0;
      var total = 0, bien = 0, mal = 0;
      prep.partes.forEach(function (pt, i) {
        if (!pt.toca) return;
        if (pt.ok) total++;
        if (r[i] && pt.ok) bien++;
        if (r[i] && !pt.ok) mal++;
      });
      return Math.max(0, (bien - mal) / (total || 1));
    },
    corregir: function (prep, cont, r) {
      cont.querySelectorAll(".marca").forEach(function (b) {
        b.disabled = true; b.classList.remove("elegida");
        var pt = prep.partes[+b.dataset.i], sel = r && r[b.dataset.i];
        if (pt.ok) { b.classList.add(sel ? "correcta" : "faltante"); if (pt.t === ",") b.textContent = ","; }
        else if (sel) b.classList.add("incorrecta");
      });
    },
    textoTuya: function (prep, r) {
      if (!r) return "(sin contestar)";
      var xs = prep.partes.filter(function (pt, i) { return pt.toca && r[i]; }).map(function (pt) { return pt.t === "," ? "(coma)" : pt.t; });
      return xs.join(" · ") || "—";
    },
    textoCorrecta: function (prep) {
      if (prep.partes.some(function (pt) { return pt.t === ","; })) {
        return prep.partes.map(function (pt) { return pt.toca ? (pt.ok ? pt.t : "") : pt.t; }).join("");
      }
      return prep.partes.filter(function (pt) { return pt.ok; }).map(function (pt) { return pt.t; }).join(" · ");
    }
  };

  var NOMBRES = {
    opcion: "Opción múltiple", varias: "Selección de elementos", num: "Escritura numérica",
    alg: "Escritura algebraica", clasificar: "Arrastre: clasificar", huecos: "Selección en texto", ordenar: "Arrastre: ordenar",
    tabla: "Llenar tabla", marcar: "Selección en el texto"
  };

  window.TiposPregunta = {
    tipos: T,
    de: function (p) { return T[p.tipo || "opcion"] || T.opcion; },
    nombre: function (tipo) { return NOMBRES[tipo || "opcion"]; },
    // Para pruebas
    _leerNumero: leerNumero, _expresionesIguales: expresionesIguales,
    _evaluar: function (t) { return compilar(t)({}); }
  };
})();
