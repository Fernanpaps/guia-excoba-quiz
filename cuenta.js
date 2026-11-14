// ============================================================
//  Cuentas de usuario y guardado del avance en Supabase
//  - Si no hay configuración o no carga Supabase, la página sigue
//    funcionando como invitado (sin guardar en la nube).
//  - Expone window.Cuenta, que usa app.js.
// ============================================================
(function () {
  "use strict";

  var cfg = window.EXCOBA_CONFIG || {};
  var cliente = null;
  var usuario = null;
  var oyentes = [];

  if (cfg.supabaseUrl && cfg.supabaseKey && window.supabase && window.supabase.createClient) {
    try {
      cliente = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey);
    } catch (e) { cliente = null; }
  }

  function avisar() { oyentes.forEach(function (fn) { try { fn(usuario); } catch (e) {} }); }

  // Traduce los errores más comunes de Supabase a algo entendible
  function traducir(err) {
    var m = (err && (err.message || err.error_description)) || String(err || "");
    var l = m.toLowerCase();
    if (l.indexOf("invalid login") !== -1) return "Correo o contraseña incorrectos.";
    if (l.indexOf("email not confirmed") !== -1) return "Tu correo aún no está confirmado. Revisa tu bandeja (y spam) y abre el enlace.";
    if (l.indexOf("already registered") !== -1 || l.indexOf("already been registered") !== -1) return "Ese correo ya tiene cuenta. Usa \"Iniciar sesión\".";
    if (l.indexOf("password should be") !== -1 || l.indexOf("at least 6") !== -1) return "La contraseña debe tener al menos 6 caracteres.";
    if (l.indexOf("rate limit") !== -1 || l.indexOf("too many") !== -1) return "Demasiados intentos seguidos. Espera unos minutos y vuelve a intentar.";
    if (l.indexOf("invalid email") !== -1 || l.indexOf("unable to validate email") !== -1) return "Ese correo no parece válido.";
    if (l.indexOf("failed to fetch") !== -1 || l.indexOf("network") !== -1) return "No hay conexión. Revisa tu internet.";
    return "Algo salió mal: " + m;
  }

  var Cuenta = {
    disponible: function () { return !!cliente; },
    usuario: function () { return usuario; },
    alCambiar: function (fn) { oyentes.push(fn); },

    entrar: function (correo, clave) {
      return cliente.auth.signInWithPassword({ email: correo, password: clave }).then(function (r) {
        if (r.error) throw new Error(traducir(r.error));
        return r.data;
      });
    },

    // Devuelve { necesitaConfirmar: true } si Supabase pide confirmar el correo
    registrar: function (correo, clave) {
      return cliente.auth.signUp({
        email: correo, password: clave,
        options: { emailRedirectTo: location.origin + location.pathname }
      }).then(function (r) {
        if (r.error) throw new Error(traducir(r.error));
        // Supabase no avisa si el correo ya existía: lo detectamos así
        if (r.data.user && r.data.user.identities && r.data.user.identities.length === 0) {
          throw new Error("Ese correo ya tiene cuenta. Usa \"Iniciar sesión\".");
        }
        return { necesitaConfirmar: !r.data.session };
      });
    },

    salir: function () { return cliente.auth.signOut(); },

    // { records: {...}, falladas: [...] } o null si aún no tiene nada guardado
    cargarProgreso: function () {
      if (!usuario) return Promise.resolve(null);
      return cliente.from("progreso").select("records, falladas").eq("user_id", usuario.id).maybeSingle()
        .then(function (r) { if (r.error) throw r.error; return r.data; });
    },

    guardarProgreso: function (records, falladas) {
      if (!usuario) return Promise.resolve();
      return cliente.from("progreso").upsert({
        user_id: usuario.id, records: records, falladas: falladas, updated_at: new Date().toISOString()
      }).then(function (r) { if (r.error) throw r.error; });
    },

    guardarIntento: function (titulo, aciertos, total) {
      if (!usuario || !total) return Promise.resolve();
      return cliente.from("intentos").insert({
        user_id: usuario.id, titulo: titulo, aciertos: aciertos, total: total,
        porcentaje: Math.round(aciertos / total * 100)
      }).then(function (r) { if (r.error) throw r.error; });
    },

    historial: function (n) {
      if (!usuario) return Promise.resolve([]);
      return cliente.from("intentos").select("titulo, aciertos, total, porcentaje, created_at")
        .order("created_at", { ascending: false }).limit(n || 5)
        .then(function (r) { if (r.error) throw r.error; return r.data || []; });
    },

    traducir: traducir
  };

  if (cliente) {
    cliente.auth.onAuthStateChange(function (_evento, sesion) {
      var nuevo = sesion ? sesion.user : null;
      var antes = usuario ? usuario.id : null;
      usuario = nuevo;
      // setTimeout: Supabase recomienda no hacer consultas dentro de este callback
      if ((nuevo ? nuevo.id : null) !== antes) setTimeout(avisar, 0);
    });
  }

  window.Cuenta = Cuenta;
})();
