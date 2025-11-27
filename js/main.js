// ===============================
// VARIABLES GLOBALES
// ===============================
let activities = JSON.parse(localStorage.getItem("activities")) || []; // Lista de tareas (array)
let editingId = null; // ID para editar

// ELEMENTOS DEL HTML
const form = document.getElementById("activityForm"); // Formulario de agregar
const tableBody = document.getElementById("activityTableBody"); // Cuerpo de la tabla
const emptyState = document.getElementById("emptyState"); // Mensaje "No hay actividades"
const searchInput = document.getElementById("search"); // Campo de búsqueda
const sortSelect = document.getElementById("sort"); // Selector de orden
const filterButtons = document.querySelectorAll(".btn-filter"); // Botones de filtro
const formMessage = document.createElement("p"); // Mensaje de error/éxito
formMessage.id = "formMessage";
formMessage.classList.add("form-message", "hidden");
form.insertAdjacentElement("afterend", formMessage); // Lo pone después del form

// Modal de edición
const modal = document.getElementById("editModal");
const modalClose = document.getElementById("btnCloseModal");
const modalCancel = document.getElementById("btnCancelEdit");
const editForm = document.getElementById("editForm");
const editTitle = document.getElementById("editTitle");
const editSubject = document.getElementById("editSubject");
const editType = document.getElementById("editType");
const editDeadline = document.getElementById("editDeadline");

// Botón tema
const btnToggleTheme = document.getElementById("btnToggleTheme");

// Mapa para mostrar tipos bonitos
const typeMap = {
  lectura: "Lectura teórica",
  practica: "Práctica / ejercicios",
  proyecto: "Proyecto / integrador",
  evaluacion: "Evaluación / parcial"
};

// ===============================
// MOSTRAR MENSAJES (punto 11: extras creativos)
// ===============================
function showMessage(text, type = "error") {
  formMessage.textContent = text; // Pone el texto
  formMessage.className = "form-message " + type; // Clase error o success
  formMessage.classList.remove("hidden"); // Lo muestra
  setTimeout(() => formMessage.classList.add("hidden"), 2500); // Lo esconde en 2.5 seg
}

// ===============================
// GUARDAR EN LOCALSTORAGE (para que no se borre al cerrar)
// ===============================
function saveToStorage() {
  localStorage.setItem("activities", JSON.stringify(activities)); // Guarda el array como texto
}

// ===============================
// AGREGAR ACTIVIDAD (punto 1: alta + validación)
// ===============================
form.addEventListener("submit", (e) => { // Escucha cuando enviás el form
  e.preventDefault(); // Evita que la página se recargue

  const title = document.getElementById("title").value.trim(); // Toma el título
  if (!title) return showMessage("El título es obligatorio"); // Si vacío, error

  const estimatedTimeInput = document.getElementById("estimatedTime").value; // Toma tiempo
  const estimatedTime = estimatedTimeInput ? Number(estimatedTimeInput) : 0; // Lo convierte a número
  if (estimatedTime < 0) return showMessage("El tiempo debe ser mayor o igual a 0"); // Valida

  // Crea el objeto de la tarea
  const activity = {
    id: crypto.randomUUID(), // ID único
    title, // Título
    subject: document.getElementById("subject").value, // Materia
    type: document.getElementById("type").value, // Tipo
    difficulty: document.getElementById("difficulty").value, // Dificultad
    estimatedTime, // Tiempo
    priority: document.querySelector("input[name='priority']:checked").value, // Prioridad
    deadline: document.getElementById("deadline").value, // Fecha
    notes: document.getElementById("notes").value, // Notas
    important: document.getElementById("isImportant").checked, // Importante?
    completed: false // No completada al inicio
  };

  activities.push(activity); // Agrega a la lista
  saveToStorage(); // Guarda
  renderTable(); // Dibuja la tabla (punto 2)
  updateStats(); // Actualiza contadores (punto 5)
  form.reset(); // Limpia el form

  showMessage("¡Actividad agregada!", "success"); // Mensaje éxito
});

// ===============================
// DIBUJAR TABLA (puntos 2, 6, 7, 8: listado + filtro + búsqueda + orden)
// ===============================
function renderTable() {
  tableBody.innerHTML = ""; // Borra la tabla vieja

  const filtered = getFilteredActivities(); // Aplica filtros y orden (ver abajo)

  if (filtered.length === 0) { // Si no hay nada
    emptyState.classList.remove("hidden"); // Muestra "No hay actividades"
    return;
  }

  emptyState.classList.add("hidden"); // Esconde el mensaje

  filtered.forEach((act) => { // Para cada tarea
    const template = document.getElementById("rowTemplate"); // Toma el molde
    const clone = template.content.cloneNode(true); // Lo copia
    const row = clone.querySelector("tr"); // La fila copiada

    row.dataset.id = act.id; // ID
    row.dataset.status = act.completed ? "completada" : "pendiente"; // Estado

    if (act.important) row.classList.add("row-important"); // Fondo rosa si importante (punto 11)
    if (act.completed) row.classList.add("row-done"); // Tachado si completada (punto 3)

    // Llena la fila
    clone.querySelector(".row-title").textContent = act.title; // Título
    clone.querySelector(".row-subject").textContent = act.subject; // Materia
    clone.querySelector(".row-type").textContent = typeMap[act.type] || act.type; // Tipo bonito

    const badge = clone.querySelector(".badge--priority"); // Badge prioridad
    badge.textContent = act.priority.charAt(0).toUpperCase() + act.priority.slice(1); // "Alta"
    badge.classList.add(`priority-${act.priority}`); // Color según prioridad (punto 11)

    clone.querySelector(".row-deadline").textContent = act.deadline || "-"; // Fecha
    clone.querySelector(".row-time").textContent = act.estimatedTime || "-"; // Tiempo

    // Checkbox completar (punto 3)
    const checkbox = clone.querySelector(".row-complete");
    checkbox.checked = act.completed;
    checkbox.addEventListener("change", () => toggleCompleted(act.id));

    // Botones editar y eliminar (puntos 4 y 9)
    clone.querySelector(".btn-edit").addEventListener("click", () => openModal(act.id));
    clone.querySelector(".btn-delete").addEventListener("click", () => deleteActivity(act.id));

    tableBody.appendChild(clone); // Agrega la fila a la tabla
  });
}

