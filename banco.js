// Este archivo prepara el "banco" donde se guardan todas las materias.
// Cada archivo dentro de /data llama a agregarMateria(...) para registrar sus preguntas.
window.MATERIAS = [];

function agregarMateria(id, nombre, icono, preguntas) {
  window.MATERIAS.push({ id: id, nombre: nombre, icono: icono, preguntas: preguntas });
}

// Los archivos de /data/examen agregan preguntas (con el formato del examen real)
// a una materia que ya existe.
function agregarPreguntas(id, preguntas) {
  for (var i = 0; i < window.MATERIAS.length; i++) {
    if (window.MATERIAS[i].id === id) {
      window.MATERIAS[i].preguntas = window.MATERIAS[i].preguntas.concat(preguntas);
      return;
    }
  }
}
