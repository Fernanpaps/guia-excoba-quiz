// Este archivo prepara el "banco" donde se guardan todas las materias.
// Cada archivo dentro de /data llama a agregarMateria(...) para registrar sus preguntas.
window.MATERIAS = [];

function agregarMateria(id, nombre, icono, preguntas) {
  window.MATERIAS.push({ id: id, nombre: nombre, icono: icono, preguntas: preguntas });
}
