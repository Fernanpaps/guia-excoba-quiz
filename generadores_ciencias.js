// ============================================================
//  Generadores de Física y Química (números al azar)
//  Usa las ayudas G y generador() definidas en generadores.js
// ============================================================

// ---------- FÍSICA ----------
(function () {
  var F = "fisica", g = 9.8;

  generador(F, "mru", "Movimiento rectilíneo uniforme (MRU)", 2, "num", function () {
    var v = G.ent(2, 30), t = G.ent(2, 20), d = v * t, pide = G.elegir(["v", "d", "t"]);
    var u = G.elegir([["m", "s", "m/s"], ["km", "h", "km/h"]]);
    var q = { v: "Un móvil recorre " + d + " " + u[0] + " en " + t + " " + u[1] + " con velocidad constante. ¿Cuál es su velocidad?",
              d: "Un móvil va a " + v + " " + u[2] + " constantes durante " + t + " " + u[1] + ". ¿Qué distancia recorre?",
              t: "¿Cuánto tarda en recorrer " + d + " " + u[0] + " un móvil que va a " + v + " " + u[2] + "?" }[pide];
    var res = { v: v, d: d, t: t }[pide];
    return {
      q: q, r: res, u: { v: u[2], d: u[0], t: u[1] }[pide],
      e: "Fórmula: v = d / t" + (pide === "d" ? " → d = v × t" : pide === "t" ? " → t = d / v" : "") +
         "\nSustitución: " + { v: "v = " + d + " / " + t, d: "d = " + v + " × " + t, t: "t = " + d + " / " + v }[pide] + "\nResultado: " + res + " " + { v: u[2], d: u[0], t: u[1] }[pide],
      err: "Despejar mal: si buscas t, se DIVIDE la distancia entre la velocidad."
    };
  });

  generador(F, "mrua", "Movimiento uniformemente acelerado (MUA)", 2, "num", function () {
    var v0 = G.elegir([0, 0, 2, 4, 5, 10]), a = G.ent(1, 6), t = G.ent(2, 10);
    var vf = v0 + a * t, d = v0 * t + a * t * t / 2;
    return {
      q: "Un coche " + (v0 ? "que va a " + v0 + " m/s" : "parte del reposo y") + " acelera a " + a + " m/s² durante " + t + " s. Calcula su velocidad final y la distancia que recorre.",
      campos: ["vf (m/s) =", "d (m) ="], r: [vf, d],
      e: "Datos: v₀ = " + v0 + " m/s" + (v0 ? "" : " (parte del reposo)") + ", a = " + a + " m/s², t = " + t + " s\n" +
         "1) vf = v₀ + a·t = " + v0 + " + " + a + "·" + t + " = " + vf + " m/s\n2) d = v₀·t + a·t²/2 = " + v0 + "·" + t + " + " + a + "·" + t + "²/2 = " + (v0 * t) + " + " + (a * t * t / 2) + " = " + d + " m",
      err: "Olvidar elevar el tiempo al cuadrado en d = a·t²/2" + (v0 ? ", o no sumar el término v₀·t." : ".")
    };
  });

  generador(F, "frenado", "Movimiento uniformemente acelerado (MUA)", 3, "num", function () {
    var v0 = G.elegir([10, 12, 15, 20, 24, 25, 30]), a = G.elegir([2, 3, 4, 5, 6].filter(function (k) { return (v0 * v0) % (2 * k) === 0; }));
    if (!a) a = 2;
    var d = v0 * v0 / (2 * a), t = v0 / a;
    return {
      q: "Un auto va a " + v0 + " m/s y frena con una desaceleración de " + a + " m/s² hasta detenerse. ¿Qué distancia recorre al frenar y cuánto tarda?",
      campos: ["d (m) =", "t (s) ="], r: [G.r2(d), G.r2(t)], tol: 0.02,
      e: "Se detiene → vf = 0. La aceleración es negativa: a = −" + a + " m/s².\n1) d = (vf² − v₀²) / 2a = (0 − " + v0 * v0 + ") / (2 × −" + a + ") = " + G.f(d) + " m\n2) t = (vf − v₀) / a = (0 − " + v0 + ") / (−" + a + ") = " + G.f(t) + " s",
      err: "Usar la aceleración positiva: sale una distancia negativa. Al frenar, a es negativa."
    };
  });

  generador(F, "caida", "Caída libre y tiro vertical", 2, "num", function () {
    var t = G.ent(1, 6), v = g * t, h = g * t * t / 2;
    return {
      q: "Se deja caer una piedra desde lo alto de un edificio y tarda " + t + " s en llegar al suelo. ¿Con qué velocidad llega y qué altura tiene el edificio? (g = 9.8 m/s²)",
      campos: ["v (m/s) =", "h (m) ="], r: [G.r2(v), G.r2(h)], tol: 0.05,
      e: "\"Se deja caer\" → v₀ = 0.\n1) v = g·t = 9.8 × " + t + " = " + G.f(v) + " m/s\n2) h = g·t²/2 = 9.8 × " + t + "² / 2 = 9.8 × " + t * t + " / 2 = " + G.f(h) + " m",
      err: "Calcular h = g·t (sin elevar el tiempo al cuadrado ni dividir entre 2)."
    };
  });

  generador(F, "tirovertical", "Caída libre y tiro vertical", 3, "num", function () {
    var v0 = G.elegir([9.8, 14.7, 19.6, 24.5, 29.4, 39.2, 49]), ts = v0 / g, hm = v0 * v0 / (2 * g);
    return {
      q: "Se lanza una pelota hacia arriba a " + G.f(v0) + " m/s. ¿Cuánto tarda en llegar al punto más alto y qué altura máxima alcanza? (g = 9.8 m/s²)",
      campos: ["t (s) =", "h máx (m) ="], r: [G.r2(ts), G.r2(hm)], tol: 0.05,
      e: "En el punto más alto la velocidad es 0.\n1) t = v₀ / g = " + G.f(v0) + " / 9.8 = " + G.f(ts) + " s\n2) h = v₀² / 2g = " + G.f(v0 * v0) + " / 19.6 = " + G.f(hm) + " m",
      err: "Pensar que arriba la aceleración es 0: lo que vale 0 es la VELOCIDAD; la gravedad sigue actuando."
    };
  });

  generador(F, "parabolico", "Movimiento parabólico", 3, "num", function () {
    var v0 = G.elegir([10, 20, 30, 40]), ang = G.elegir([30, 60]), s = ang === 30 ? 0.5 : 0.866, c = ang === 30 ? 0.866 : 0.5;
    var vx = v0 * c, vy = v0 * s, tv = 2 * vy / g, x = vx * tv;
    return {
      q: "Se patea un balón a " + v0 + " m/s con un ángulo de " + ang + "°. Calcula el tiempo de vuelo y el alcance horizontal. (sen " + ang + "° ≈ " + s + ", cos " + ang + "° ≈ " + c + ", g = 9.8 m/s²). Redondea a décimas.",
      campos: ["t vuelo (s) =", "alcance (m) ="], r: [G.r2(tv), G.r2(x)], tol: 0.25,
      e: "1) Componentes: v₀ₓ = " + v0 + " × " + c + " = " + G.f(vx) + " m/s; v₀ᵧ = " + v0 + " × " + s + " = " + G.f(vy) + " m/s\n2) Tiempo de vuelo: t = 2·v₀ᵧ / g = 2 × " + G.f(vy) + " / 9.8 = " + G.f(tv) + " s" +
         "\n3) Alcance: x = v₀ₓ · t = " + G.f(vx) + " × " + G.f(tv) + " ≈ " + G.r1(x) + " m",
      err: "Usar la velocidad total (" + v0 + " m/s) en lugar de sus componentes, o usar seno para la horizontal."
    };
  });

  generador(F, "newton", "Leyes de Newton", 2, "num", function () {
    var m = G.ent(2, 50), a = G.elegir([0.5, 1, 1.5, 2, 2.5, 3, 4, 5]), Fz = m * a, pide = G.elegir(["F", "a", "m"]);
    var txt = { F: "¿Qué fuerza neta se necesita para que un objeto de " + m + " kg acelere a " + a + " m/s²?",
                a: "Se aplica una fuerza neta de " + G.f(Fz) + " N a un objeto de " + m + " kg. ¿Qué aceleración adquiere?",
                m: "Una fuerza neta de " + G.f(Fz) + " N produce una aceleración de " + a + " m/s². ¿Cuál es la masa del objeto?" }[pide];
    var res = { F: Fz, a: a, m: m }[pide];
    return {
      q: txt, r: res, u: { F: "N", a: "m/s²", m: "kg" }[pide],
      e: "Fórmula: F = m·a" + { F: "", a: " → a = F / m", m: " → m = F / a" }[pide] + "\nSustitución: " + { F: "F = " + m + " × " + a, a: "a = " + G.f(Fz) + " / " + m, m: "m = " + G.f(Fz) + " / " + a }[pide] + "\nResultado: " + G.f(res),
      err: "Multiplicar cuando hay que dividir: despeja antes de sustituir."
    };
  });

  generador(F, "fuerzaneta", "Leyes de Newton", 3, "num", function () {
    var m = G.ent(5, 40), F1 = G.ent(20, 120), F2 = G.ent(5, F1 - 5), neta = F1 - F2, a = neta / m;
    return {
      q: "Sobre una caja de " + m + " kg se aplican dos fuerzas horizontales: " + F1 + " N hacia la derecha y " + F2 + " N hacia la izquierda. ¿Cuál es su aceleración? Redondea a centésimas.",
      r: G.r2(a), tol: 0.02, u: "m/s²",
      e: "1) Fuerzas en sentidos contrarios se RESTAN: F neta = " + F1 + " − " + F2 + " = " + neta + " N\n2) a = F neta / m = " + neta + " / " + m + " ≈ " + G.f(a) + " m/s²",
      err: "Sumar las fuerzas (" + (F1 + F2) + " N) aunque van en sentidos opuestos."
    };
  });

  generador(F, "energia", "Trabajo y energía", 2, "num", function () {
    var m = G.ent(1, 20), tipo = G.elegir(["c", "p", "cons"]);
    if (tipo === "c") { var v = G.ent(2, 20), Ec = 0.5 * m * v * v; return {
      q: "¿Cuál es la energía cinética de un objeto de " + m + " kg que se mueve a " + v + " m/s?", r: Ec, u: "J",
      e: "Fórmula: Ec = ½·m·v²\nSustitución: Ec = 0.5 × " + m + " × " + v + "² = 0.5 × " + m + " × " + v * v + "\nResultado: " + G.f(Ec) + " J", err: "Olvidar elevar la velocidad al cuadrado." }; }
    if (tipo === "p") { var h = G.ent(2, 40), Ep = m * g * h; return {
      q: "¿Cuál es la energía potencial de un objeto de " + m + " kg a " + h + " m de altura? (g = 9.8 m/s²)", r: G.r2(Ep), tol: 0.05, u: "J",
      e: "Fórmula: Ep = m·g·h\nSustitución: Ep = " + m + " × 9.8 × " + h + "\nResultado: " + G.f(Ep) + " J", err: "Usar la masa en gramos o olvidar multiplicar por g." }; }
    var h2 = G.elegir([5, 10, 20, 45, 80]), v2 = Math.sqrt(2 * 10 * h2);
    return {
      q: "Se suelta una pelota desde " + h2 + " m de altura. Sin fricción, ¿con qué velocidad llega al suelo? (usa g = 10 m/s²)", r: v2, u: "m/s",
      e: "Conservación de la energía: Ep arriba = Ec abajo\nm·g·h = ½·m·v² → v = √(2gh) (la masa se cancela)\nv = √(2 × 10 × " + h2 + ") = √" + 20 * h2 + " = " + v2 + " m/s",
      err: "Pensar que la velocidad depende de la masa: en caída libre sin fricción todos caen igual."
    };
  });

  generador(F, "trabajopotencia", "Potencia", 2, "num", function () {
    var Fz = G.ent(10, 200), d = G.ent(2, 30), t = G.elegir([2, 4, 5, 8, 10, 20]), W = Fz * d, P = W / t;
    return {
      q: "Una grúa levanta una carga con una fuerza de " + Fz + " N a lo largo de " + d + " m en " + t + " s. Calcula el trabajo y la potencia.",
      campos: ["W (J) =", "P (W) ="], r: [W, G.r2(P)], tol: 0.02,
      e: "1) Trabajo: W = F·d = " + Fz + " × " + d + " = " + W + " J (fuerza y movimiento en la misma dirección)\n2) Potencia: P = W / t = " + W + " / " + t + " = " + G.f(P) + " W",
      err: "Confundir potencia con trabajo: la potencia es qué tan RÁPIDO se hace el trabajo."
    };
  });

  generador(F, "presion", "Presión y fluidos", 2, "num", function () {
    var Fz = G.ent(1, 30) * 100, A = G.elegir([0.1, 0.2, 0.25, 0.5, 2, 4]), P = Fz / A;
    return {
      q: "Una fuerza de " + Fz + " N actúa sobre un área de " + A + " m². ¿Qué presión ejerce?",
      r: P, u: "Pa",
      e: "Fórmula: P = F / A\nSustitución: P = " + Fz + " / " + A + "\nResultado: " + G.f(P) + " Pa",
      err: "Multiplicar fuerza por área: la presión es fuerza ENTRE área (menos área → más presión)."
    };
  });

  generador(F, "ohmserie", "Circuitos", 2, "num", function () {
    var n = G.ent(2, 3), R = [], I = G.elegir([0.5, 1, 1.5, 2, 3]);
    for (var i = 0; i < n; i++) R.push(G.ent(1, 12) * 2);
    var Rt = R.reduce(function (s, x) { return s + x; }, 0), V = Rt * I;
    return {
      q: "En el circuito en serie, calcula la resistencia total y la corriente.",
      fig: { tipo: "circuito", modo: "serie", R: R.map(function (x) { return x + " Ω"; }), V: G.f(V) + " V" },
      campos: ["R total (Ω) =", "I (A) ="], r: [Rt, I],
      e: "En serie se suman: Rt = " + R.join(" + ") + " = " + Rt + " Ω\nLey de Ohm: I = V / Rt = " + G.f(V) + " / " + Rt + " = " + G.f(I) + " A",
      err: "Usar una sola resistencia en lugar de la total."
    };
  });

  generador(F, "ohmparalelo", "Circuitos", 3, "num", function () {
    var par = G.elegir([[6, 3], [12, 6], [4, 4], [10, 15], [12, 4], [20, 5], [6, 12], [8, 8], [30, 6], [9, 18]]);
    var Req = par[0] * par[1] / (par[0] + par[1]), V = Req * G.elegir([1, 2, 3, 4, 6]), I = V / Req;
    return {
      q: "En el circuito en paralelo, calcula la resistencia equivalente y la corriente total.",
      fig: { tipo: "circuito", modo: "paralelo", R: [par[0] + " Ω", par[1] + " Ω"], V: G.f(V) + " V" },
      campos: ["R eq (Ω) =", "I total (A) ="], r: [Req, I],
      e: "Dos resistencias en paralelo: Req = (R₁ × R₂) / (R₁ + R₂) = (" + par[0] + " × " + par[1] + ") / (" + par[0] + " + " + par[1] + ") = " + (par[0] * par[1]) + " / " + (par[0] + par[1]) + " = " + G.f(Req) + " Ω" +
         "\nI = V / Req = " + G.f(V) + " / " + G.f(Req) + " = " + G.f(I) + " A\n(Comprueba: " + G.f(V / par[0]) + " A + " + G.f(V / par[1]) + " A = " + G.f(I) + " A)",
      err: "Sumar las resistencias como si fueran serie: en paralelo Req es MENOR que la más chica."
    };
  });

  generador(F, "potenciaelec", "Electricidad", 2, "num", function () {
    var V = G.elegir([12, 24, 110, 120, 127, 220]), I = G.elegir([0.5, 1, 2, 2.5, 4, 5, 10]), P = V * I;
    return {
      q: "Un aparato conectado a " + V + " V consume " + I + " A. ¿Cuál es su potencia y su resistencia?",
      campos: ["P (W) =", "R (Ω) ="], r: [P, G.r2(V / I)], tol: 0.02,
      e: "1) P = V·I = " + V + " × " + I + " = " + G.f(P) + " W\n2) R = V / I = " + V + " / " + I + " = " + G.f(V / I) + " Ω",
      err: "Despejar mal la ley de Ohm: R = V / I."
    };
  });

  generador(F, "graficavt", "Movimiento uniformemente acelerado (MUA)", 3, "num", function () {
    var t1 = G.ent(2, 5), vmax = G.elegir([10, 12, 15, 20, 24]), t2 = t1 + G.ent(2, 6), t3 = t2 + G.ent(2, 5);
    var a = vmax / t1, dist = vmax * t1 / 2 + vmax * (t2 - t1) + vmax * (t3 - t2) / 2;
    return {
      q: "Con la gráfica velocidad-tiempo, calcula la aceleración en el primer tramo y la distancia total recorrida.",
      fig: { tipo: "grafica", ejes: ["t (s)", "v (m/s)"], x: [0, t3], y: [0, vmax + 5], pasoX: 1, lineas: [[[0, 0], [t1, vmax], [t2, vmax], [t3, 0]]] },
      campos: ["a (m/s²) =", "d (m) ="], r: [G.r2(a), dist], tol: 0.05,
      e: "1) Aceleración = pendiente: a = " + vmax + " / " + t1 + " = " + G.f(a) + " m/s²\n2) Distancia = área bajo la gráfica:\n• Triángulo: " + t1 + " × " + vmax + " / 2 = " + (vmax * t1 / 2) +
         "\n• Rectángulo: " + (t2 - t1) + " × " + vmax + " = " + vmax * (t2 - t1) + "\n• Triángulo: " + (t3 - t2) + " × " + vmax + " / 2 = " + vmax * (t3 - t2) / 2 + "\nTotal = " + G.f(dist) + " m",
      err: "Multiplicar la velocidad máxima por el tiempo total: en las rampas no iba a esa velocidad."
    };
  });

  generador(F, "graficaxt", "Movimiento rectilíneo uniforme (MRU)", 2, "num", function () {
    var t1 = G.ent(2, 4), d1 = G.ent(2, 8) * t1, t2 = t1 + G.ent(1, 3), t3 = t2 + G.ent(2, 4), tramo = G.elegir([1, 3]);
    var v = tramo === 1 ? d1 / t1 : -d1 / (t3 - t2);
    return {
      q: "Con la gráfica posición-tiempo, ¿cuál es la velocidad en el tramo " + (tramo === 1 ? "de 0 a " + t1 : "de " + t2 + " a " + t3) + " s? (Si regresa, la velocidad es negativa.)",
      fig: { tipo: "grafica", ejes: ["t (s)", "d (m)"], x: [0, t3], y: [0, d1 + 5], pasoX: 1, lineas: [[[0, 0], [t1, d1], [t2, d1], [t3, 0]]] },
      r: G.r2(v), tol: 0.02, u: "m/s",
      e: "Velocidad = pendiente = Δd / Δt\n" + (tramo === 1 ? "v = (" + d1 + " − 0) / (" + t1 + " − 0) = " + G.f(v) : "v = (0 − " + d1 + ") / (" + t3 + " − " + t2 + ") = " + G.f(v) + " (negativa: regresa al inicio)") + " m/s",
      err: "Leer la posición en lugar de calcular la pendiente."
    };
  });

  generador(F, "vectores", "Vectores", 3, "num", function () {
    var A = [G.ent(-4, 5), G.ent(-4, 5)], B = [G.ent(-4, 5), G.ent(-4, 5)];
    if (!A[0] && !A[1]) A = [3, 1]; if (!B[0] && !B[1]) B = [-1, 3];
    var Rx = A[0] + B[0], Ry = A[1] + B[1], R = Math.sqrt(Rx * Rx + Ry * Ry);
    if (R === 0) { B = [1, 2]; Rx = A[0] + 1; Ry = A[1] + 2; R = Math.sqrt(Rx * Rx + Ry * Ry); }
    return {
      q: "Calcula la magnitud de la resultante de los vectores A y B (cada cuadro = 1 unidad). Redondea a centésimas.",
      fig: { tipo: "vectores", vecs: [[A[0], A[1], "A"], [B[0], B[1], "B"]], resultante: true, rango: Math.max(6, Math.abs(Rx) + 1, Math.abs(Ry) + 1, 5) },
      r: G.r2(R), tol: 0.02,
      e: "1) Componentes: A = (" + A.join(", ") + "), B = (" + B.join(", ") + ")\n2) Suma: Rx = " + A[0] + " + " + G.par(B[0]) + " = " + Rx + "; Ry = " + A[1] + " + " + G.par(B[1]) + " = " + Ry +
         "\n3) R = √(Rx² + Ry²) = √(" + Rx * Rx + " + " + Ry * Ry + ") = √" + (Rx * Rx + Ry * Ry) + " ≈ " + G.f(R),
      err: "Sumar las longitudes de las flechas en lugar de sumar componente por componente."
    };
  });

  generador(F, "conversion", "Unidades y conversiones", 2, "num", function () {
    var tipo = G.elegir(["kmh", "ms", "cf", "fc"]);
    if (tipo === "kmh") { var k = G.ent(2, 40) * 9; return { q: "Convierte " + k + " km/h a m/s.", r: k / 3.6, u: "m/s", e: "De km/h a m/s se divide entre 3.6:\n" + k + " / 3.6 = " + G.f(k / 3.6) + " m/s", err: "Multiplicar por 3.6 (eso es de m/s a km/h)." }; }
    if (tipo === "ms") { var m = G.ent(2, 40); return { q: "Convierte " + m + " m/s a km/h.", r: G.r2(m * 3.6), u: "km/h", e: "De m/s a km/h se multiplica por 3.6:\n" + m + " × 3.6 = " + G.f(m * 3.6) + " km/h", err: "Dividir entre 3.6." }; }
    if (tipo === "cf") { var c = G.ent(-10, 45) * 1; return { q: "Convierte " + c + " °C a °F. (°F = °C × 1.8 + 32)", r: G.r2(c * 1.8 + 32), u: "°F", e: "°F = " + c + " × 1.8 + 32 = " + G.f(c * 1.8) + " + 32 = " + G.f(c * 1.8 + 32) + " °F", err: "Sumar 32 antes de multiplicar." }; }
    var fF = G.ent(5, 25) * 9 + 32 - 45; return { q: "Convierte " + fF + " °F a °C. (°C = (°F − 32) × 5/9)", r: G.r2((fF - 32) * 5 / 9), tol: 0.6, u: "°C", e: "°C = (" + fF + " − 32) × 5/9 = " + (fF - 32) + " × 5/9 = " + G.f((fF - 32) * 5 / 9) + " °C\n(Con 0.56 en lugar de 5/9 sale casi igual.)", err: "Multiplicar antes de restar 32." };
  });

  generador(F, "mcu", "Movimiento circular", 2, "num", function () {
    var f = G.elegir([0.5, 2, 4, 5, 10, 20, 25, 50]), T = 1 / f;
    return {
      q: "Una rueda gira con frecuencia de " + f + " Hz. ¿Cuál es su periodo?", r: T, u: "s",
      e: "Fórmula: T = 1 / f\nSustitución: T = 1 / " + f + "\nResultado: " + G.f(T) + " s",
      err: "Confundir periodo (segundos por vuelta) con frecuencia (vueltas por segundo)."
    };
  });
})();