// ===============================
// COMPLETAR TAREA (punto 3)
// ===============================
function toggleCompleted(id) {
  activities = activities.map((a) => // Cambia solo esa tarea
    a.id === id ? { ...a, completed: !a.completed } : a
  );
  saveToStorage();
  renderTable(); // Vuelve a dibujar
  updateStats();
}

// ===============================
// ELIMINAR TAREA (punto 4)
// ===============================
function deleteActivity(id) {
  activities = activities.filter((a) => a.id !== id); // Quita la tarea
  saveToStorage();
  renderTable();
  updateStats();
}

// ===============================
// EDITAR CON MODAL (punto 9)
// ===============================
function openModal(id) {
  const act = activities.find((a) => a.id === id); // Encuentra la tarea
  editingId = id;

  editTitle.value = act.title; // Llena el modal
  editSubject.value = act.subject;
  editType.value = act.type;
  editDeadline.value = act.deadline;

  modal.classList.add("is-open"); // Abre el modal
}

modalClose.onclick = () => modal.classList.remove("is-open"); // Cierra con X
modalCancel.onclick = () => modal.classList.remove("is-open"); // Cierra con Cancelar

editForm.addEventListener("submit", (e) => {
  e.preventDefault();

  activities = activities.map((a) => // Actualiza solo esa tarea
    a.id === editingId
      ? {
          ...a,
          title: editTitle.value.trim(),
          subject: editSubject.value,
          type: editType.value,
          deadline: editDeadline.value
        }
      : a
  );

  saveToStorage();
  renderTable();
  updateStats();
  modal.classList.remove("is-open"); // Cierra
});

// ===============================
// FILTROS + BÚSQUEDA + ORDEN (puntos 6, 7, 8)
// ===============================
function getFilteredActivities() {
  let list = [...activities]; // Copia la lista

  // Filtro por estado (punto 6)
  const activeFilter = document.querySelector(".btn-filter.is-active").dataset.filter;
  if (activeFilter === "pendientes") list = list.filter((a) => !a.completed);
  if (activeFilter === "completadas") list = list.filter((a) => a.completed);

  // Búsqueda (punto 7)
  const q = searchInput.value.toLowerCase().trim();
  if (q) {
    list = list.filter(
      (a) => a.title.toLowerCase().includes(q) || a.subject.toLowerCase().includes(q)
    );
  }

  // Orden (punto 8)
  const sort = sortSelect.value;
  if (sort === "titulo") list.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "prioridad") {
    const order = { alta: 1, media: 2, baja: 3 };
    list.sort((a, b) => order[a.priority] - order[b.priority]);
  }
  if (sort === "fecha")
    list.sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));

  return list; // Lista lista para dibujar
}

// Eventos para filtros, búsqueda y orden
filterButtons.forEach((btn) =>
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    renderTable();
  })
);

searchInput.addEventListener("input", () => renderTable()); // Búsqueda en vivo
sortSelect.addEventListener("change", () => renderTable()); // Orden al cambiar

// ===============================
// ESTADÍSTICAS (punto 5)
// ===============================
function updateStats() {
  document.getElementById("statTotal").textContent = activities.length; // Total
  document.getElementById("statCompleted").textContent = activities.filter((a) => a.completed).length; // Completadas
  document.getElementById("statPending").textContent = activities.filter((a) => !a.completed).length; // Pendientes
  document.getElementById("statHours").textContent = activities.reduce((acc, a) => acc + (a.estimatedTime || 0), 0); // Horas (solo las que tienen)
}

// ===============================
// TEMA CLARO/OSCuro (punto 10)
// ===============================
btnToggleTheme.addEventListener("click", () => {
  document.body.classList.toggle("theme-light"); // Cambia clase
localStorage.setItem(
    "theme",
    document.body.classList.contains("theme-light") ? "light" : "dark"
  ); // Guarda
});

// Carga el tema al abrir
(function loadTheme() {
if (localStorage.getItem("theme") === "light") {
    document.body.classList.add("theme-light");
}
})();

// ===============================
// INICIALIZAR (se ejecuta al cargar la página)
// ===============================
renderTable(); // Dibuja tabla inicial
updateStats(); // Contadores iniciales