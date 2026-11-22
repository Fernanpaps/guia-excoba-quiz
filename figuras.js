// ============================================================
//  Figuras y gráficas dibujadas con SVG (sin imágenes externas)
//
//  Una pregunta puede traer "fig": { tipo: "...", ... }. Tipos:
//   grafica    { ejes:["t (s)","d (m)"], x:[0,10], y:[0,50], lineas:[[[0,0],[4,20],...]], puntos:[[x,y,"A"]] }
//              también sirve para rectas y parábolas (lineas = lista de puntos)
//   vectores   { vecs:[[x,y,"A"],...], resultante:true, rango:6 }
//   poligono   { pts:[[x,y],...], cotas:[[[x1,y1],[x2,y2],"8 m"]], cortes:[[[x1,y1],[x2,y2]]], textos:[[x,y,"A"]] }
//   triangulo  { pts:[[x,y],[x,y],[x,y]], v:["A","B","C"], lados:["a","b","c"], ang:["40°","",""], recto:2 }
//              lados[i] es el lado opuesto al vértice i
//   circuito   { modo:"serie"|"paralelo", R:["4 Ω","6 Ω"], V:"12 V" }
//   barras     { etq:["Lun","Mar"], val:[3,5], ejeY:"Alumnos" }
//   tabla      { cab:["x","f"], filas:[[1,2],[3,4]] }
//   linea      { de:1800, a:1950, eventos:[[1810,"Independencia"]] }
//   coords     { x:[-120,-80], y:[10,40], puntos:[[-100,20,"A"]], ejes:["Longitud","Latitud"] }
// ============================================================
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function svg(w, h, cuerpo, titulo) {
    return '<svg class="fig-svg" viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="' + esc(titulo || "Figura") + '" xmlns="' + NS + '">' + cuerpo + "</svg>";
  }
  function txt(x, y, t, extra) {
    return '<text x="' + r1(x) + '" y="' + r1(y) + '" ' + (extra || "") + ">" + esc(t) + "</text>";
  }
  function linea(x1, y1, x2, y2, clase) {
    return '<line x1="' + r1(x1) + '" y1="' + r1(y1) + '" x2="' + r1(x2) + '" y2="' + r1(y2) + '" class="' + (clase || "") + '"/>';
  }
  function r1(n) { return Math.round(n * 10) / 10; }
  function pasoBonito(rango) {
    var crudo = rango / 8, pot = Math.pow(10, Math.floor(Math.log10(crudo)));
    var f = crudo / pot;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pot;
  }
  var FLECHA = '<defs><marker id="fl" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="fig-punta"/></marker>' +
               '<marker id="flr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="fig-punta-r"/></marker></defs>';

  // ---------- Plano cartesiano genérico ----------
  function plano(f, dibujar) {
    var W = 460, H = 320, m = { i: 52, d: 18, a: 16, b: 42 };
    var x0 = f.x[0], x1 = f.x[1], y0 = f.y[0], y1 = f.y[1];
    var sx = function (x) { return m.i + (x - x0) / (x1 - x0) * (W - m.i - m.d); };
    var sy = function (y) { return H - m.b - (y - y0) / (y1 - y0) * (H - m.a - m.b); };
    var out = FLECHA, px = f.pasoX || pasoBonito(x1 - x0), py = f.pasoY || pasoBonito(y1 - y0), v;
    for (v = Math.ceil(x0 / px) * px; v <= x1 + 1e-9; v += px) {
      out += linea(sx(v), sy(y0), sx(v), sy(y1), "fig-rejilla");
      if (!f.sinNumX) out += txt(sx(v), H - m.b + 16, r1(v), 'text-anchor="middle" class="fig-num"');
    }
    for (v = Math.ceil(y0 / py) * py; v <= y1 + 1e-9; v += py) {
      out += linea(sx(x0), sy(v), sx(x1), sy(v), "fig-rejilla");
      out += txt(m.i - 6, sy(v) + 4, r1(v), 'text-anchor="end" class="fig-num"');
    }
    // ejes (en 0 si está dentro del rango)
    var ex = (y0 <= 0 && y1 >= 0) ? sy(0) : sy(y0), ey = (x0 <= 0 && x1 >= 0) ? sx(0) : sx(x0);
    out += linea(sx(x0), ex, sx(x1), ex, "fig-eje");
    out += linea(ey, sy(y0), ey, sy(y1), "fig-eje");
    if (f.ejes) {
      out += txt(W - m.d, H - 6, f.ejes[0], 'text-anchor="end" class="fig-etq"');
      out += txt(6, 12, f.ejes[1], 'class="fig-etq"');
    }
    out += dibujar(sx, sy);
    return svg(W, H, out, f.titulo || "Gráfica");
  }
  function puntosTexto(pts, sx, sy) {
    return (pts || []).map(function (p) {
      return '<circle cx="' + r1(sx(p[0])) + '" cy="' + r1(sy(p[1])) + '" r="4" class="fig-punto"/>' +
        (p[2] !== undefined ? txt(sx(p[0]) + 7, sy(p[1]) - 7, p[2], 'class="fig-etq"') : "");
    }).join("");
  }

  var D = {};

  D.grafica = function (f) {
    return plano(f, function (sx, sy) {
      var out = (f.lineas || []).map(function (l, i) {
        var d = l.map(function (p, k) { return (k ? "L" : "M") + r1(sx(p[0])) + " " + r1(sy(p[1])); }).join(" ");
        return '<path d="' + d + '" class="fig-linea' + (i ? " fig-linea2" : "") + '"/>';
      }).join("");
      return out + puntosTexto(f.puntos, sx, sy);
    });
  };

  D.coords = function (f) {
    return plano(f, function (sx, sy) { return puntosTexto(f.puntos, sx, sy); });
  };

  D.vectores = function (f) {
    var R = f.rango || 6;
    return plano({ x: [-R, R], y: [-R, R], pasoX: 1, pasoY: 1, ejes: ["x", "y"] }, function (sx, sy) {
      var out = "", sumX = 0, sumY = 0;
      f.vecs.forEach(function (v) {
        out += '<line x1="' + sx(0) + '" y1="' + sy(0) + '" x2="' + r1(sx(v[0])) + '" y2="' + r1(sy(v[1])) + '" class="fig-vector" marker-end="url(#fl)"/>';
        if (v[2]) out += txt(sx(v[0] * 1.08) + 4, sy(v[1] * 1.08) - 4, v[2], 'class="fig-etq"');
        sumX += v[0]; sumY += v[1];
      });
      if (f.resultante) {
        out += '<line x1="' + sx(0) + '" y1="' + sy(0) + '" x2="' + r1(sx(sumX)) + '" y2="' + r1(sy(sumY)) + '" class="fig-vector fig-resultante" marker-end="url(#flr)"/>';
        out += txt(sx(sumX) + 6, sy(sumY) - 6, "R = ?", 'class="fig-etq fig-rojo"');
      }
      return out;
    });
  };

  // Ajusta una lista de puntos (en unidades del problema) al lienzo
  function encuadre(pts, W, H, margen) {
    var xs = pts.map(function (p) { return p[0]; }), ys = pts.map(function (p) { return p[1]; });
    var mnx = Math.min.apply(null, xs), mxx = Math.max.apply(null, xs), mny = Math.min.apply(null, ys), mxy = Math.max.apply(null, ys);
    var esc = Math.min((W - 2 * margen) / ((mxx - mnx) || 1), (H - 2 * margen) / ((mxy - mny) || 1));
    var ox = (W - (mxx - mnx) * esc) / 2, oy = (H - (mxy - mny) * esc) / 2;
    return function (p) { return [ox + (p[0] - mnx) * esc, H - (oy + (p[1] - mny) * esc)]; };
  }
  function cota(a, b, t, centro) {
    // Escribe la medida a la mitad del segmento, hacia afuera de la figura
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    var dx = b[0] - a[0], dy = b[1] - a[1], L = Math.sqrt(dx * dx + dy * dy) || 1;
    var nx = -dy / L, ny = dx / L;
    if (centro && ((mx - centro[0]) * nx + (my - centro[1]) * ny) < 0) { nx = -nx; ny = -ny; }
    return txt(mx + nx * 16, my + ny * 16 + 4, t, 'text-anchor="middle" class="fig-medida"');
  }

  D.poligono = function (f) {
    var W = 460, H = 300;
    var todos = f.pts.concat((f.extra || []));
    var T = encuadre(todos, W, H, 40);
    var P = f.pts.map(T);
    var cx = P.reduce(function (s, p) { return s + p[0]; }, 0) / P.length, cy = P.reduce(function (s, p) { return s + p[1]; }, 0) / P.length;
    var out = '<polygon points="' + P.map(function (p) { return r1(p[0]) + "," + r1(p[1]); }).join(" ") + '" class="fig-figura"/>';
    (f.cortes || []).forEach(function (c) { var a = T(c[0]), b = T(c[1]); out += linea(a[0], a[1], b[0], b[1], "fig-corte"); });
    (f.cotas || []).forEach(function (c) { out += cota(T(c[0]), T(c[1]), c[2], [cx, cy]); });
    (f.textos || []).forEach(function (t) { var p = T([t[0], t[1]]); out += txt(p[0], p[1], t[2], 'text-anchor="middle" class="fig-etq"'); });
    return svg(W, H, out, f.titulo || "Figura");
  };

  D.triangulo = function (f) {
    var W = 460, H = 300, T = encuadre(f.pts, W, H, 46), P = f.pts.map(T);
    var cx = (P[0][0] + P[1][0] + P[2][0]) / 3, cy = (P[0][1] + P[1][1] + P[2][1]) / 3;
    var out = '<polygon points="' + P.map(function (p) { return r1(p[0]) + "," + r1(p[1]); }).join(" ") + '" class="fig-figura"/>';
    if (f.recto !== undefined) {
      var V = P[f.recto], A = P[(f.recto + 1) % 3], B = P[(f.recto + 2) % 3];
      var u = function (Q) { var dx = Q[0] - V[0], dy = Q[1] - V[1], L = Math.sqrt(dx * dx + dy * dy); return [dx / L * 14, dy / L * 14]; };
      var ua = u(A), ub = u(B);
      out += '<path d="M' + r1(V[0] + ua[0]) + " " + r1(V[1] + ua[1]) + " L" + r1(V[0] + ua[0] + ub[0]) + " " + r1(V[1] + ua[1] + ub[1]) + " L" + r1(V[0] + ub[0]) + " " + r1(V[1] + ub[1]) + '" class="fig-recto"/>';
    }
    for (var i = 0; i < 3; i++) {
      var p = P[i], dx = p[0] - cx, dy = p[1] - cy, L = Math.sqrt(dx * dx + dy * dy) || 1;
      if (f.v && f.v[i]) out += txt(p[0] + dx / L * 16, p[1] + dy / L * 16 + 5, f.v[i], 'text-anchor="middle" class="fig-vertice"');
      if (f.ang && f.ang[i]) out += txt(p[0] - dx / L * 34, p[1] - dy / L * 34 + 4, f.ang[i], 'text-anchor="middle" class="fig-angulo"');
      if (f.lados && f.lados[i]) out += cota(P[(i + 1) % 3], P[(i + 2) % 3], f.lados[i], [cx, cy]);
    }
    return svg(W, H, out, "Triángulo");
  };

  function resistencia(x, y, vertical) {
    // zigzag de 40 px
    var d = "", k;
    if (!vertical) { d = "M" + x + " " + y; for (k = 0; k < 6; k++) d += " L" + (x + 5 + k * 6) + " " + (y + (k % 2 ? 7 : -7)); d += " L" + (x + 40) + " " + y; }
    else { d = "M" + x + " " + y; for (k = 0; k < 6; k++) d += " L" + (x + (k % 2 ? 7 : -7)) + " " + (y + 5 + k * 6); d += " L" + x + " " + (y + 40); }
    return '<path d="' + d + '" class="fig-res"/>';
  }
  D.circuito = function (f) {
    var W = 460, H = 240, out = "", n = f.R.length;
    var izq = 60, der = 400, arr = 50, aba = 200;
    // pila a la izquierda
    out += linea(izq, arr, izq, 100, "fig-cable") + linea(izq, 140, izq, aba, "fig-cable");
    out += linea(izq - 16, 108, izq + 16, 108, "fig-pila") + linea(izq - 8, 120, izq + 8, 120, "fig-pila-c");
    out += txt(izq - 22, 118, f.V || "", 'text-anchor="end" class="fig-medida"');
    out += linea(izq, 120, izq, 140, "fig-cable");
    out += linea(izq, 100, izq, 108, "fig-cable");
    out += txt(izq + 20, 104, "+", 'class="fig-etq"');
    out += linea(izq, aba, der, aba, "fig-cable");
    if (f.modo === "serie") {
      var tramo = (der - izq) / n, x = izq;
      for (var i = 0; i < n; i++) {
        var cxr = izq + tramo * (i + 0.5) - 20;
        out += linea(x, arr, cxr, arr, "fig-cable") + resistencia(cxr, arr, false);
        out += txt(cxr + 20, arr - 14, f.R[i], 'text-anchor="middle" class="fig-medida"');
        x = cxr + 40;
      }
      out += linea(x, arr, der, arr, "fig-cable") + linea(der, arr, der, aba, "fig-cable");
    } else {
      out += linea(izq, arr, der, arr, "fig-cable");
      var esp = (der - izq - 60) / Math.max(1, n - 1);
      for (var j = 0; j < n; j++) {
        var xr = n === 1 ? (izq + der) / 2 : izq + 60 + esp * j;
        if (j === n - 1) xr = der;
        out += linea(xr, arr, xr, 105, "fig-cable") + resistencia(xr, 105, true) + linea(xr, 145, xr, aba, "fig-cable");
        out += txt(xr + 12, 130, f.R[j], 'class="fig-medida"');
      }
    }
    return svg(W, H, out, "Circuito " + (f.modo || ""));
  };

  D.barras = function (f) {
    var max = Math.max.apply(null, f.val), p = pasoBonito(max), top = (Math.floor(max / p) + 1) * p;
    var n = f.val.length;
    return plano({ x: [0, n], y: [0, top], pasoX: 1, sinNumX: true, ejes: ["", f.ejeY || ""] }, function (sx, sy) {
      var out = "";
      f.val.forEach(function (v, i) {
        var x1 = sx(i + 0.18), x2 = sx(i + 0.82);
        out += '<rect x="' + r1(x1) + '" y="' + r1(sy(v)) + '" width="' + r1(x2 - x1) + '" height="' + r1(sy(0) - sy(v)) + '" class="fig-barra"/>';
        out += txt((x1 + x2) / 2, sy(v) - 5, v, 'text-anchor="middle" class="fig-num fig-fuerte"');
        out += txt((x1 + x2) / 2, sy(0) + 16, f.etq[i], 'text-anchor="middle" class="fig-etq fig-chico"');
      });
      return out;
    });
  };

  D.tabla = function () { return ""; }; // las tablas se dibujan como HTML (ver dibujar)

  D.linea = function (f) {
    var W = 460, H = 220, m = 30;
    var sx = function (a) { return m + (a - f.de) / (f.a - f.de) * (W - 2 * m); };
    var out = linea(m, 110, W - m, 110, "fig-eje");
    var paso = f.paso || pasoBonito(f.a - f.de);
    for (var a = Math.ceil(f.de / paso) * paso; a <= f.a; a += paso) {
      out += linea(sx(a), 104, sx(a), 116, "fig-eje") + txt(sx(a), 132, a, 'text-anchor="middle" class="fig-num"');
    }
    f.eventos.forEach(function (e, i) {
      var arriba = i % 2 === 0, y = arriba ? 60 - (i % 4 === 2 ? 26 : 0) : 160 + (i % 4 === 3 ? 26 : 0);
      out += linea(sx(e[0]), 110, sx(e[0]), arriba ? y + 6 : y - 14, "fig-guia");
      out += '<circle cx="' + r1(sx(e[0])) + '" cy="110" r="5" class="fig-punto"/>';
      out += txt(sx(e[0]), y, e[1], 'text-anchor="middle" class="fig-etq fig-chico"');
    });
    return svg(W, H + 20, out, "Línea del tiempo");
  };

  function tablaHTML(f) {
    var t = document.createElement("table");
    t.className = "fig-tabla";
    var thead = document.createElement("thead"), tr = document.createElement("tr");
    f.cab.forEach(function (c) { var th = document.createElement("th"); th.textContent = c; tr.appendChild(th); });
    thead.appendChild(tr); t.appendChild(thead);
    var tb = document.createElement("tbody");
    f.filas.forEach(function (fila) {
      var r = document.createElement("tr");
      fila.forEach(function (c) { var td = document.createElement("td"); td.textContent = c; r.appendChild(td); });
      tb.appendChild(r);
    });
    t.appendChild(tb);
    return t;
  }

  // Dibuja la figura dentro de un contenedor. Devuelve true si dibujó algo.
  function dibujar(fig, cont) {
    cont.innerHTML = "";
    if (!fig) return false;
    var lista = Array.isArray(fig) ? fig : [fig];
    lista.forEach(function (f) {
      if (f.tipo === "tabla") { cont.appendChild(tablaHTML(f)); return; }
      var fn = D[f.tipo];
      if (!fn) return;
      var div = document.createElement("div");
      div.className = "fig-caja";
      if (f.tam) div.style.maxWidth = Math.round(520 * f.tam) + "px";   // para mostrar figuras de distinto tamaño
      div.innerHTML = fn(f);   // el SVG se arma con esc() en todos los textos
      cont.appendChild(div);
    });
    return true;
  }

  window.Figuras = { dibujar: dibujar, _svg: D };
})();