// ---------- QUÍMICA ----------
(function () {
  var Q = "quimica";
  var MASAS = { H: 1, C: 12, N: 14, O: 16, Na: 23, Mg: 24, Al: 27, S: 32, Cl: 35.5, K: 39, Ca: 40, Fe: 56 };
  var COMP = [
    ["H₂O", { H: 2, O: 1 }], ["CO₂", { C: 1, O: 2 }], ["NaCl", { Na: 1, Cl: 1 }], ["H₂SO₄", { H: 2, S: 1, O: 4 }], ["NaOH", { Na: 1, O: 1, H: 1 }],
    ["CaCO₃", { Ca: 1, C: 1, O: 3 }], ["NH₃", { N: 1, H: 3 }], ["C₆H₁₂O₆", { C: 6, H: 12, O: 6 }], ["HCl", { H: 1, Cl: 1 }], ["KOH", { K: 1, O: 1, H: 1 }],
    ["Ca(OH)₂", { Ca: 1, O: 2, H: 2 }], ["HNO₃", { H: 1, N: 1, O: 3 }], ["CH₄", { C: 1, H: 4 }], ["Al₂O₃", { Al: 2, O: 3 }], ["Fe₂O₃", { Fe: 2, O: 3 }], ["MgO", { Mg: 1, O: 1 }]
  ];
  function masaMolar(c) { var s = 0; for (var k in c[1]) s += c[1][k] * MASAS[k]; return s; }
  function datosMasas(c) { return Object.keys(c[1]).map(function (k) { return k + " = " + MASAS[k]; }).join(", "); }
  function desglose(c) { return Object.keys(c[1]).map(function (k) { return k + ": " + c[1][k] + " × " + MASAS[k] + " = " + c[1][k] * MASAS[k]; }).join("\n"); }

  generador(Q, "masamolar", "El mol", 2, "num", function () {
    var c = G.elegir(COMP), M = masaMolar(c);
    return {
      q: "Calcula la masa molar de " + c[0] + ". Masas atómicas: " + datosMasas(c) + ".", r: M, u: "g/mol",
      e: "Masa molar = Σ (número de átomos × masa atómica)\n" + desglose(c) + "\nTotal = " + G.f(M) + " g/mol",
      err: "Olvidar multiplicar por el subíndice (en " + c[0] + " cada subíndice dice cuántos átomos hay)."
    };
  });

  generador(Q, "moles", "El mol", 3, "num", function () {
    var c = G.elegir(COMP), M = masaMolar(c), n = G.elegir([0.25, 0.5, 1.5, 2, 2.5, 3, 4]), m = G.r2(n * M), pide = G.elegir(["n", "m"]);
    return pide === "n"
      ? { q: "¿Cuántos moles hay en " + G.f(m) + " g de " + c[0] + "? Masas atómicas: " + datosMasas(c) + ".", r: n, u: "mol",
          e: "1) Masa molar: " + desglose(c).replace(/\n/g, "; ") + " → " + G.f(M) + " g/mol\n2) n = masa / masa molar = " + G.f(m) + " / " + G.f(M) + " = " + G.f(n) + " mol",
          err: "Multiplicar la masa por la masa molar: para obtener moles se DIVIDE." }
      : { q: "¿Cuántos gramos son " + n + " mol de " + c[0] + "? Masas atómicas: " + datosMasas(c) + ".", r: m, u: "g",
          e: "1) Masa molar: " + G.f(M) + " g/mol\n2) masa = n × masa molar = " + n + " × " + G.f(M) + " = " + G.f(m) + " g",
          err: "Dividir los moles entre la masa molar." };
  });

  generador(Q, "molaridad", "Unidades de concentración", 3, "num", function () {
    var c = G.elegir(COMP.filter(function (x) { return ["NaCl", "NaOH", "KOH", "HCl", "C₆H₁₂O₆", "HNO₃", "H₂SO₄"].indexOf(x[0]) !== -1; }));
    var M = masaMolar(c), Mol = G.elegir([0.1, 0.2, 0.25, 0.5, 1, 2]), mL = G.elegir([100, 200, 250, 500, 750, 1000, 2000]);
    var masa = G.r2(Mol * M * mL / 1000);
    return {
      q: "Se disuelven " + G.f(masa) + " g de " + c[0] + " (masa molar " + G.f(M) + " g/mol) hasta formar " + mL + " mL de solución. ¿Cuál es la molaridad?",
      r: Mol, u: "M (mol/L)", tol: 0.005,
      e: "Fórmula: M = masa / (masa molar × litros)\n1) " + mL + " mL = " + (mL / 1000) + " L\n2) M = " + G.f(masa) + " / (" + G.f(M) + " × " + (mL / 1000) + ") = " + G.f(Mol) + " M",
      err: "Usar " + mL + " (mililitros) en lugar de " + (mL / 1000) + " litros."
    };
  });

  generador(Q, "ph", "pH", 2, "num", function () {
    var n = G.ent(1, 13), tipo = G.elegir(["H", "OH", "pOH"]);
    if (tipo === "H") return { q: "Una solución tiene [H⁺] = 1 × 10⁻" + n + " M. ¿Cuál es su pH? ¿Es ácida, neutra o básica?", r: n,
      e: "pH = −log[H⁺] = −log(10⁻" + n + ") = " + n + "\n" + (n < 7 ? "pH < 7 → ácida" : n === 7 ? "pH = 7 → neutra" : "pH > 7 → básica"), err: "Dar el exponente con signo negativo: el pH es positivo." };
    if (tipo === "OH") return { q: "Una solución tiene [OH⁻] = 1 × 10⁻" + n + " M. ¿Cuál es su pH?", r: 14 - n,
      e: "1) pOH = −log[OH⁻] = " + n + "\n2) pH = 14 − pOH = 14 − " + n + " = " + (14 - n), err: "Dar el pOH (" + n + ") como si fuera el pH." };
    return { q: "Una solución tiene pH = " + n + ". ¿Cuál es su pOH?", r: 14 - n, e: "pH + pOH = 14 → pOH = 14 − " + n + " = " + (14 - n), err: "Pensar que pOH = pH." };
  });

  generador(Q, "porcentajemasa", "Unidades de concentración", 2, "num", function () {
    var s = G.ent(1, 20) * 5, d = G.ent(2, 20) * 10, p = s / (s + d) * 100;
    return {
      q: "Se disuelven " + s + " g de sal en " + d + " g de agua. ¿Cuál es el porcentaje en masa de la sal? Redondea a centésimas.", r: G.r2(p), tol: 0.02, u: "%",
      e: "Fórmula: % masa = m soluto / (m soluto + m disolvente) × 100\nSustitución: " + s + " / (" + s + " + " + d + ") × 100 = " + s + " / " + (s + d) + " × 100\nResultado: " + G.f(p) + "%",
      err: "Dividir solo entre el agua (" + d + "): se divide entre la masa TOTAL de la solución."
    };
  });

  generador(Q, "particulas", "El átomo", 2, "num", function () {
    // [símbolo, Z, A, carga de su ion más común]
    var el = G.elegir([["Na", 11, 23, 1], ["Cl", 17, 35, -1], ["Ca", 20, 40, 2], ["Fe", 26, 56, 3], ["O", 8, 16, -2], ["Al", 13, 27, 3], ["K", 19, 39, 1], ["Mg", 12, 24, 2], ["C", 6, 12, 0], ["S", 16, 32, -2], ["N", 7, 14, -3]]);
    var carga = G.elegir([0, el[3]]);
    var e = el[1] - carga, txt = carga === 0 ? "" : (Math.abs(carga) === 1 ? "" : G.sup(Math.abs(carga))) + (carga > 0 ? "⁺" : "⁻");
    return {
      q: "Un " + (carga ? "ion" : "átomo") + " " + el[0] + txt + " tiene Z = " + el[1] + " y A = " + el[2] + ". Escribe cuántos protones, electrones y neutrones tiene.",
      campos: ["Protones =", "Electrones =", "Neutrones ="], r: [el[1], e, el[2] - el[1]],
      e: "Protones = Z = " + el[1] + "\nNeutrones = A − Z = " + el[2] + " − " + el[1] + " = " + (el[2] - el[1]) +
         "\nElectrones = protones − carga = " + el[1] + " − (" + carga + ") = " + e + (carga > 0 ? " (perdió electrones)" : carga < 0 ? " (ganó electrones)" : " (átomo neutro)"),
      err: carga ? "Olvidar ajustar los electrones por la carga: un ion positivo PERDIÓ electrones." : "Calcular neutrones como A + Z: es A − Z."
    };
  });

  generador(Q, "estequiometria", "Estequiometría", 3, "num", function () {
    var r = G.elegir([
      { ec: "2H₂ + O₂ → 2H₂O", a: "H₂", Ma: 2, ca: 2, b: "H₂O", Mb: 18, cb: 2 },
      { ec: "CH₄ + 2O₂ → CO₂ + 2H₂O", a: "CH₄", Ma: 16, ca: 1, b: "CO₂", Mb: 44, cb: 1 },
      { ec: "N₂ + 3H₂ → 2NH₃", a: "N₂", Ma: 28, ca: 1, b: "NH₃", Mb: 17, cb: 2 },
      { ec: "CaCO₃ → CaO + CO₂", a: "CaCO₃", Ma: 100, ca: 1, b: "CO₂", Mb: 44, cb: 1 }
    ]);
    var molA = G.elegir([0.5, 1, 2, 3, 4, 5]), gA = molA * r.Ma, molB = molA * r.cb / r.ca, gB = molB * r.Mb;
    return {
      q: "Con la reacción " + r.ec + ", ¿cuántos gramos de " + r.b + " se obtienen a partir de " + G.f(gA) + " g de " + r.a + "? (Masas molares: " + r.a + " = " + r.Ma + " g/mol, " + r.b + " = " + r.Mb + " g/mol)",
      r: G.r2(gB), tol: 0.05, u: "g",
      e: "1) Gramos → moles: " + G.f(gA) + " / " + r.Ma + " = " + G.f(molA) + " mol de " + r.a + "\n2) Proporción de la ecuación: " + r.ca + " mol " + r.a + " → " + r.cb + " mol " + r.b + " → " + G.f(molB) + " mol de " + r.b +
         "\n3) Moles → gramos: " + G.f(molB) + " × " + r.Mb + " = " + G.f(gB) + " g",
      err: "Pasar de gramos de una sustancia a gramos de otra sin convertir a moles ni usar los coeficientes."
    };
  });
})();
