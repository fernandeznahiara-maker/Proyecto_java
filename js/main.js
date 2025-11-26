// VARIABLES GLOBALES
let activities = JSON.parse(localStorage.getItem("activities")) || []; // Carga actividades guardadas o inicia lista vacía
let editingId = null; // Variable para ID de actividad en edición

// ELEMENTOS
const form = document.getElementById("activityForm"); // Obtiene el formulario de nueva actividad
const tableBody = document.getElementById("activityTableBody"); // Obtiene el cuerpo de la tabla
const emptyState = document.getElementById("emptyState"); // Obtiene el mensaje de estado vacío
const searchInput = document.getElementById("search"); // Obtiene el campo de búsqueda
const sortSelect = document.getElementById("sort"); // Obtiene el selector de orden
const filterButtons = document.querySelectorAll(".btn-filter"); // Obtiene todos los botones de filtro
const formMessage = document.createElement("p"); // Crea un párrafo para mensajes
formMessage.id = "formMessage"; // Asigna ID al mensaje
formMessage.classList.add("form-message", "hidden"); // Agrega clases al mensaje
form.insertAdjacentElement("afterend", formMessage); // Inserta el mensaje después del formulario

// Modal
const modal = document.getElementById("editModal"); // Obtiene el modal de edición
const modalClose = document.getElementById("btnCloseModal"); // Obtiene botón cerrar modal
const modalCancel = document.getElementById("btnCancelEdit"); // Obtiene botón cancelar edición

// Campos del modal
const editForm = document.getElementById("editForm"); // Obtiene el formulario de edición
const editTitle = document.getElementById("editTitle"); // Obtiene campo título edición
const editSubject = document.getElementById("editSubject"); // Obtiene campo materia edición
const editType = document.getElementById("editType"); // Obtiene selector tipo edición
const editDeadline = document.getElementById("editDeadline"); // Obtiene campo fecha edición

// Tema
const btnToggleTheme = document.getElementById("btnToggleTheme"); // Obtiene botón de tema

// MOSTRAR MENSAJES
function showMessage(text, type = "error") { // Define función con texto y tipo
formMessage.textContent = text; // Asigna texto al mensaje
formMessage.className = "form-message " + type; // Asigna clase según tipo
formMessage.classList.remove("hidden"); // Muestra el mensaje
setTimeout(() => formMessage.classList.add("hidden"), 2500); // Oculta después de 2.5 segundos
}

// GUARDAR EN LOCALSTORAGE
function saveToStorage() { // Define función
localStorage.setItem("activities", JSON.stringify(activities)); // Guarda actividades como string
}

// AGREGAR ACTIVIDAD
form.addEventListener("submit", (e) => { // Escucha envío del formulario
e.preventDefault(); // Evita comportamiento por defecto

const title = document.getElementById("title").value.trim(); // Obtiene título limpio
if (!title) return showMessage("El título es obligatorio"); // Valida título vacío

const estimatedTimeInput = document.getElementById("estimatedTime").value; // Obtiene tiempo input
const estimatedTime = estimatedTimeInput ? Number(estimatedTimeInput) : 0; // Convierte a número o 0
if (estimatedTime < 0) return showMessage("El tiempo estimado debe ser mayor o igual a 0"); // Valida tiempo no negativo

const activity = { // Crea objeto de actividad
    id: crypto.randomUUID(), // Genera ID único
    title, // Asigna título
    subject: document.getElementById("subject").value, // Asigna materia
    type: document.getElementById("type").value, // Asigna tipo
    difficulty: document.getElementById("difficulty").value, // Asigna dificultad
    estimatedTime, // Asigna tiempo
    priority: document.querySelector("input[name='priority']:checked").value, // Asigna prioridad seleccionada
    deadline: document.getElementById("deadline").value, // Asigna fecha
    notes: document.getElementById("notes").value, // Asigna notas
    important: document.getElementById("isImportant").checked, // Asigna si es importante
    completed: false // Inicia como no completada
};

activities.push(activity); // Agrega a la lista
saveToStorage(); // Guarda
renderTable(); // Actualiza tabla
updateStats(); // Actualiza estadísticas
form.reset(); // Limpia formulario

showMessage("Actividad agregada correctamente", "success"); // Muestra mensaje éxito
});

// RENDER TABLA
function renderTable() { // Define función
tableBody.innerHTML = ""; // Limpia cuerpo de tabla

const filtered = getFilteredActivities(); // Obtiene actividades filtradas

if (filtered.length === 0) { // Si no hay actividades
    emptyState.classList.remove("hidden"); // Muestra estado vacío
    return; // Sale
}

emptyState.classList.add("hidden"); // Oculta estado vacío

filtered.forEach((act) => { // Para cada actividad filtrada
    const template = document.getElementById("rowTemplate"); // Obtiene plantilla
    const clone = template.content.cloneNode(true); // Clona plantilla
    const row = clone.querySelector("tr"); // Obtiene fila

    row.dataset.id = act.id; // Asigna ID
    row.dataset.status = act.completed ? "completada" : "pendiente"; // Asigna estado

    if (act.important) row.classList.add("row-important"); // Agrega clase si importante
    if (act.completed) row.classList.add("row-done"); // Agrega clase si completada

    clone.querySelector(".row-title").textContent = act.title; // Asigna título
    clone.querySelector(".row-subject").textContent = act.subject; // Asigna materia
    clone.querySelector(".row-type").textContent = typeMap[act.type] || act.type; // Asigna tipo con mapa

    const badge = clone.querySelector(".badge--priority"); // Obtiene badge
    badge.textContent = act.priority.charAt(0).toUpperCase() + act.priority.slice(1); // Asigna prioridad capitalizada
    badge.classList.add(`priority-${act.priority}`); // Agrega clase por prioridad

    clone.querySelector(".row-deadline").textContent = act.deadline || "-"; // Asigna fecha o guion
    clone.querySelector(".row-time").textContent = act.estimatedTime || "-"; // Asigna tiempo o guion

    const checkbox = clone.querySelector(".row-complete"); // Obtiene checkbox
    checkbox.checked = act.completed; // Marca si completada
    checkbox.addEventListener("change", () => toggleCompleted(act.id)); // Escucha cambio

    clone.querySelector(".btn-edit").addEventListener("click", () => openModal(act.id)); // Escucha editar
    clone.querySelector(".btn-delete").addEventListener("click", () => deleteActivity(act.id)); // Escucha eliminar

    tableBody.appendChild(clone); // Agrega fila a tabla
});
}

