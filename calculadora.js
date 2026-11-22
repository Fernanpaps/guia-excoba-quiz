// ============================================================
//  Calculadora como la del demo del EXCOBA
//  Teclas: ←  C  ±  sen / 7 8 9 ÷ xʸ cos / 4 5 6 × √ tan / 1 2 3 − Exp log / 0 . + =
//  Funciona como una calculadora normal (no escribes toda la operación):
//  número → operación → número → "=". Las funciones sen, cos, tan, √ y log
//  se aplican al número que está en la pantalla. Los ángulos van en GRADOS.
// ============================================================
window.Calculadora = (function () {
  "use strict";

  var pantalla = "0";     // lo que se ve
  var guardado = null;    // primer número de la operación
  var operacion = null;   // "+", "−", "×", "÷", "^"
  var nuevo = true;       // el siguiente dígito empieza un número nuevo
  var error = false;

  var $ = function (id) { return document.getElementById(id); };

  function mostrar() {
    $("calc-pantalla").textContent = pantalla;
    var simb = { "+": "+", "−": "−", "×": "×", "÷": "÷", "^": "^" };
    $("calc-resultado").textContent = guardado !== null && operacion ? formato(guardado) + " " + simb[operacion] : "";
  }
  function formato(n) {
    if (!isFinite(n)) return "Error";
    if (n === 0) return "0";
    var a = Math.abs(n);
    if (a >= 1e12 || a < 1e-9) return n.toExponential(6).replace(/\.?0+e/, "e").replace("e+", "E").replace("e", "E");
    return String(parseFloat(n.toPrecision(12)));
  }
  function valor() { return parseFloat(pantalla.replace("−", "-")); }
  function poner(n) {
    if (!isFinite(n) || isNaN(n)) { pantalla = "Error"; error = true; }
    else pantalla = formato(n).replace(/^-/, "-");
    nuevo = true;
  }
  function calcular(a, op, b) {
    switch (op) {
      case "+": return a + b;
      case "−": return a - b;
      case "×": return a * b;
      case "÷": return b === 0 ? NaN : a / b;
      case "^": return Math.pow(a, b);
    }
    return b;
  }
  var RAD = Math.PI / 180;
  function limpiarTrig(x) { return Math.abs(x) < 1e-12 ? 0 : x; }

  function tecla(t) {
    if (error && t !== "C") return;
    if (/^[0-9]$/.test(t)) {
      if (nuevo) { pantalla = t; nuevo = false; }
      else if (pantalla === "0") pantalla = t;
      else if (pantalla.replace(/[^0-9]/g, "").length < 15) pantalla += t;
    } else if (t === ".") {
      if (nuevo) { pantalla = "0."; nuevo = false; }
      else if (pantalla.indexOf("E") === -1 && pantalla.indexOf(".") === -1) pantalla += ".";
    } else if (t === "←") {
      if (!nuevo) { pantalla = pantalla.slice(0, -1); if (pantalla === "" || pantalla === "-") { pantalla = "0"; nuevo = true; } }
    } else if (t === "C") {
      pantalla = "0"; guardado = null; operacion = null; nuevo = true; error = false;
    } else if (t === "±") {
      var e = pantalla.indexOf("E");
      if (e > -1 && !nuevo) {   // cambia el signo del exponente
        pantalla = pantalla.charAt(e + 1) === "-" ? pantalla.slice(0, e + 1) + pantalla.slice(e + 2) : pantalla.slice(0, e + 1) + "-" + pantalla.slice(e + 1);
      } else if (pantalla !== "0") {
        pantalla = pantalla.charAt(0) === "-" ? pantalla.slice(1) : "-" + pantalla;
      }
    } else if (t === "Exp") {
      if (pantalla.indexOf("E") === -1) { if (nuevo) pantalla = "1"; pantalla += "E"; nuevo = false; }
    } else if (["+", "−", "×", "÷", "^"].indexOf(t) > -1) {
      if (operacion && !nuevo && guardado !== null) poner(calcular(guardado, operacion, valor()));
      guardado = valor(); operacion = t; nuevo = true;
    } else if (t === "=") {
      if (operacion && guardado !== null) { var r = calcular(guardado, operacion, valor()); guardado = null; operacion = null; poner(r); }
    } else {
      var x = valor(), res;
      if (t === "√") res = x < 0 ? NaN : Math.sqrt(x);
      else if (t === "sen") res = limpiarTrig(Math.sin(x * RAD));
      else if (t === "cos") res = limpiarTrig(Math.cos(x * RAD));
      else if (t === "tan") res = Math.abs(Math.cos(x * RAD)) < 1e-12 ? NaN : limpiarTrig(Math.tan(x * RAD));
      else if (t === "log") res = x <= 0 ? NaN : Math.log10(x);
      poner(res);
    }
    mostrar();
  }

  var TECLAS = [
    ["←", "calc-borrar"], ["C", ""], ["±", ""], ["sen", "calc-fn"],
    ["7", ""], ["8", ""], ["9", ""], ["÷", "calc-op"], ["^", "calc-op", "xʸ"], ["cos", "calc-fn"],
    ["4", ""], ["5", ""], ["6", ""], ["×", "calc-op"], ["√", "calc-op"], ["tan", "calc-fn"],
    ["1", ""], ["2", ""], ["3", ""], ["−", "calc-op"], ["Exp", "calc-fn"], ["=", "calc-igual"],
    ["0", "ancha"], [".", ""], ["+", "calc-op"], ["log", "calc-fn"]
  ];
  function armar() {
    var cont = $("calc-teclas");
    TECLAS.forEach(function (k) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "calc-tecla " + k[1];
      b.textContent = k[2] || k[0];
      b.setAttribute("aria-label", { "←": "Borrar", "C": "Borrar todo", "±": "Cambiar signo", "^": "Potencia", "√": "Raíz cuadrada", "Exp": "Notación científica (×10 a la)", "sen": "Seno", "cos": "Coseno", "tan": "Tangente", "log": "Logaritmo base 10" }[k[0]] || k[0]);
      b.addEventListener("click", function () { tecla(k[0]); });
      cont.appendChild(b);
    });
    // Teclado de la computadora
    $("dlg-calc").addEventListener("keydown", function (ev) {
      var m = { "Enter": "=", "=": "=", "Backspace": "←", "Escape": null, "Delete": "C", "+": "+", "-": "−", "*": "×", "/": "÷", "^": "^", ".": ".", ",": "." };
      var k = /^[0-9]$/.test(ev.key) ? ev.key : m[ev.key];
      if (k) { ev.preventDefault(); tecla(k); }
    });
    mostrar();
  }
  function abrir() {
    var d = $("dlg-calc");
    if (d.showModal) d.showModal(); else d.setAttribute("open", "");
    $("calc-teclas").querySelector("button").focus();
  }
  function cerrar() { var d = $("dlg-calc"); if (d.close) d.close(); else d.removeAttribute("open"); }

  return { armar: armar, abrir: abrir, cerrar: cerrar, _tecla: tecla, _pantalla: function () { return pantalla; } };
})();
