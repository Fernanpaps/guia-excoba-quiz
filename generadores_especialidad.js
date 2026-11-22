// ============================================================
//  Generadores de las materias de especialidad de Ingeniería de Software
//  (Matemáticas para cálculo, Física y Química del bachillerato)
// ============================================================
(function () {
  var M = "matematicas", F = "fisica", Q = "quimica";
  var RAD = Math.PI / 180;

  // ---------- Matemáticas para cálculo ----------
  generador(M, "dominioracional", "Cálculo y funciones", 2, "num", function () {
    var a = G.ent(-6, 6), k = G.ent(1, 5);
    return {
      q: "La función f(x) = " + k + " / (x " + G.signo(-a) + ") no existe para un valor de x. ¿Cuál es? (También es su asíntota vertical.)",
      r: a,
      e: "Una fracción no existe cuando el denominador vale 0.\nx " + G.signo(-a) + " = 0 → x = " + G.f(a) + "\nDominio: todos los reales excepto x = " + G.f(a) + ". Ahí la gráfica tiene una asíntota vertical.",
      err: "Igualar el numerador a cero: lo que no puede ser cero es el DENOMINADOR."
    };
  });

  generador(M, "asintotah", "Cálculo y funciones", 3, "num", function () {
    var a = G.ent(1, 6), b = G.ent(1, 5), c = G.ent(-5, 5), d = G.ent(-5, 5);
    return {
      q: "¿Cuál es la asíntota horizontal de f(x) = (" + a + "x " + G.signo(c) + ") / (" + b + "x " + G.signo(d) + ")? Escribe el valor de y.",
      r: a / b, rm: "y = " + G.fr(a, b),
      e: "Si el numerador y el denominador tienen el MISMO grado, la asíntota horizontal es el cociente de los coeficientes principales:\ny = " + a + " / " + b + " = " + G.fr(a, b) + (G.fr(a, b).indexOf("/") > -1 ? " ≈ " + G.f(a / b) : ""),
      err: "Confundir la asíntota horizontal (comportamiento cuando x es muy grande) con la vertical (donde el denominador es cero)."
    };
  });

  generador(M, "dominioraiz", "Cálculo y funciones", 2, "num", function () {
    var a = G.ent(1, 4), b = G.ent(-12, 12);
    // a·x + b ≥ 0 → x ≥ −b/a
    return {
      q: "¿Desde qué valor de x está definida f(x) = √(" + a + "x " + G.signo(b) + ")? (Escribe el valor mínimo de x del dominio.)",
      r: -b / a, rm: "x ≥ " + G.fr(-b, a),
      e: "Lo de adentro de una raíz cuadrada no puede ser negativo:\n" + a + "x " + G.signo(b) + " ≥ 0 → " + a + "x ≥ " + G.f(-b) + " → x ≥ " + G.fr(-b, a),
      err: "Despejar mal el signo: si el número pasa al otro lado, cambia de signo."
    };
  });

  generador(M, "inversa", "Cálculo y funciones", 3, "num", function () {
    var a = G.elegir([2, 3, 4, 5]), b = G.ent(-9, 9), y = a * G.ent(-4, 6) + b;
    var x = (y - b) / a;
    return {
      q: "Si f(x) = " + a + "x " + G.signo(b) + ", ¿cuánto vale f⁻¹(" + G.f(y) + ")? (la función inversa evaluada en " + G.f(y) + ")",
      r: x,
      e: "f⁻¹(" + G.f(y) + ") es el x tal que f(x) = " + G.f(y) + ":\n" + a + "x " + G.signo(b) + " = " + G.f(y) + " → " + a + "x = " + G.f(y - b) + " → x = " + G.f(x) +
         "\n(La inversa es f⁻¹(x) = (x " + G.signo(-b) + ") / " + a + ")",
      err: "Calcular f(" + G.f(y) + ") en lugar de la inversa, o pensar que f⁻¹ = 1/f."
    };
  });

  generador(M, "valorabs", "Cálculo y funciones", 3, "num", function () {
    var a = G.ent(-6, 6), k = G.ent(1, 8);
    return {
      q: "Resuelve |x " + G.signo(-a) + "| = " + k + ". Escribe primero la solución menor.",
      campos: ["x₁ =", "x₂ ="], r: [a - k, a + k],
      e: "El valor absoluto da dos casos:\n• x " + G.signo(-a) + " = " + k + " → x = " + (a + k) + "\n• x " + G.signo(-a) + " = −" + k + " → x = " + (a - k),
      err: "Quedarse solo con el caso positivo: |algo| = " + k + " significa que algo vale " + k + " o −" + k + "."
    };
  });

  generador(M, "crecimiento", "Cálculo y funciones", 2, "num", function () {
    var P = G.elegir([100, 200, 500, 1000]), t = G.ent(2, 5), modo = G.elegir(["duplica", "triplica"]), base = modo === "duplica" ? 2 : 3;
    var h = G.elegir([1, 2, 3]);
    var res = P * Math.pow(base, t);
    return {
      q: "Una población de " + P + " bacterias se " + modo + " cada " + h + " hora" + (h > 1 ? "s" : "") + ". ¿Cuántas bacterias habrá después de " + t * h + " horas?",
      r: res,
      e: "Crecimiento exponencial: N = N₀ · " + base + "^(t/" + h + ")\nPeriodos: " + t * h + " / " + h + " = " + t + "\nN = " + P + " × " + base + "^" + t + " = " + P + " × " + Math.pow(base, t) + " = " + res,
      err: "Multiplicar " + P + " × " + base + " × " + t + " (crecimiento lineal). En cada periodo se multiplica OTRA VEZ por " + base + "."
    };
  });

  generador(M, "circunferencia", "Círculo y esfera", 3, "num", function () {
    var h = G.ent(-5, 5), k = G.ent(-5, 5), r = G.ent(1, 9);
    var D = -2 * h, E = -2 * k, Fc = h * h + k * k - r * r;
    var t = function (v, s) { return v === 0 ? "" : (v < 0 ? " − " : " + ") + Math.abs(v) + s; };
    return {
      q: "La circunferencia x² + y²" + t(D, "x") + t(E, "y") + t(Fc, "") + " = 0 está en forma general. Escribe su centro y su radio.",
      campos: ["h =", "k =", "r ="], r: [h, k, r],
      e: "Forma general: x² + y² + Dx + Ey + F = 0 con D = " + D + ", E = " + E + ", F = " + Fc +
         "\n1) Centro: h = −D/2 = " + h + ", k = −E/2 = " + k + "\n2) Radio: r = √(h² + k² − F) = √(" + h * h + " + " + k * k + " − (" + Fc + ")) = √" + r * r + " = " + r +
         "\n(Forma ordinaria: (x " + G.signo(-h) + ")² + (y " + G.signo(-k) + ")² = " + r * r + ")",
      err: "Tomar el centro con el mismo signo que D y E: el centro es −D/2 y −E/2."
    };
  });

  generador(M, "elipse", "Cálculo y funciones", 3, "num", function () {
    var t = G.elegir([[5, 4, 3], [5, 3, 4], [10, 8, 6], [13, 12, 5], [10, 6, 8], [17, 15, 8]]);
    var a = t[0], b = t[1], c = t[2];
    return {
      q: "Para la elipse x²/" + a * a + " + y²/" + b * b + " = 1, escribe la distancia del centro a cada foco (c) y la excentricidad.",
      campos: ["c =", "e ="], r: [c, c / a], rm: "c = " + c + ", e = " + G.fr(c, a),
      e: "a² = " + a * a + " → a = " + a + " (semieje mayor); b² = " + b * b + " → b = " + b + "\nFórmula: c² = a² − b² = " + a * a + " − " + b * b + " = " + c * c + " → c = " + c +
         "\nExcentricidad: e = c / a = " + c + "/" + a + " = " + G.f(c / a) + " (siempre entre 0 y 1)",
      err: "Sumar a² + b² como en Pitágoras: en la elipse c² = a² − b²."
    };
  });

  generador(M, "parabolafoco", "Parábolas", 3, "num", function () {
    var P = G.elegir([-3, -2, -1, 1, 2, 3]), h = G.ent(-4, 4), k = G.ent(-4, 4);
    return {
      q: "La parábola (x " + G.signo(-h) + ")² = " + 4 * P + "(y " + G.signo(-k) + ") tiene vértice en (" + h + ", " + k + "). Escribe las coordenadas de su foco.",
      campos: ["x =", "y ="], r: [h, k + P],
      e: "Forma (x − h)² = 4P(y − k): eje vertical.\n4P = " + 4 * P + " → P = " + P + (P > 0 ? " (abre hacia arriba)" : " (abre hacia abajo)") +
         "\nFoco: (h, k + P) = (" + h + ", " + k + " " + G.signo(P) + ") = (" + h + ", " + (k + P) + ")\nDirectriz: y = k − P = " + (k - P),
      err: "Usar 4P como si fuera P: primero divide entre 4."
    };
  });

  generador(M, "inclinacion", "Función lineal", 3, "num", function () {
    var ang = G.elegir([30, 45, 60, 135, 150, 120]), m = Math.round(Math.tan(ang * RAD) * 1000) / 1000;
    return {
      q: "Una recta tiene pendiente m = " + m + ". ¿Cuál es su ángulo de inclinación (entre 0° y 180°)? (tan 30° ≈ 0.577, tan 45° = 1, tan 60° ≈ 1.732)",
      r: ang, u: "°", tol: 1,
      e: "Fórmula: m = tan θ → θ = tan⁻¹(m)\n" + (m > 0 ? "tan⁻¹(" + m + ") = " + ang + "°" : "Como m es negativa, el ángulo es obtuso: θ = 180° − tan⁻¹(" + Math.abs(m) + ") = 180° − " + (180 - ang) + "° = " + ang + "°"),
      err: m > 0 ? "Confundir la tangente con el seno o el coseno." : "Dar un ángulo negativo: con pendiente negativa el ángulo de inclinación está entre 90° y 180°."
    };
  });

  generador(M, "poligonos", "Geometría", 2, "num", function () {
    var n = G.ent(5, 12), pide = G.elegir(["suma", "diag", "int"]);
    var suma = (n - 2) * 180, diag = n * (n - 3) / 2;
    var nombres = { 5: "pentágono", 6: "hexágono", 7: "heptágono", 8: "octágono", 9: "eneágono", 10: "decágono", 11: "endecágono", 12: "dodecágono" };
    return {
      q: { suma: "¿Cuánto suman los ángulos interiores de un " + nombres[n] + "?", diag: "¿Cuántas diagonales tiene un " + nombres[n] + "?", int: "¿Cuánto mide cada ángulo interior de un " + nombres[n] + " regular? (redondea a décimas)" }[pide],
      r: { suma: suma, diag: diag, int: G.r2(suma / n) }[pide], tol: pide === "int" ? 0.1 : undefined, u: pide === "diag" ? "" : "°",
      e: { suma: "Fórmula: S = (n − 2) × 180° = (" + n + " − 2) × 180° = " + suma + "°",
           diag: "Fórmula: D = n(n − 3) / 2 = " + n + "(" + (n - 3) + ") / 2 = " + diag,
           int: "1) Suma: (" + n + " − 2) × 180° = " + suma + "°\n2) Cada ángulo: " + suma + " / " + n + " ≈ " + G.f(suma / n) + "°" }[pide],
      err: pide === "diag" ? "Usar n(n − 1)/2: eso cuenta también los lados." : "Usar n × 180° sin restar 2."
    };
  });

  generador(M, "sector", "Círculo y esfera", 3, "num", function () {
    var r = G.ent(2, 12), ang = G.elegir([30, 45, 60, 90, 120, 135, 150, 180, 270]), pide = G.elegir(["area", "arco"]);
    var area = 3.14 * r * r * ang / 360, arco = 2 * 3.14 * r * ang / 360;
    return {
      q: "En un círculo de radio " + r + " cm, calcula " + (pide === "area" ? "el área del sector" : "la longitud del arco") + " de " + ang + "°. (π = 3.14)",
      r: G.r2(pide === "area" ? area : arco), tol: 0.05, u: pide === "area" ? "cm²" : "cm",
      e: "El sector es una fracción del círculo: " + ang + "/360 = " + G.fr(ang, 360) + "\n" +
         (pide === "area" ? "Área = πr² × " + ang + "/360 = 3.14 × " + r * r + " × " + G.fr(ang, 360) + " = " + G.f(area) + " cm²"
                          : "Arco = 2πr × " + ang + "/360 = 2 × 3.14 × " + r + " × " + G.fr(ang, 360) + " = " + G.f(arco) + " cm"),
      err: pide === "area" ? "Usar 2πr (perímetro) para un área." : "Usar πr² (área) para una longitud."
    };
  });

  generador(M, "trigperiodo", "Cálculo y funciones", 3, "num", function () {
    var A = G.ent(1, 6), B = G.elegir([1, 2, 3, 4, 6]), fn = G.elegir(["sen", "cos"]);
    return {
      q: "Para la función y = " + A + " " + fn + "(" + (B === 1 ? "" : B) + "x), escribe su amplitud y su periodo en grados.",
      campos: ["Amplitud =", "Periodo (°) ="], r: [A, 360 / B],
      e: "Forma y = A·" + fn + "(Bx): amplitud = |A| y periodo = 360° / B\nAmplitud = " + A + "\nPeriodo = 360° / " + B + " = " + G.f(360 / B) + "° (en radianes: 2π/" + B + ")",
      err: "Multiplicar 360 × B: entre más grande B, la onda se repite MÁS rápido (periodo más corto)."
    };
  });

  generador(M, "racionales", "Álgebra", 3, "alg", function () {
    var a = G.ent(1, 7), b = G.ent(1, 7); if (a === b) b = a + 1;
    return {
      q: "Simplifica la expresión racional:\n(x² " + G.signo(-(a + b)) + "x + " + a * b + ") / (x − " + a + ")",
      r: "x-" + b, rm: "x − " + b,
      e: "1) Factoriza el numerador: dos números que sumen −" + (a + b) + " y multipliquen " + a * b + " → −" + a + " y −" + b + "\n   x² − " + (a + b) + "x + " + a * b + " = (x − " + a + ")(x − " + b + ")" +
         "\n2) Cancela el factor repetido (x − " + a + ")\nResultado: x − " + b + " (para x ≠ " + a + ")",
      err: "Cancelar términos sueltos (las x) en lugar de factores completos."
    };
  });

  generador(M, "sistema3", "Sistemas de ecuaciones lineales", 3, "num", function () {
    var x = G.ent(-3, 4), y = G.ent(-3, 4), z = G.ent(-3, 4);
    var e1 = x + y + z, e2 = 2 * x - y + z, e3 = x + 2 * y - z;
    return {
      q: "Resuelve el sistema 3×3:\nx + y + z = " + G.f(e1) + "\n2x − y + z = " + G.f(e2) + "\nx + 2y − z = " + G.f(e3),
      campos: ["x =", "y =", "z ="], r: [x, y, z],
      e: "1) Suma la 1ª y la 3ª (se va z): 2x + 3y = " + G.f(e1 + e3) + "\n2) Resta la 1ª menos la 2ª (se va z): −x + 2y = " + G.f(e1 - e2) +
         "\n3) Resuelve ese sistema 2×2: x = " + x + ", y = " + y + "\n4) Sustituye en la 1ª: z = " + G.f(e1) + " − " + G.par(x) + " − " + G.par(y) + " = " + z,
      err: "Eliminar una incógnita distinta en cada paso: elimina la MISMA (aquí z) en dos combinaciones."
    };
  });

  // ---------- Física II ----------
  generador(F, "pascal", "Presión y fluidos", 3, "num", function () {
    var A1 = G.elegir([0.01, 0.02, 0.05]), k = G.elegir([10, 20, 25, 40, 50]), A2 = A1 * k, F2 = G.ent(5, 40) * 500, F1 = F2 / k;
    return {
      q: "En una prensa hidráulica, el émbolo chico tiene " + A1 + " m² y el grande " + G.f(A2) + " m². ¿Qué fuerza hay que aplicar en el chico para levantar un auto de " + F2 + " N?",
      r: G.r2(F1), u: "N", tol: 0.05,
      e: "Principio de Pascal: la presión es igual en los dos émbolos.\nF₁/A₁ = F₂/A₂ → F₁ = F₂ × A₁/A₂ = " + F2 + " × " + A1 + "/" + G.f(A2) + " = " + G.f(F1) + " N",
      err: "Multiplicar por la razón de áreas al revés: el émbolo chico necesita MENOS fuerza."
    };
  });

  generador(F, "arquimedes", "Presión y fluidos", 3, "num", function () {
    var V = G.elegir([0.001, 0.002, 0.005, 0.01, 0.02, 0.05]), rho = G.elegir([[1000, "agua"], [1030, "agua de mar"], [800, "alcohol"]]);
    var E = rho[0] * 9.8 * V;
    return {
      q: "Un objeto de " + G.f(V * 1000) + " litros (" + V + " m³) se sumerge completamente en " + rho[1] + " (densidad " + rho[0] + " kg/m³). ¿Qué empuje recibe? (g = 9.8 m/s²)",
      r: G.r2(E), u: "N", tol: 0.05,
      e: "Principio de Arquímedes: el empuje es igual al peso del líquido desalojado.\nE = ρ · g · V = " + rho[0] + " × 9.8 × " + V + " = " + G.f(E) + " N",
      err: "Usar el volumen en litros sin pasarlo a m³ (1 L = 0.001 m³)."
    };
  });

  generador(F, "calor", "Temperatura y calor", 2, "num", function () {
    var m = G.ent(1, 20) * 100, Ti = G.ent(10, 30), Tf = Ti + G.ent(10, 60), sus = G.elegir([["agua", 1], ["aluminio", 0.22], ["hierro", 0.11], ["cobre", 0.093]]);
    var Qc = m * sus[1] * (Tf - Ti);
    return {
      q: "¿Cuántas calorías se necesitan para calentar " + m + " g de " + sus[0] + " de " + Ti + " °C a " + Tf + " °C? (calor específico = " + sus[1] + " cal/g°C)",
      r: G.r2(Qc), tol: 0.5, u: "cal",
      e: "Fórmula: Q = m · c · ΔT\nΔT = " + Tf + " − " + Ti + " = " + (Tf - Ti) + " °C\nQ = " + m + " × " + sus[1] + " × " + (Tf - Ti) + " = " + G.f(Qc) + " cal",
      err: "Usar la temperatura final en lugar del CAMBIO de temperatura (ΔT)."
    };
  });

  generador(F, "dilatacion", "Temperatura y calor", 3, "num", function () {
    var L0 = G.ent(1, 50), mat = G.elegir([["acero", 12e-6, "1.2 × 10⁻⁵"], ["aluminio", 24e-6, "2.4 × 10⁻⁵"], ["cobre", 17e-6, "1.7 × 10⁻⁵"]]), dT = G.ent(2, 8) * 10;
    var dL = L0 * mat[1] * dT;
    return {
      q: "Una barra de " + mat[0] + " mide " + L0 + " m. ¿Cuántos milímetros se alarga si su temperatura sube " + dT + " °C? (α = " + mat[2] + " /°C)",
      r: G.r2(dL * 1000), tol: 0.02, u: "mm",
      e: "Fórmula: ΔL = L₀ · α · ΔT\nΔL = " + L0 + " × " + mat[2] + " × " + dT + " = " + dL.toExponential(2).replace("e-", " × 10^-") + " m\nEn milímetros (× 1000): " + G.f(dL * 1000) + " mm",
      err: "Olvidar convertir de metros a milímetros al final."
    };
  });

  generador(F, "coulomb", "Electricidad", 3, "num", function () {
    var q1 = G.ent(1, 9), q2 = G.ent(1, 9), d = G.elegir([0.1, 0.2, 0.3, 0.5, 1]);
    var Fz = 9e9 * q1 * 1e-6 * q2 * 1e-6 / (d * d);
    return {
      q: "Dos cargas de " + q1 + " μC y " + q2 + " μC están separadas " + d + " m. ¿Con qué fuerza se repelen? (k = 9 × 10⁹ N·m²/C²; 1 μC = 10⁻⁶ C). Redondea a centésimas.",
      r: G.r2(Fz), tol: Math.max(0.02, Fz * 0.01), u: "N",
      e: "Fórmula: F = k · q₁ · q₂ / d²\nF = 9×10⁹ × " + q1 + "×10⁻⁶ × " + q2 + "×10⁻⁶ / " + d + "²\nF = 9×10⁹ × " + q1 * q2 + "×10⁻¹² / " + G.f(d * d) + " = " + G.f(9e-3 * q1 * q2) + " / " + G.f(d * d) + " ≈ " + G.f(Fz) + " N",
      err: "Olvidar elevar la distancia al cuadrado o no convertir los microcoulombs."
    };
  });

  generador(F, "caudal", "Presión y fluidos", 3, "num", function () {
    var A1 = G.elegir([4, 6, 8, 10, 12]), v1 = G.ent(1, 5), A2 = G.elegir([1, 2, 3].filter(function (x) { return x < A1; })), v2 = A1 * v1 / A2;
    return {
      q: "El agua fluye por un tubo de " + A1 + " cm² de sección a " + v1 + " m/s. Si el tubo se estrecha a " + A2 + " cm², ¿a qué velocidad sale el agua?",
      r: G.r2(v2), tol: 0.02, u: "m/s",
      e: "Ecuación de continuidad: el caudal se conserva.\nA₁ · v₁ = A₂ · v₂ → v₂ = A₁ · v₁ / A₂ = " + A1 + " × " + v1 + " / " + A2 + " = " + G.f(v2) + " m/s\n(Más angosto → más rápido.)",
      err: "Pensar que en el tubo angosto el agua va más lento: es al revés."
    };
  });

  generador(F, "gravitacion", "Gravitación universal y Kepler", 3, "num", function () {
    var m1 = G.ent(1, 9) * 100, m2 = G.ent(1, 9) * 100, d = G.elegir([1, 2, 5, 10]);
    var Fz = 6.67e-11 * m1 * m2 / (d * d);
    var coef = Fz / 1e-7;
    return {
      q: "¿Con qué fuerza se atraen dos masas de " + m1 + " kg y " + m2 + " kg separadas " + d + " m? Escribe el resultado en unidades de 10⁻⁷ N (es decir, el número que va antes de × 10⁻⁷). (G = 6.67 × 10⁻¹¹ N·m²/kg²). Redondea a centésimas.",
      r: G.r2(coef), tol: Math.max(0.02, coef * 0.01), rm: G.f(coef) + " × 10⁻⁷ N",
      e: "Fórmula: F = G · m₁ · m₂ / d²\nF = 6.67×10⁻¹¹ × " + m1 + " × " + m2 + " / " + d * d + " = " + Fz.toExponential(3).replace("e-", " × 10^-") + " N\n= " + G.f(coef) + " × 10⁻⁷ N",
      err: "Olvidar elevar la distancia al cuadrado."
    };
  });

  // ---------- Química II ----------
  generador(Q, "dilucion", "Unidades de concentración", 3, "num", function () {
    var C1 = G.elegir([1, 2, 3, 4, 5, 6]), V1 = G.elegir([10, 20, 25, 50, 100]), C2 = G.elegir([0.1, 0.2, 0.25, 0.5].filter(function (c) { return c < C1; }));
    var V2 = C1 * V1 / C2;
    return {
      q: "Tienes " + V1 + " mL de una solución " + C1 + " M. ¿A qué volumen total hay que diluirla para que quede " + C2 + " M?",
      r: G.r2(V2), u: "mL", tol: 0.05,
      e: "Fórmula de dilución: C₁ · V₁ = C₂ · V₂\nV₂ = C₁ · V₁ / C₂ = " + C1 + " × " + V1 + " / " + C2 + " = " + G.f(V2) + " mL",
      err: "Pensar que diluir aumenta la concentración, o despejar al revés."
    };
  });

  generador(Q, "gases", "Estados de la materia", 3, "num", function () {
    var P1 = G.elegir([1, 2, 3, 4]), V1 = G.elegir([2, 4, 6, 8, 10, 12]), P2 = G.elegir([1, 2, 3, 4, 6, 8].filter(function (p) { return p !== P1; }));
    var V2 = P1 * V1 / P2;
    return {
      q: "Un gas ocupa " + V1 + " L a " + P1 + " atm. Si la temperatura no cambia y la presión pasa a " + P2 + " atm, ¿qué volumen ocupa?",
      r: G.r2(V2), u: "L", tol: 0.02,
      e: "Ley de Boyle (temperatura constante): P₁ · V₁ = P₂ · V₂\nV₂ = " + P1 + " × " + V1 + " / " + P2 + " = " + G.f(V2) + " L\n" + (P2 > P1 ? "Más presión → menos volumen." : "Menos presión → más volumen."),
      err: "Usar regla de 3 directa: presión y volumen son INVERSAMENTE proporcionales."
    };
  });

  generador(Q, "configuracion", "Configuración electrónica", 3, "num", function () {
    var Z = G.ent(3, 20), orden = [["1s", 2], ["2s", 2], ["2p", 6], ["3s", 2], ["3p", 6], ["4s", 2]];
    var resto = Z, conf = [], capas = {};
    orden.forEach(function (o) { if (resto <= 0) return; var e = Math.min(o[1], resto); conf.push(o[0] + G.sup(e)); resto -= e; capas[o[0][0]] = (capas[o[0][0]] || 0) + e; });
    var ultimo = Math.max.apply(null, Object.keys(capas).map(Number));
    return {
      q: "Un elemento tiene número atómico Z = " + Z + ". Según su configuración electrónica, ¿cuántos electrones tiene en su último nivel de energía (electrones de valencia)?",
      r: capas[ultimo],
      e: "Llena los orbitales en orden (1s 2s 2p 3s 3p 4s…) hasta acomodar " + Z + " electrones:\n" + conf.join(" ") +
         "\nÚltimo nivel: n = " + ultimo + " → " + capas[ultimo] + " electrones de valencia" + (Z <= 20 && capas[ultimo] ? " (grupo " + (capas[ultimo] <= 2 ? capas[ultimo] : capas[ultimo] + 10) + " de la tabla)" : ""),
      err: "Contar solo los electrones del último orbital (por ejemplo solo los p) y no todos los del último NIVEL (s + p)."
    };
  });

  generador(Q, "rendimiento", "Estequiometría", 3, "num", function () {
    var teo = G.ent(20, 200), real = G.ent(Math.round(teo * 0.5), teo - 1), pct = real / teo * 100;
    return {
      q: "En una reacción se esperaban obtener " + teo + " g de producto (rendimiento teórico), pero solo se obtuvieron " + real + " g. ¿Cuál fue el porcentaje de rendimiento? Redondea a centésimas.",
      r: G.r2(pct), tol: 0.02, u: "%",
      e: "Fórmula: % rendimiento = (real / teórico) × 100\n= " + real + " / " + teo + " × 100 = " + G.f(pct) + "%",
      err: "Dividir el teórico entre el real (daría más de 100%)."
    };
  });
})();