// COMPLETAR ACTIVIDAD
function toggleCompleted(id) { // Define función con ID
activities = activities.map((a) => // Mapea actividades
    a.id === id ? { ...a, completed: !a.completed } : a // Cambia completada
);
saveToStorage(); // Guarda
renderTable(); // Actualiza tabla
updateStats(); // Actualiza stats
}

// ELIMINAR ACTIVIDAD
function deleteActivity(id) { // Define con ID
activities = activities.filter((a) => a.id !== id); // Filtra excluyendo ID
saveToStorage(); // Guarda
renderTable(); // Actualiza
updateStats(); // Actualiza
}

// EDITAR ACTIVIDAD - MODAL
function openModal(id) { // Define con ID
const act = activities.find((a) => a.id === id); // Encuentra actividad
editingId = id; // Asigna ID edición

editTitle.value = act.title; // Carga título
editSubject.value = act.subject; // Carga materia
editType.value = act.type; // Carga tipo
editDeadline.value = act.deadline; // Carga fecha

modal.classList.add("is-open"); // Abre modal
}

modalClose.onclick = () => modal.classList.remove("is-open"); // Cierra con X
modalCancel.onclick = () => modal.classList.remove("is-open"); // Cierra con cancelar

editForm.addEventListener("submit", (e) => { // Escucha envío edición
e.preventDefault(); // Evita default

activities = activities.map((a) => // Mapea
    a.id === editingId // Si es el ID
    ? {
        ...a, // Copia
        title: editTitle.value.trim(), // Actualiza título
        subject: editSubject.value, // Actualiza materia
        type: editType.value, // Actualiza tipo
        deadline: editDeadline.value // Actualiza fecha
        }
    : a // Mantiene
);

saveToStorage(); // Guarda
renderTable(); // Actualiza
updateStats(); // Actualiza

modal.classList.remove("is-open"); // Cierra modal
});

// FILTROS
function getFilteredActivities() { // Define función
let list = [...activities]; // Copia lista

  // filtro estado
const activeFilter = document.querySelector(".btn-filter.is-active").dataset.filter; // Obtiene filtro activo

if (activeFilter === "pendientes") list = list.filter((a) => !a.completed); // Solo pendientes
if (activeFilter === "completadas") list = list.filter((a) => a.completed); // Solo completadas

  // búsqueda
const q = searchInput.value.toLowerCase().trim(); // Obtiene query baja
if (q) { // Si hay query
    list = list.filter( // Filtra
    (a) =>
        a.title.toLowerCase().includes(q) || // Incluye en título
        a.subject.toLowerCase().includes(q) // O en materia
    );
}

  // ordenamiento
const sort = sortSelect.value; // Obtiene opción
if (sort === "titulo") list.sort((a, b) => a.title.localeCompare(b.title)); // Ordena por título
if (sort === "prioridad") { // Por prioridad
    const order = { alta: 1, media: 2, baja: 3 }; // Orden numérico
    list.sort((a, b) => order[a.priority] - order[b.priority]); // Ordena
}
if (sort === "fecha")
    list.sort((a, b) => (a.deadline || "").localeCompare(b.deadline || "")); // Ordena por fecha

return list; // Devuelve lista filtrada
}

// Eventos filtros
filterButtons.forEach((btn) => // Para cada botón filtro
btn.addEventListener("click", () => { // Escucha click
    filterButtons.forEach((b) => b.classList.remove("is-active")); // Quita activo
    btn.classList.add("is-active"); // Agrega activo
    renderTable(); // Actualiza tabla
})
);

searchInput.addEventListener("input", () => renderTable()); // Escucha input búsqueda
sortSelect.addEventListener("change", () => renderTable()); // Escucha cambio orden

// ESTADÍSTICAS
function updateStats() { // Define función
document.getElementById("statTotal").textContent = activities.length; // Total actividades
document.getElementById("statCompleted").textContent = activities.filter((a) => a.completed).length; // Completadas
document.getElementById("statPending").textContent = activities.filter((a) => !a.completed).length; // Pendientes
document.getElementById("statHours").textContent = activities.reduce((acc, a) => acc + (a.estimatedTime || 0), 0); // Suma horas
}

// CAMBIAR TEMA
btnToggleTheme.addEventListener("click", () => { // Escucha click
document.body.classList.toggle("theme-light"); // Alterna clase
localStorage.setItem( // Guarda preferencia
    "theme",
    document.body.classList.contains("theme-light") ? "light" : "dark"
);
});

(function loadTheme() { // Función autoejecutable para cargar tema
if (localStorage.getItem("theme") === "light") { // Si es light
    document.body.classList.add("theme-light"); // Agrega clase
}
})();

// Inicializar
renderTable(); // Renderiza tabla inicial
updateStats(); // Actualiza stats iniciales