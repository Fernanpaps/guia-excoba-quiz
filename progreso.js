// ============================================================
//  Progreso y repaso inteligente
//  - Guarda cuántas preguntas has contestado por tema y qué tan bien.
//  - Las preguntas que fallas vuelven a salir hasta que las aciertes
//    3 veces seguidas (al día siguiente, a los 3 días...).
//  - Se guarda en este navegador y, si tienes cuenta, también en la nube.
// ============================================================
window.Progreso = (function () {
  "use strict";
  var CLAVE = "excoba-stats", DIA = 86400000;
  var datos = cargar();

  function vacio() { return { upd: 0, temas: {}, repaso: {}, examen: "" }; }
  function cargar() {
    try {
      var d = JSON.parse(localStorage.getItem(CLAVE) || "null");
      if (d && d.temas && d.repaso) return d;
    } catch (e) {}
    return vacio();
  }
  function guardar() {
    datos.upd = Date.now();
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) {}
  }

  // nota: 0 a 1. clave: la de la pregunta (para el repaso)
  function registrar(clave, materiaId, tema, nota) {
    var k = materiaId + "|" + tema;
    var t = datos.temas[k] || (datos.temas[k] = { v: 0, p: 0, u: 0 });
    t.v++; t.p = Math.round((t.p + nota) * 100) / 100; t.u = Date.now();
    var r = datos.repaso[clave];
    if (nota < 1) {
      // Fallada: vuelve a salir pronto
      datos.repaso[clave] = { f: (r ? r.f : 0) + 1, s: 0, prox: Date.now() };
    } else if (r) {
      // Acertada: cada vez sale más espaciada; a las 3 seguidas se da por dominada
      r.s++;
      if (r.s >= 3) delete datos.repaso[clave];
      else r.prox = Date.now() + (r.s === 1 ? 1 : 3) * DIA;
    }
  }

  function esPendiente(clave) { var r = datos.repaso[clave]; return !!r && r.prox <= Date.now(); }
  function pendientes() {
    var ahora = Date.now();
    return Object.keys(datos.repaso).filter(function (k) { return datos.repaso[k].prox <= ahora; })
      .sort(function (a, b) { return datos.repaso[b].f - datos.repaso[a].f; });
  }
  function totalEnRepaso() { return Object.keys(datos.repaso).length; }
  function tema(materiaId, t) { return datos.temas[materiaId + "|" + t] || null; }

  // Estado de un tema: sin practicar, flojo, en proceso o dominado
  function estadoTema(st) {
    if (!st || !st.v) return { clase: "nuevo", txt: "Sin practicar", pct: null };
    var pct = Math.round(st.p / st.v * 100);
    if (pct >= 80 && st.v >= 5) return { clase: "dominado", txt: "Dominado", pct: pct };
    if (pct < 50) return { clase: "flojo", txt: "Flojo", pct: pct };
    return { clase: "proceso", txt: "En proceso", pct: pct };
  }

  function fechaExamen() { return datos.examen || ""; }
  function ponerFecha(f) { datos.examen = f; guardar(); }

  // Para guardarlo en la cuenta (nube)
  function exportar() { return datos; }
  function importar(otro) {
    if (otro && otro.temas && otro.repaso && (otro.upd || 0) > (datos.upd || 0)) {
      datos = otro;
      try { localStorage.setItem(CLAVE, JSON.stringify(datos)); } catch (e) {}
      return true;
    }
    return false;
  }

  return {
    registrar: registrar, guardar: guardar, esPendiente: esPendiente, pendientes: pendientes, totalEnRepaso: totalEnRepaso,
    tema: tema, estadoTema: estadoTema, fechaExamen: fechaExamen, ponerFecha: ponerFecha, exportar: exportar, importar: importar
  };
})();
