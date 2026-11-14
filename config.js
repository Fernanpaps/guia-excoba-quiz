// ============================================================
//  Conexión con Supabase (para las cuentas y guardar el avance)
//  Los dos datos salen de Supabase → Project Settings → API (o "Connect").
//  La "publishable key" (o "anon key") es pública: puede ir aquí sin problema,
//  la seguridad la ponen las reglas (RLS) de supabase/schema.sql.
//  Si se dejan vacíos, la página funciona igual, solo que sin cuentas.
// ============================================================
window.EXCOBA_CONFIG = {
  supabaseUrl: "https://cxiyzsiutpbtamipsjge.supabase.co",
  supabaseKey: "sb_publishable_EIFCtf7dDq1ve8oOPvxruA_A8akVNbG"
};
