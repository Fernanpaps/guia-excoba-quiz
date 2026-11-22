// ============================================================
//  Generadores de ejercicios con números al azar
//  Cada vez que sale uno de estos ejercicios, los números cambian,
//  así se practica el MÉTODO y no se memoriza la respuesta.
//
//  generador(materia, id, tema, nivel, tipo, funcion)
//  La función devuelve una pregunta normal: { q, r, campos, u, rm, tol, fig, e, err }.
//  En el banco se guarda un "lugar" { gen: id } que app.js convierte en
//  un ejercicio nuevo cada vez que lo prepara.
// ============================================================
window.GENERADORES = {};

var G = (function () {
  "use strict";
  function ent(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function elegir(lista) { return lista[Math.floor(Math.random() * lista.length)]; }
  function mcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }
  function mcm(a, b) { return a / mcd(a, b) * b; }
  function simp(n, d) { var g = mcd(n, d); if (d < 0) { n = -n; d = -d; } return [n / g, d / g]; }
  function fr(n, d) { var s = simp(n, d); return s[1] === 1 ? String(s[0]) : s[0] + "/" + s[1]; }
  function r2(x) { return Math.round(x * 100) / 100; }
  function r1(x) { return Math.round(x * 10) / 10; }
  function f(x) { // número bonito para mostrar (con signo menos correcto)
    var s = String(r2(x));
    return s.replace("-", "−");
  }
  function par(x) { return x < 0 ? "(" + f(x) + ")" : f(x); }     // pone paréntesis a negativos
  function signo(x) { return x < 0 ? "− " + f(-x) : "+ " + f(x); } // "+ 3" o "− 3"
  function fin(x) { return isFinite(x) && !isNaN(x); }
  // Exponente bonito: sup(-4) → "⁻⁴"
  function sup(n) { var m = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" }; return String(n).split("").map(function (c) { return m[c] || c; }).join(""); }
  return { sup: sup, ent: ent, elegir: elegir, mcd: mcd, mcm: mcm, simp: simp, fr: fr, r2: r2, r1: r1, f: f, par: par, signo: signo, fin: fin };
})();

function generador(materia, id, tema, nivel, tipo, fn) {
  window.GENERADORES[id] = { materia: materia, t: tema, n: nivel, tipo: tipo, f: fn };
  agregarPreguntas(materia, [{ gen: id, t: tema, n: nivel, tipo: tipo, q: "🎲 Ejercicio generado", e: "" }]);
}

// ============================================================
//  MATEMÁTICAS
// ============================================================
(function () {
  var M = "matematicas";

  generador(M, "frac3", "Fracciones", 2, "num", function () {
    var dens = [2, 3, 4, 5, 6, 8, 10, 12], d = [G.elegir(dens), G.elegir(dens), G.elegir(dens)];
    var n = d.map(function (x) { return G.ent(1, x - 1); });
    var s = [G.elegir([1, 1, -1]), G.elegir([1, -1])];
    var L = G.mcm(G.mcm(d[0], d[1]), d[2]);
    var conv = n.map(function (x, i) { return x * L / d[i]; });
    var num = conv[0] + s[0] * conv[1] + s[1] * conv[2];
    var op = function (k) { return s[k] > 0 ? " + " : " − "; };
    return {
      q: "Resuelve y escribe el resultado como fracción simplificada (o decimal):\n" + n[0] + "/" + d[0] + op(0) + n[1] + "/" + d[1] + op(1) + n[2] + "/" + d[2],
      r: num / L, rm: G.fr(num, L),
      e: "1) Denominador común (mcm de " + d.join(", ") + "): " + L + "\n2) Convierte cada fracción: " + conv.map(function (c, i) { return n[i] + "/" + d[i] + " = " + c + "/" + L; }).join(", ") +
         "\n3) Opera los numeradores: " + conv[0] + op(0) + conv[1] + op(1) + conv[2] + " = " + num + "\n4) Resultado: " + num + "/" + L + (G.fr(num, L) !== num + "/" + L ? " = " + G.fr(num, L) : ""),
      err: "Sumar numeradores y denominadores por separado. Siempre convierte primero al mismo denominador."
    };
  });

  generador(M, "fracmix", "Fracciones", 3, "num", function () {
    var a = G.ent(1, 5), b = G.ent(a + 1, 9), c = G.ent(1, 5), d = G.ent(c + 1, 9), e = G.ent(1, 7), g = G.ent(2, 9);
    // (a/b − c/d) × e/g
    var n1 = a * d - c * b, d1 = b * d;
    var nf = n1 * e, df = d1 * g;
    return {
      q: "Resuelve respetando el paréntesis:\n(" + a + "/" + b + " − " + c + "/" + d + ") × " + e + "/" + g,
      r: nf / df, rm: G.fr(nf, df),
      e: "1) Primero el paréntesis: " + a + "/" + b + " − " + c + "/" + d + " = " + (a * d) + "/" + d1 + " − " + (c * b) + "/" + d1 + " = " + n1 + "/" + d1 +
         "\n2) Multiplica: (" + n1 + "/" + d1 + ") × (" + e + "/" + g + ") = " + nf + "/" + df + "\n3) Simplifica: " + G.fr(nf, df),
      err: "Multiplicar antes de resolver el paréntesis, o restar mal cuando el resultado sale negativo."
    };
  });

  generador(M, "jerarquia", "Decimales y jerarquía de operaciones", 2, "num", function () {
    var c = G.ent(3, 9), dd = G.ent(1, c - 1), base = c - dd, cuad = base * base;
    var b = G.ent(2, 6), e = G.elegir([2, 3, 4, 6].filter(function (k) { return (b * cuad) % k === 0; }).concat([1]));
    if ((b * cuad) % e !== 0) e = 1;
    var a = G.ent(2, 20);
    var res = a + b * cuad / e;
    return {
      q: "Resuelve respetando la jerarquía de operaciones:\n" + a + " + " + b + " × (" + c + " − " + dd + ")² ÷ " + e,
      r: res,
      e: "Orden: paréntesis → potencias → × y ÷ (de izquierda a derecha) → + y −\n1) (" + c + " − " + dd + ") = " + base + "\n2) " + base + "² = " + cuad +
         "\n3) " + b + " × " + cuad + " = " + (b * cuad) + " y luego ÷ " + e + " = " + (b * cuad / e) + "\n4) " + a + " + " + (b * cuad / e) + " = " + res,
      err: "Sumar primero " + a + " + " + b + ": la suma va al final."
    };
  });

  generador(M, "descuentoiva", "Porcentajes y regla de 3", 3, "num", function () {
    var p = G.ent(4, 40) * 50, d = G.elegir([10, 15, 20, 25, 30, 40]);
    var conDesc = p * (1 - d / 100), total = G.r2(conDesc * 1.16);
    return {
      q: "Un artículo cuesta $" + p + " antes de impuestos. Tiene " + d + "% de descuento y después se le agrega el 16% de IVA. ¿Cuánto pagas?",
      r: total, u: "pesos", tol: 0.05,
      e: "1) Con descuento pagas el " + (100 - d) + "%: " + p + " × " + G.f((100 - d) / 100) + " = " + G.f(conDesc) +
         "\n2) Más IVA (16%): " + G.f(conDesc) + " × 1.16 = " + G.f(total) + "\nResultado: $" + G.f(total),
      err: "Restar " + d + "% y sumar 16% al mismo tiempo (" + (16 - d) + "%): cada porcentaje se aplica sobre una cantidad distinta."
    };
  });

  generador(M, "r3inversa", "Porcentajes y regla de 3", 2, "num", function () {
    var x1 = G.elegir([2, 3, 4, 5, 6, 8, 10, 12]), t = G.elegir([6, 8, 9, 10, 12, 15, 18, 20, 24, 30]);
    var total = x1 * t, cand = [];
    for (var k = 2; k <= 30; k++) if (k !== x1 && total % k === 0) cand.push(k);
    var x2 = G.elegir(cand), res = total / x2;
    var ctx = G.elegir([["pintores", "días", "pintar una escuela"], ["llaves iguales", "horas", "llenar un tanque"], ["máquinas", "horas", "terminar un pedido"]]);
    return {
      q: x1 + " " + ctx[0] + " tardan " + t + " " + ctx[1] + " en " + ctx[2] + ". ¿Cuántas " + ctx[1] + " tardarán " + x2 + " " + ctx[0] + "?",
      r: res, u: ctx[1],
      e: "Más " + ctx[0] + " → menos " + ctx[1] + ": regla de 3 INVERSA (se multiplica en línea).\nFórmula: x = (" + x1 + " × " + t + ") ÷ " + x2 +
         "\nSustitución: x = " + total + " ÷ " + x2 + "\nResultado: " + res + " " + ctx[1],
      err: "Multiplicar en cruz (" + t + " × " + x2 + " ÷ " + x1 + "): eso es regla de 3 directa y aquí la relación es inversa."
    };
  });

  generador(M, "r3compuesta", "Porcentajes y regla de 3", 3, "num", function () {
    var m1 = G.elegir([2, 3, 4, 5, 6]), h1 = G.elegir([4, 5, 6, 8, 10]), p1 = m1 * h1 * G.ent(5, 20);
    var m2 = G.elegir([2, 3, 4, 6, 8, 9, 10]), h2 = G.elegir([3, 4, 5, 6, 8, 12]);
    var res = p1 * m2 * h2 / (m1 * h1);
    return {
      q: m1 + " impresoras hacen " + p1 + " copias en " + h1 + " minutos. ¿Cuántas copias harán " + m2 + " impresoras en " + h2 + " minutos?",
      r: res, u: "copias",
      e: "Compara cada dato con las copias:\n• Impresoras " + m1 + " → " + m2 + ": directa → × " + m2 + "/" + m1 + "\n• Minutos " + h1 + " → " + h2 + ": directa → × " + h2 + "/" + h1 +
         "\nx = " + p1 + " × " + m2 + "/" + m1 + " × " + h2 + "/" + h1 + " = " + G.f(res) + " copias",
      err: "Hacer solo una regla de 3 con un dato y olvidar el otro."
    };
  });

  generador(M, "ecuacion", "Ecuaciones lineales", 2, "num", function () {
    var x = G.ent(-6, 9), a = G.ent(2, 6), b = G.ent(1, 7), c = G.ent(-9, 9), d = G.ent(1, a - 1 || 1);
    if (d >= a) d = a - 1; if (d < 1) { a = 3; d = 1; }
    var e = a * (x - b) + c - d * x;
    return {
      q: "Resuelve la ecuación:\n" + a + "(x − " + b + ") " + G.signo(c) + " = " + (d === 1 ? "" : d) + "x " + G.signo(e),
      campos: ["x ="], r: [x],
      e: "1) Quita el paréntesis: " + a + "x − " + (a * b) + " " + G.signo(c) + " = " + d + "x " + G.signo(e) +
         "\n2) Junta: " + a + "x − " + d + "x = " + G.f(e) + " + " + (a * b) + " " + G.signo(-c) +
         "\n3) " + (a - d) + "x = " + G.f(e + a * b - c) + "\n4) x = " + G.f(e + a * b - c) + " ÷ " + (a - d) + " = " + x,
      err: "Multiplicar solo la x por " + a + " y no el " + b + " del paréntesis, o no cambiar el signo al pasar términos."
    };
  });

  generador(M, "sistema", "Sistemas de ecuaciones lineales", 2, "num", function () {
    var x = G.ent(-5, 8), y = G.ent(-5, 8), a = G.ent(1, 5), b = G.ent(1, 5), c = G.ent(1, 5), d = -G.ent(1, 4);
    if (a * d - b * c === 0) d -= 1;
    var e1 = a * x + b * y, e2 = c * x + d * y;
    var det = a * d - b * c;
    return {
      q: "Resuelve el sistema:\n" + a + "x + " + b + "y = " + G.f(e1) + "\n" + c + "x − " + (d === -1 ? "" : -d) + "y = " + G.f(e2),
      campos: ["x =", "y ="], r: [x, y],
      e: "Por determinantes (regla de Cramer):\nΔ = (" + a + ")(" + d + ") − (" + b + ")(" + c + ") = " + det +
         "\nx = [(" + G.f(e1) + ")(" + d + ") − (" + b + ")(" + G.f(e2) + ")] / " + det + " = " + x +
         "\ny = [(" + a + ")(" + G.f(e2) + ") − (" + G.f(e1) + ")(" + c + ")] / " + det + " = " + y +
         "\nComprueba en la primera: " + a + "(" + x + ") + " + b + "(" + y + ") = " + G.f(e1) + " ✔\n(También puedes resolverlo por suma y resta o sustitución.)",
      err: "Encontrar x y no sustituir para encontrar y, o equivocarte con los signos negativos."
    };
  });

  generador(M, "cuadratica", "Ecuación de segundo grado (fórmula general)", 2, "num", function () {
    var r1 = G.ent(-7, 6), r2 = G.ent(r1 + 1, 8), a = G.elegir([1, 1, 2]);
    var b = -a * (r1 + r2), c = a * r1 * r2, disc = b * b - 4 * a * c;
    var termino = function (k, txt) { return k === 0 ? "" : (k < 0 ? " − " : " + ") + (Math.abs(k) === 1 && txt ? "" : Math.abs(k)) + txt; };
    return {
      q: "Resuelve con la fórmula general. Escribe primero la solución menor.\n" + (a === 1 ? "" : a) + "x²" + termino(b, "x") + termino(c, "") + " = 0",
      campos: ["x₁ =", "x₂ ="], r: [r1, r2],
      e: "a = " + a + ", b = " + b + ", c = " + c + "\nFórmula: x = [−b ± √(b² − 4ac)] / 2a\nDiscriminante: (" + b + ")² − 4(" + a + ")(" + c + ") = " + disc +
         "\n√" + disc + " = " + Math.sqrt(disc) + "\nx = [" + (-b) + " ± " + Math.sqrt(disc) + "] / " + (2 * a) + " → x₁ = " + r1 + ", x₂ = " + r2,
      err: "Equivocarte con −b cuando b es negativo, o con −4ac cuando c es negativo."
    };
  });

  generador(M, "recta2p", "Función lineal", 3, "num", function () {
    var m = G.elegir([-3, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 3]), b = G.ent(-4, 4);
    var x1 = G.ent(-3, 0), x2 = x1 + G.elegir([2, 4]);
    var y1 = m * x1 + b, y2 = m * x2 + b;
    var ys = [y1, y2, b, m * -4 + b, m * 5 + b];
    var ymin = Math.floor(Math.min.apply(null, ys)) - 1, ymax = Math.ceil(Math.max.apply(null, ys)) + 1;
    return {
      q: "La recta pasa por los puntos marcados. Escribe su pendiente y su ordenada al origen.",
      fig: { tipo: "grafica", ejes: ["x", "y"], x: [-4, 5], y: [Math.max(ymin, -12), Math.min(ymax, 14)], pasoX: 1, lineas: [[[-4, m * -4 + b], [5, m * 5 + b]]],
             puntos: [[x1, y1, "(" + G.f(x1) + ", " + G.f(y1) + ")"], [x2, y2, "(" + G.f(x2) + ", " + G.f(y2) + ")"]] },
      campos: ["m =", "b ="], r: [m, b],
      e: "Fórmula: m = (y₂ − y₁) / (x₂ − x₁)\nSustitución: m = (" + G.f(y2) + " − " + G.par(y1) + ") / (" + G.f(x2) + " − " + G.par(x1) + ") = " + G.f(y2 - y1) + " / " + (x2 - x1) + " = " + G.f(m) +
         "\nOrdenada: y = mx + b → " + G.f(y1) + " = " + G.f(m) + "(" + G.f(x1) + ") + b → b = " + G.f(b) + "\nRecta: y = " + G.f(m) + "x " + G.signo(b),
      err: "Restar mal con negativos o poner (x₂ − x₁) arriba."
    };
  });

  generador(M, "distancia", "Función lineal", 2, "num", function () {
    var t = G.elegir([[3, 4, 5], [6, 8, 10], [5, 12, 13], [8, 6, 10], [4, 3, 5]]);
    var x1 = G.ent(-5, 3), y1 = G.ent(-5, 3), sx = G.elegir([1, -1]), sy = G.elegir([1, -1]);
    var x2 = x1 + sx * t[0], y2 = y1 + sy * t[1];
    return {
      q: "Calcula la distancia entre los puntos P(" + G.f(x1) + ", " + G.f(y1) + ") y Q(" + G.f(x2) + ", " + G.f(y2) + ").",
      r: t[2],
      e: "Fórmula: d = √[(x₂ − x₁)² + (y₂ − y₁)²]\nSustitución: d = √[(" + G.f(x2) + " − " + G.par(x1) + ")² + (" + G.f(y2) + " − " + G.par(y1) + ")²] = √[" + (x2 - x1) * (x2 - x1) + " + " + (y2 - y1) * (y2 - y1) + "]" +
         "\nResultado: d = √" + t[2] * t[2] + " = " + t[2],
      err: "Restar mal cuando hay negativos: 2 − (−3) = 5."
    };
  });

  generador(M, "vertice", "Parábolas", 2, "num", function () {
    var a = G.elegir([1, -1, 2]), h = G.ent(-3, 3), k = G.ent(-4, 4);
    var b = -2 * a * h, c = a * h * h + k;
    var tx = function (v, s) { return v === 0 ? "" : (v < 0 ? " − " : " + ") + (Math.abs(v) === 1 && s ? "" : Math.abs(v)) + s; };
    var pts = []; for (var x = h - 3; x <= h + 3 + 1e-9; x += 0.25) pts.push([x, a * (x - h) * (x - h) + k]);
    var ys = pts.map(function (p) { return p[1]; });
    return {
      q: "Encuentra el vértice de la parábola y = " + (a === 1 ? "" : a === -1 ? "−" : a) + "x²" + tx(b, "x") + tx(c, ""),
      fig: { tipo: "grafica", ejes: ["x", "y"], x: [h - 3, h + 3], y: [Math.floor(Math.min.apply(null, ys)) - 1, Math.ceil(Math.max.apply(null, ys)) + 1], pasoX: 1, lineas: [pts] },
      campos: ["x =", "y ="], r: [h, k],
      e: "Fórmula: x del vértice = −b / 2a\nSustitución: x = −(" + b + ") / (2 × " + a + ") = " + h + "\ny = " + a + "(" + h + ")² " + G.signo(b) + "(" + h + ") " + G.signo(c) + " = " + k +
         "\nVértice (" + h + ", " + k + "). " + (a > 0 ? "Abre hacia arriba (a > 0): es el punto más bajo." : "Abre hacia abajo (a < 0): es el punto más alto."),
      err: "Olvidar el signo menos en −b/2a."
    };
  });

  generador(M, "pitagoras", "Trigonometría (Pitágoras y funciones)", 2, "num", function () {
    var t = G.elegir([[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15]]), k = G.elegir([1, 1, 2]);
    var a = t[0] * k, b = t[1] * k, c = t[2] * k, busca = G.elegir(["c", "a"]);
    return {
      q: busca === "c" ? "Calcula la hipotenusa del triángulo rectángulo." : "Calcula el cateto que falta del triángulo rectángulo.",
      fig: { tipo: "triangulo", pts: [[0, 0], [b, 0], [b, a]], v: ["A", "B", "C"], lados: [busca === "a" ? "?" : String(a), busca === "c" ? "?" : String(c), String(b)], recto: 1 },
      r: busca === "c" ? c : a,
      e: busca === "c"
        ? "Fórmula: c² = a² + b²\nSustitución: c² = " + a + "² + " + b + "² = " + a * a + " + " + b * b + " = " + c * c + "\nResultado: c = √" + c * c + " = " + c
        : "Fórmula: a² = c² − b² (la hipotenusa es " + c + ")\nSustitución: a² = " + c + "² − " + b + "² = " + c * c + " − " + b * b + " = " + a * a + "\nResultado: a = √" + a * a + " = " + a,
      err: busca === "c" ? "Olvidar sacar la raíz cuadrada al final." : "Sumar los cuadrados: para un cateto se RESTA (hipotenusa² − otro cateto²)."
    };
  });

  generador(M, "trigbasica", "Trigonometría (Pitágoras y funciones)", 2, "num", function () {
    var ang = G.elegir([30, 45, 60]), s = { 30: 0.5, 45: 0.707, 60: 0.866 }[ang], co = { 30: 0.866, 45: 0.707, 60: 0.5 }[ang];
    var H = G.ent(4, 20), op = G.elegir(["opuesto", "adyacente"]);
    var val = op === "opuesto" ? H * s : H * co;
    var ady = H * co, opu = H * s;
    return {
      q: "La hipotenusa mide " + H + " y el ángulo A mide " + ang + "°. Calcula el cateto " + op + " a A. (sen " + ang + "° ≈ " + s + ", cos " + ang + "° ≈ " + co + "). Redondea a décimas.",
      fig: { tipo: "triangulo", pts: [[0, 0], [ady, 0], [ady, opu]], v: ["A", "B", "C"], lados: [op === "opuesto" ? "x" : "", String(H), op === "adyacente" ? "x" : ""], ang: [ang + "°", "", ""], recto: 1 },
      r: G.r2(val), tol: 0.12,
      e: "Fórmula: " + (op === "opuesto" ? "sen A = opuesto / hipotenusa → opuesto = H × sen A" : "cos A = adyacente / hipotenusa → adyacente = H × cos A") +
         "\nSustitución: x = " + H + " × " + (op === "opuesto" ? s : co) + "\nResultado: x ≈ " + G.r1(val),
      err: "Usar seno para el adyacente o coseno para el opuesto. Recuerda: SOH-CAH-TOA."
    };
  });

  var SEN = function (g) { return Math.sin(g * Math.PI / 180); }, COS = function (g) { return Math.cos(g * Math.PI / 180); };
  generador(M, "leysenos", "Trigonometría (Pitágoras y funciones)", 3, "num", function () {
    var A = G.ent(30, 70), B = G.ent(35, 80); if (A + B > 150) B = 150 - A;
    var a = G.ent(6, 20), sA = Math.round(SEN(A) * 1000) / 1000, sB = Math.round(SEN(B) * 1000) / 1000;
    var b = a * sB / sA, C = 180 - A - B;
    // vértices aproximados para el dibujo
    var c = a * SEN(C) / SEN(A), pts = [[0, 0], [c, 0], [b * COS(A), b * SEN(A)]];
    return {
      q: "En el triángulo, A = " + A + "°, B = " + B + "° y a = " + a + ". Calcula el lado b con la ley de senos. (sen " + A + "° ≈ " + sA + ", sen " + B + "° ≈ " + sB + "). Redondea a décimas.",
      fig: { tipo: "triangulo", pts: pts, v: ["A", "B", "C"], lados: ["a = " + a, "b = ?", ""], ang: [A + "°", B + "°", ""] },
      r: G.r2(b), tol: Math.max(0.15, b * 0.01),
      e: "Fórmula: a / sen A = b / sen B → b = a × sen B / sen A\nSustitución: b = " + a + " × " + sB + " / " + sA + " = " + G.f(a * sB) + " / " + sA + "\nResultado: b ≈ " + G.r1(b),
      err: "Poner los senos al revés (b = a × sen A / sen B). Cada lado va con el seno de su ángulo OPUESTO."
    };
  });

  generador(M, "leycosenos", "Trigonometría (Pitágoras y funciones)", 3, "num", function () {
    var b = G.ent(4, 15), c = G.ent(4, 15), A = G.elegir([40, 50, 70, 80, 100, 110, 120]), cA = Math.round(COS(A) * 1000) / 1000;
    var a2 = b * b + c * c - 2 * b * c * cA, a = Math.sqrt(a2);
    return {
      q: "En el triángulo, b = " + b + ", c = " + c + " y el ángulo A = " + A + "°. Calcula el lado a con la ley de cosenos. (cos " + A + "° ≈ " + cA + "). Redondea a décimas.",
      fig: { tipo: "triangulo", pts: [[0, 0], [c, 0], [b * COS(A), b * SEN(A)]], v: ["A", "B", "C"], lados: ["a = ?", "b = " + b, "c = " + c], ang: [A + "°", "", ""] },
      r: G.r2(a), tol: Math.max(0.15, a * 0.01),
      e: "Fórmula: a² = b² + c² − 2bc·cos A\nSustitución: a² = " + b * b + " + " + c * c + " − 2(" + b + ")(" + c + ")(" + cA + ") = " + G.f(a2) +
         "\nResultado: a = √" + G.f(a2) + " ≈ " + G.r1(a) + (cA < 0 ? "\n(Como el ángulo es mayor de 90°, el coseno es negativo y el término se SUMA.)" : ""),
      err: cA < 0 ? "No darte cuenta de que el coseno de un ángulo obtuso es negativo (− × − = +)." : "Olvidar el término −2bc·cos A (eso sería Pitágoras)."
    };
  });

  generador(M, "areaL", "Geometría (áreas y volúmenes)", 2, "num", function () {
    var W = G.ent(7, 14), h1 = G.ent(2, 5), w2 = G.ent(2, W - 3), H = h1 + G.ent(2, 6);
    var area = W * h1 + w2 * (H - h1), per = 2 * (W + H), pide = G.elegir(["área", "perímetro"]);
    return {
      q: "Calcula el " + pide + " de la figura (medidas en metros).",
      fig: { tipo: "poligono", pts: [[0, 0], [W, 0], [W, h1], [w2, h1], [w2, H], [0, H]], cortes: pide === "área" ? [[[0, h1], [w2, h1]]] : [],
             cotas: [[[0, 0], [W, 0], String(W)], [[W, 0], [W, h1], String(h1)], [[w2, H], [0, H], String(w2)], [[0, H], [0, 0], String(H)]] },
      r: pide === "área" ? area : per, u: pide === "área" ? "m²" : "m",
      e: pide === "área"
        ? "Divide en dos rectángulos (línea punteada):\n• Abajo: " + W + " × " + h1 + " = " + W * h1 + " m²\n• Arriba: " + w2 + " × " + (H - h1) + " = " + w2 * (H - h1) + " m²\nTotal = " + area + " m²\n(La altura de arriba es " + H + " − " + h1 + " = " + (H - h1) + ")"
        : "Los lados que no se dan se deducen:\n• Lado horizontal de en medio: " + W + " − " + w2 + " = " + (W - w2) + "\n• Lado vertical de en medio: " + H + " − " + h1 + " = " + (H - h1) +
          "\nPerímetro = " + W + " + " + h1 + " + " + (W - w2) + " + " + (H - h1) + " + " + w2 + " + " + H + " = " + per + " m",
      err: pide === "área" ? "Multiplicar " + W + " × " + H + ": eso incluye un pedazo que no es parte de la figura." : "Olvidar los lados que no tienen medida escrita: hay que deducirlos restando."
    };
  });

  generador(M, "volumen", "Geometría (áreas y volúmenes)", 2, "num", function () {
    var r = G.ent(2, 9), h = G.ent(3, 15), cuerpo = G.elegir(["cilindro", "cono"]);
    var base = 3.14 * r * r, v = cuerpo === "cilindro" ? base * h : base * h / 3;
    return {
      q: "Calcula el volumen de un " + cuerpo + " de radio " + r + " cm y altura " + h + " cm. (π = 3.14)",
      r: G.r2(v), tol: 0.06, u: "cm³",
      e: "Fórmula: V = área de la base × altura" + (cuerpo === "cono" ? " ÷ 3" : "") + "\nBase: π r² = 3.14 × " + r + "² = " + G.f(base) + " cm²\nV = " + G.f(base) + " × " + h + (cuerpo === "cono" ? " ÷ 3" : "") + " = " + G.f(v) + " cm³",
      err: cuerpo === "cono" ? "Olvidar dividir entre 3." : "Usar 2πr (perímetro) como base en lugar de πr² (área)."
    };
  });

  generador(M, "barras", "Estadística", 3, "num", function () {
    var cal = [6, 7, 8, 9, 10], fr, max, veces;
    do { fr = cal.map(function () { return G.ent(1, 9); }); max = Math.max.apply(null, fr); veces = fr.filter(function (x) { return x === max; }).length; } while (veces > 1);
    var n = fr.reduce(function (s, x) { return s + x; }, 0), suma = fr.reduce(function (s, x, i) { return s + x * cal[i]; }, 0);
    var media = suma / n, moda = cal[fr.indexOf(max)];
    return {
      q: "La gráfica muestra las calificaciones de un grupo. Escribe la moda y la media (redondea a centésimas).",
      fig: { tipo: "barras", etq: cal.map(String), val: fr, ejeY: "Alumnos" },
      campos: ["Moda =", "Media ="], r: [moda, G.r2(media)], tol: 0.02,
      e: "Moda: la barra más alta → " + moda + "\nMedia: x̄ = Σ(x·f) / Σf\nΣ(x·f) = " + fr.map(function (x, i) { return cal[i] + "·" + x; }).join(" + ") + " = " + suma +
         "\nΣf = " + n + "\nx̄ = " + suma + " / " + n + " ≈ " + G.f(media),
      err: "Promediar las 5 calificaciones sin multiplicarlas por cuántos alumnos sacaron cada una."
    };
  });

  generador(M, "mediana", "Estadística", 2, "num", function () {
    var n = G.ent(6, 9), datos = []; for (var i = 0; i < n; i++) datos.push(G.ent(1, 30));
    var o = datos.slice().sort(function (a, b) { return a - b; });
    var med = n % 2 ? o[(n - 1) / 2] : (o[n / 2 - 1] + o[n / 2]) / 2;
    return {
      q: "Calcula la mediana de los datos:\n" + datos.join(", "),
      r: med,
      e: "1) Ordena: " + o.join(", ") + "\n2) Son " + n + " datos (" + (n % 2 ? "impar → el de en medio, posición " + (n + 1) / 2 : "par → promedio de los dos de en medio") + ")" +
         "\nMediana = " + (n % 2 ? med : "(" + o[n / 2 - 1] + " + " + o[n / 2] + ") / 2 = " + med),
      err: "Tomar el dato de en medio SIN ordenar primero."
    };
  });

  generador(M, "probbolsa", "Probabilidad", 3, "num", function () {
    var r = G.ent(2, 8), a = G.ent(2, 8), v = G.ent(1, 6), t = r + a + v, tipo = G.elegir(["no", "dos"]);
    if (tipo === "no") return {
      q: "Una bolsa tiene " + r + " canicas rojas, " + a + " azules y " + v + " verdes. Si sacas una al azar, ¿cuál es la probabilidad de que NO sea roja?",
      r: (a + v) / t, rm: G.fr(a + v, t),
      e: "No roja = azul o verde = " + a + " + " + v + " = " + (a + v) + "\nTotal = " + t + "\nP = " + (a + v) + "/" + t + (G.fr(a + v, t) !== (a + v) + "/" + t ? " = " + G.fr(a + v, t) : "") + "\n(También: 1 − P(roja) = 1 − " + r + "/" + t + ")",
      err: "Calcular la probabilidad de que SÍ sea roja."
    };
    return {
      q: "Una bolsa tiene " + r + " canicas rojas, " + a + " azules y " + v + " verdes. Sacas una, la REGRESAS y sacas otra. ¿Cuál es la probabilidad de que las dos sean azules?",
      r: (a * a) / (t * t), rm: G.fr(a * a, t * t),
      e: "\"Y\" con reemplazo → se multiplica: P = (" + a + "/" + t + ") × (" + a + "/" + t + ") = " + a * a + "/" + t * t + (G.fr(a * a, t * t) !== a * a + "/" + t * t ? " = " + G.fr(a * a, t * t) : ""),
      err: "Sumar las probabilidades. Para que pasen las DOS cosas se multiplican."
    };
  });

  generador(M, "conteo", "Conteo (permutaciones y combinaciones)", 2, "num", function () {
    var n = G.ent(5, 10), k = G.ent(2, 4), perm = G.elegir([true, false]);
    var p = 1; for (var i = 0; i < k; i++) p *= (n - i);
    var fk = 1; for (var j = 2; j <= k; j++) fk *= j;
    var res = perm ? p : p / fk;
    var prods = []; for (var q = 0; q < k; q++) prods.push(n - q);
    return {
      q: perm ? "En un concurso con " + n + " participantes se premian " + k + " lugares distintos (1°, 2°…). ¿De cuántas formas se pueden repartir?"
              : "¿Cuántos equipos de " + k + " personas se pueden formar con " + n + " personas?",
      r: res,
      e: (perm ? "Importa el orden → permutación.\nFórmula: nPr = n! / (n − r)!\n" + n + "P" + k + " = " + prods.join(" × ") + " = " + res
               : "No importa el orden → combinación.\nFórmula: nCr = n! / [r!(n − r)!]\n" + n + "C" + k + " = (" + prods.join(" × ") + ") / " + k + "! = " + p + " / " + fk + " = " + res),
      err: perm ? "Dividir entre r!: eso es para combinaciones, cuando el orden no importa." : "No dividir entre r!: en un equipo da igual el orden en que se elige a cada persona."
    };
  });

  generador(M, "sucesion", "Sucesiones", 2, "alg", function () {
    var d = G.elegir([-4, -3, -2, 2, 3, 4, 5, 6, 7]), a1 = G.ent(-6, 10), b = a1 - d;
    var terms = [0, 1, 2, 3].map(function (i) { return a1 + i * d; });
    var regla = d + "n" + (b === 0 ? "" : (b > 0 ? "+" : "") + b);
    return {
      q: "Escribe la regla general (término n-ésimo) de la sucesión:\n" + terms.map(G.f).join(", ") + ", …",
      r: regla, rm: G.f(d) + "n " + (b === 0 ? "" : G.signo(b)),
      e: "1) Diferencia común: d = " + G.f(d) + " → la regla tiene " + G.f(d) + "n\n2) Fórmula: aₙ = a₁ + (n − 1)d = " + G.f(a1) + " + (n − 1)(" + G.f(d) + ")\n3) Simplifica: aₙ = " + G.f(d) + "n " + (b === 0 ? "" : G.signo(b)) +
         "\nComprueba con n = 1: " + G.f(d) + " " + (b === 0 ? "" : G.signo(b)) + " = " + G.f(a1) + " ✔",
      err: "Escribir solo " + G.f(d) + "n y olvidar ajustar con el primer término."
    };
  });

  generador(M, "binomio", "Productos notables", 3, "alg", function () {
    var p = G.ent(1, 5), q = G.ent(1, 5), s = G.elegir([1, -1]), v = G.elegir([["x", "y"], ["a", "b"], ["m", "n"]]);
    var A = p * p, B = 2 * p * q, C = q * q;
    var pr = function (k, x) { return (k === 1 ? "" : k) + x; };
    return {
      q: "Desarrolla:\n(" + pr(p, v[0]) + (s > 0 ? " + " : " − ") + pr(q, v[1]) + ")²",
      r: A + v[0] + "^2" + (s > 0 ? "+" : "-") + B + v[0] + v[1] + "+" + C + v[1] + "^2",
      rm: pr(A, v[0]) + "^2 " + (s > 0 ? "+ " : "− ") + B + v[0] + v[1] + " + " + pr(C, v[1]) + "^2",
      e: "Fórmula: (a " + (s > 0 ? "+" : "−") + " b)² = a² " + (s > 0 ? "+" : "−") + " 2ab + b²\na = " + pr(p, v[0]) + ", b = " + pr(q, v[1]) +
         "\na² = " + pr(A, v[0]) + "²\n2ab = 2(" + pr(p, v[0]) + ")(" + pr(q, v[1]) + ") = " + B + v[0] + v[1] + "\nb² = " + pr(C, v[1]) + "²\nResultado: " + pr(A, v[0]) + "^2 " + (s > 0 ? "+ " : "− ") + B + v[0] + v[1] + " + " + pr(C, v[1]) + "^2",
      err: "Olvidar el término de en medio (2ab) o elevar al cuadrado solo la letra y no el número."
    };
  });

  generador(M, "exponentes", "Leyes de exponentes y signos", 3, "alg", function () {
    var k = G.ent(2, 4), a = G.ent(1, 4), b = G.elegir([-3, -2, -1, 1, 2, 3]), c = G.elegir([2, 3]), d = G.ent(1, 5);
    var coef = Math.pow(k, c), ex = a * c - d, ey = b * c;
    var ver = function (e) { return e === 1 ? "" : "^" + (e < 0 ? "(" + e + ")" : e); };
    var bon = function (e) { return e === 1 ? "" : G.sup(e); };
    return {
      q: "Simplifica:\n(" + k + "x" + bon(a) + "y" + bon(b) + ")" + G.sup(c) + " ÷ x" + bon(d),
      r: coef + (ex === 0 ? "" : "x" + ver(ex)) + "y" + ver(ey),
      e: "1) Potencia de un producto: cada factor se eleva a " + c + ":\n   " + k + G.sup(c) + " = " + coef + "; (x" + bon(a) + ")" + G.sup(c) + " = x" + G.sup(a * c) + "; (y" + bon(b) + ")" + G.sup(c) + " = y" + G.sup(ey) +
         "\n2) División de misma base: se restan exponentes: x" + G.sup(a * c) + " ÷ x" + bon(d) + " = x" + G.sup(ex) + (ex === 0 ? " = 1" : "") +
         "\nResultado: " + coef + (ex === 0 ? "" : "x" + bon(ex)) + "y" + bon(ey) + "  → se escribe " + coef + (ex === 0 ? "" : "x" + ver(ex)) + "y" + ver(ey),
      err: "Sumar los exponentes al elevar una potencia: (x^" + a + ")^" + c + " = x^" + a * c + " (se MULTIPLICAN)."
    };
  });

  generador(M, "evalfuncion", "Cálculo y funciones", 2, "num", function () {
    var a = G.ent(-3, 4) || 1, b = G.ent(-6, 6), c = G.ent(-9, 9), x = G.ent(-4, 4);
    var val = a * x * x + b * x + c;
    return {
      q: "Si f(x) = " + (a === 1 ? "" : a === -1 ? "−" : a) + "x² " + G.signo(b) + "x " + G.signo(c) + ", ¿cuánto vale f(" + x + ")?",
      r: val,
      e: "Sustituye x por " + G.par(x) + ":\nf(" + x + ") = " + a + G.par(x) + "² " + G.signo(b) + G.par(x) + " " + G.signo(c) + " = " + a * x * x + " " + G.signo(b * x) + " " + G.signo(c) + " = " + val,
      err: "Elevar mal un negativo: (" + (x < 0 ? x : -2) + ")² es positivo."
    };
  });

  generador(M, "logexp", "Cálculo y funciones", 2, "num", function () {
    var b = G.elegir([2, 3, 5, 10]), k = G.ent(2, b === 10 ? 4 : b === 2 ? 7 : 4), v = Math.pow(b, k), modo = G.elegir(["log", "exp"]);
    return modo === "log"
      ? { q: "Calcula: log" + (b === 10 ? "" : " base " + b) + " (" + v + ")", r: k,
          e: "log_b(N) = ¿a qué potencia elevo b para obtener N?\n" + b + "^" + k + " = " + v + " → log = " + k, err: "Dividir " + v + " entre " + b + " en lugar de buscar la potencia." }
      : { q: "Resuelve la ecuación exponencial: " + b + "ˣ = " + v, campos: ["x ="], r: [k],
          e: "Escribe " + v + " como potencia de " + b + ": " + v + " = " + b + "^" + k + "\nSi las bases son iguales, los exponentes son iguales → x = " + k, err: "Dividir " + v + " ÷ " + b + " = " + v / b + " como si fuera una multiplicación." };
  });

  generador(M, "interes", "Matemáticas financieras", 2, "num", function () {
    var C = G.ent(2, 20) * 1000, i = G.elegir([2, 3, 4, 5, 6, 8, 10, 12]), t = G.ent(2, 12), anual = G.elegir([true, false]);
    var I = anual ? C * i / 100 * t / 12 : C * i / 100 * t;
    return {
      q: "Se invierten $" + C + " al " + i + "% de interés simple " + (anual ? "ANUAL" : "mensual") + " durante " + t + " meses. ¿Cuánto interés se gana?",
      r: G.r2(I), u: "pesos",
      e: "Fórmula: I = C × i × t (la tasa y el tiempo en la MISMA unidad)\n" + (anual ? "Tasa anual y tiempo en meses → t = " + t + "/12 años\n" : "") +
         "Sustitución: I = " + C + " × " + G.f(i / 100) + " × " + (anual ? t + "/12" : t) + "\nResultado: I = $" + G.f(I),
      err: anual ? "Usar t = " + t + " con una tasa anual: hay que pasar los meses a años." : "Usar la tasa como " + i + " en lugar de " + G.f(i / 100) + "."
    };
  });
})();
