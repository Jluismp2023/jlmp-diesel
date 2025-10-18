import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCElg_et8_Z8ERTWo5tAwZJk2tb2ztUwlc",
    authDomain: "jlmp-diesel.firebaseapp.com",
    projectId: "jlmp-diesel",
    storageBucket: "jlmp-diesel.appspot.com",
    messagingSenderId: "763318949751",
    appId: "1:763318949751:web:e712d1008d34fbc98ab372"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const vistaLogin = document.getElementById('vista-login');
const vistaApp = document.getElementById('vista-app');
const btnLogout = document.getElementById('btn-logout');

let todosLosConsumos = [];
// ===== INICIO DE LÍNEA MODIFICADA =====
let listasAdmin = { choferes: [], placas: [], detallesVolqueta: [], empresas: [], proveedores: [], proyectos: [] };
// ===== FIN DE LÍNEA MODIFICADA =====
let appInicializada = false;
let tabActivaParaImprimir = null;

onAuthStateChanged(auth, (user) => {
    // Verificar elementos críticos al cambiar estado de auth
    if (!vistaLogin || !vistaApp) {
        console.error("¡ERROR CRÍTICO! 'vista-login' o 'vista-app' no encontrados.");
        // Podríamos intentar encontrarlos de nuevo, pero si falló al inicio, probablemente falle aquí también.
        // Mejor detener o mostrar un mensaje de error al usuario.
        document.body.innerHTML = "<h1>Error crítico: Elementos principales de la interfaz no encontrados. Recargue la página.</h1>";
        return;
    }

    if (user) {
        vistaLogin.style.display = 'none';
        vistaApp.style.display = 'block';
        if (btnLogout) btnLogout.style.display = 'block';
        if (!appInicializada) {
            iniciarAplicacion();
            appInicializada = true;
        }
    } else {
        vistaLogin.style.display = 'block';
        vistaApp.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'none';
        appInicializada = false;
    }
});


function mostrarNotificacion(texto, tipo = 'info', duracion = 3500) {
    let backgroundColor;
    switch (tipo) {
        case 'exito': backgroundColor = "linear-gradient(to right, #00b09b, #96c93d)"; break;
        case 'error': backgroundColor = "linear-gradient(to right, #ff5f6d, #ffc371)"; break;
        default: backgroundColor = "#007bff"; break;
    }
    Toastify({ text: texto, duration: duracion, close: true, gravity: "top", position: "right", stopOnFocus: true, style: { background: backgroundColor, } }).showToast();
}

const modal = document.getElementById('modalRegistro');
const btnAbrirModal = document.getElementById('btnAbrirModal');
const btnCerrarModal = modal ? modal.querySelector('.close-button') : null;

function abrirModal() { 
    if(modal) modal.style.display = 'block'; 
}
function cerrarModal() { 
    if(modal) modal.style.display = 'none'; 
    reiniciarFormulario(); 
}

function openMainTab(evt, tabName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("main-tab-content");
    if (!tabcontent) return;
    for (i = 0; i < tabcontent.length; i++) { if(tabcontent[i]?.style) tabcontent[i].style.display = "none"; }
    
    tablinks = document.getElementsByClassName("main-tab-link");
    if(tablinks){
        for (i = 0; i < tablinks.length; i++) { if(tablinks[i]) tablinks[i].className = tablinks[i].className.replace(" active", ""); }
    }
    
    const tabElement = document.getElementById(tabName);
    if (tabElement?.style) { tabElement.style.display = "block"; } 
    else { console.error("No se encontró el contenido de la pestaña:", tabName); }

    const buttonToActivate = evt ? evt.currentTarget : document.getElementById(`btnTab${tabName.replace('tab','')}`);
    if (buttonToActivate) { buttonToActivate.className += " active"; }
}

// ===== INICIO DE FUNCIÓN MODIFICADA =====
async function cargarDatosIniciales() {
    const loadingMessageElement = document.getElementById('loadingMessage');
    const loaderContainer = document.getElementById('loaderContainer');
    if (loadingMessageElement) loadingMessageElement.style.display = 'block';
    if (loaderContainer) loaderContainer.style.display = 'block';

    try {
        const [
            consumosRes, choferesRes, placasRes, detallesVolquetaRes, // Añadir detallesVolquetaRes
            empresasRes, proveedoresRes, proyectosRes
        ] = await Promise.all([
            getDocs(query(collection(db, "consumos"), orderBy("fecha", "desc"))), 
            getDocs(query(collection(db, "choferes"), orderBy("nombre"))), 
            getDocs(query(collection(db, "placas"), orderBy("nombre"))), 
            getDocs(query(collection(db, "detallesVolqueta"), orderBy("nombre"))), // Cargar nueva colección
            getDocs(query(collection(db, "empresas"), orderBy("nombre"))), 
            getDocs(query(collection(db, "proveedores"), orderBy("nombre"))), 
            getDocs(query(collection(db, "proyectos"), orderBy("nombre")))
        ]);
        todosLosConsumos = consumosRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.choferes = choferesRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.placas = placasRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.detallesVolqueta = detallesVolquetaRes.docs.map(doc => ({ id: doc.id, ...doc.data() })); // Guardar nueva lista
        listasAdmin.empresas = empresasRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.proveedores = proveedoresRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.proyectos = proyectosRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        actualizarTodaLaUI();
    } catch (error) {
        console.error("Error cargando datos:", error);
        if(loadingMessageElement) loadingMessageElement.textContent = "Error al cargar datos. Revisa la consola (F12).";
    } finally {
        if (loaderContainer) { loaderContainer.style.display = 'none'; }
    }
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

function actualizarTodaLaUI() {
    try {
        poblarFiltroDeMes();
        poblarFiltrosReportes();
        const consumosFiltrados = obtenerConsumosFiltrados();
        if (!Array.isArray(consumosFiltrados)) throw new Error("consumosFiltrados no es un array"); // Verificación
        
        calcularYMostrarTotalesPorEmpresa(consumosFiltrados);
        calcularYMostrarTotalesPorProveedor(consumosFiltrados);
        calcularYMostrarTotalesPorProyecto(consumosFiltrados);
        calcularYMostrarTotalesPorChofer(consumosFiltrados);
        calcularYMostrarTotales(consumosFiltrados);
        poblarSelectores();
        mostrarListasAdmin();
        mostrarHistorialAgrupado(consumosFiltrados);
    } catch (error) {
        console.error("Error en actualizarTodaLaUI:", error);
        mostrarNotificacion("Error al actualizar la interfaz.", "error");
    }
}

// ===== INICIO DE FUNCIÓN MODIFICADA =====
function poblarSelectores() {
    const selectores = { 
        choferes: document.getElementById('selectChofer'), 
        placas: document.getElementById('selectVolqueta'), 
        detallesVolqueta: document.getElementById('selectDetallesVolqueta'), // Nuevo selector
        empresas: document.getElementById('selectEmpresa'), 
        proveedores: document.getElementById('selectProveedor'), 
        proyectos: document.getElementById('selectProyecto') 
    };
    const titulos = { 
        choferes: '--- Chofer ---', 
        placas: '--- Placa ---', 
        detallesVolqueta: '--- Detalles Volqueta ---', // Nuevo título
        empresas: '--- Empresa ---', 
        proveedores: '--- Proveedor ---', 
        proyectos: '--- Proyecto ---' 
    };
    for (const tipo in selectores) {
        const select = selectores[tipo];
        // Asegurarse que la lista y el título existen
        if (!select || !listasAdmin[tipo] || !titulos[tipo]) {
            // console.warn(`Selector, lista o título no encontrado para tipo: ${tipo}`); // Opcional
            continue; 
        }
        const valorActual = select.value;
        select.innerHTML = `<option value="">${titulos[tipo]}</option>`; 
        listasAdmin[tipo].forEach(item => { select.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });
        select.value = valorActual;
    }
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

function reiniciarFormulario() {
    const form = document.getElementById('consumoForm');
    if(form) form.reset();
    const regId = document.getElementById('registroId');
    if(regId) regId.value = '';
    const fechaInput = document.getElementById('fecha');
    if(fechaInput) fechaInput.valueAsDate = new Date();
    const formTitle = document.getElementById('formularioTitulo');
    if(formTitle) formTitle.textContent = 'Nuevo Registro';
    poblarSelectores();
}

// ===== INICIO DE FUNCIÓN MODIFICADA =====
async function guardarOActualizar(e) {
    e.preventDefault();
    const btnGuardar = document.getElementById('btnGuardar');
    if(btnGuardar){
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';
    }

    const id = document.getElementById('registroId').value;
    
    const datosConsumo = {
        volqueta: document.getElementById('selectVolqueta').value,
        fecha: document.getElementById('fecha').value,
        hora: document.getElementById('hora').value,
        numeroFactura: document.getElementById('numeroFactura').value,
        galones: document.getElementById('galones').value,
        costo: document.getElementById('costo').value,
        descripcion: document.getElementById('descripcion').value,
        chofer: document.getElementById('selectChofer').value,
        empresa: document.getElementById('selectEmpresa').value,
        proveedor: document.getElementById('selectProveedor').value,
        proyecto: document.getElementById('selectProyecto').value,
        // Nuevos campos
        detallesVolqueta: document.getElementById('selectDetallesVolqueta').value || "", 
        kilometraje: document.getElementById('kilometraje').value || null 
    };

    if (!datosConsumo.chofer || !datosConsumo.volqueta) {
        mostrarNotificacion("Por favor, complete al menos el chofer y la placa.", "error");
        if(btnGuardar){
             btnGuardar.disabled = false;
             btnGuardar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Registro';
        }
        return;
    }

    try {
        if (id) {
            await updateDoc(doc(db, "consumos", id), datosConsumo);
            mostrarNotificacion("Registro actualizado con éxito", "exito");
        } else {
            await addDoc(collection(db, "consumos"), datosConsumo);
            mostrarNotificacion("Registro guardado con éxito", "exito");
        }
        reiniciarFormulario();
        cerrarModal();
        await cargarDatosIniciales(); // Recargar datos después de guardar/actualizar
    } catch (error) {
        console.error("Error guardando en Firestore:", error);
        mostrarNotificacion(`Error al guardar: ${error.message}`, "error", 5000);
    } finally {
        if(btnGuardar){
             btnGuardar.disabled = false;
             btnGuardar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Registro';
        }
    }
}
// ===== FIN DE FUNCIÓN MODIFICADA =====


// ===== INICIO DE FUNCIÓN MODIFICADA =====
async function agregarItemAdmin(tipo, inputElement) {
    // Definir colecciones permitidas
    const coleccionesPermitidas = ["choferes", "placas", "detallesVolqueta", "empresas", "proveedores", "proyectos"];
    if (!coleccionesPermitidas.includes(tipo)) {
        console.error("Tipo de item no permitido para agregar:", tipo);
        mostrarNotificacion("Error interno.", "error");
        return;
    }
    if (!inputElement) {
         console.error("Input element no proporcionado para agregar item admin.");
         return;
    }

    const valor = (tipo === 'placas') ? inputElement.value.trim().toUpperCase() : inputElement.value.trim();
    if (valor && listasAdmin[tipo]) { // Verificar que la lista existe
        const listaNombres = listasAdmin[tipo].map(item => item.nombre.toUpperCase());
        if (listaNombres.includes(valor.toUpperCase())) { mostrarNotificacion(`"${valor}" ya existe.`, "error"); return; }
        try {
            await addDoc(collection(db, tipo), { nombre: valor });
            mostrarNotificacion(`Elemento agregado correctamente.`, "exito");
            inputElement.value = '';
            await cargarDatosIniciales(); // Recargar para actualizar UI
        } catch (error) {
            console.error("Error agregando:", error);
            mostrarNotificacion("No se pudo agregar el elemento.", "error");
        }
    } else if (!listasAdmin[tipo]) {
         console.error(`La lista para el tipo "${tipo}" no existe en listasAdmin.`);
    }
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

function manejarAccionesHistorial(e) { 
    const target = e.target.closest('button');
    if (!target) return;
    const id = target.dataset.id; 
    if (!id) return; 
    if (target.classList.contains('btn-modificar')) cargarDatosParaModificar(id); 
    if (target.classList.contains('btn-borrar')) borrarConsumoHistorial(id); 
}

function obtenerConsumosFiltrados() {
    try {
        const obtenerValorFiltro = (syncId) => {
            const el = document.querySelector(`.filtro-sincronizado[data-sync-id="${syncId}"]`);
            return el ? el.value : (syncId.startsWith('filtroFecha') ? '' : 'todos');
        };
        const mes = obtenerValorFiltro('filtroMes');
        const fechaInicio = obtenerValorFiltro('filtroFechaInicio');
        const fechaFin = obtenerValorFiltro('filtroFechaFin');
        const chofer = obtenerValorFiltro('filtroChofer');
        const proveedor = obtenerValorFiltro('filtroProveedor');
        const empresa = obtenerValorFiltro('filtroEmpresa');
        const proyecto = obtenerValorFiltro('filtroProyecto');
        
        let consumosFiltrados = todosLosConsumos; 
        if (fechaInicio && fechaFin) { if (fechaFin < fechaInicio) { mostrarNotificacion("La fecha de fin no puede ser anterior a la de inicio.", "error"); return []; } consumosFiltrados = consumosFiltrados.filter(c => c.fecha >= fechaInicio && c.fecha <= fechaFin); } else if (fechaInicio) { consumosFiltrados = consumosFiltrados.filter(c => c.fecha === fechaInicio); } else if (mes !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.fecha && c.fecha.startsWith(mes)); } 
        if (chofer !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.chofer === chofer); }
        if (proveedor !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.proveedor === proveedor); }
        if (empresa !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.empresa === empresa); }
        if (proyecto !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.proyecto === proyecto); }
        
        return consumosFiltrados;
    } catch (error) {
        console.error("Error en obtenerConsumosFiltrados:", error);
        return []; // Devolver array vacío en caso de error
    }
}

// ===== INICIO DE FUNCIÓN MODIFICADA =====
function mostrarListasAdmin() {
    const contenedores = { 
        choferes: 'listaChoferes', 
        placas: 'listaPlacas', 
        detallesVolqueta: 'listaDetallesVolqueta', // Nuevo contenedor
        empresas: 'listaEmpresas', 
        proveedores: 'listaProveedores', 
        proyectos: 'listaProyectos' 
    };
    for (const tipo in contenedores) {
        const ul = document.getElementById(contenedores[tipo]);
        if (!ul || !listasAdmin[tipo]) { // Verificar ambos
             if(ul) ul.innerHTML = `<li class="empty-state">Error al cargar datos.</li>`;
             continue; 
        }
        ul.innerHTML = '';
        if (listasAdmin[tipo].length === 0) { ul.innerHTML = `<li class="empty-state">No hay elementos.</li>`; continue; }
        // Ordenar alfabéticamente
        const listaOrdenada = [...listasAdmin[tipo]].sort((a, b) => a.nombre.localeCompare(b.nombre));
        listaOrdenada.forEach(item => {
            const li = document.createElement('li');
            // Añadir data-id a los botones dentro del li
            li.innerHTML = `<span>${item.nombre}</span>
                          <div>
                              <button class="btn-accion btn-modificar button-warning" data-id="${item.id}" title="Modificar"><i class="fa-solid fa-pencil" style="margin:0;"></i></button>
                              <button class="btn-accion btn-borrar" data-id="${item.id}" title="Borrar"><i class="fa-solid fa-trash-can" style="margin:0;"></i></button>
                          </div>`;
            // Asignar eventos directamente aquí puede ser más limpio si la lógica se complica
             li.querySelector('.btn-modificar').addEventListener('click', () => modificarItemAdmin(item, tipo));
             li.querySelector('.btn-borrar').addEventListener('click', () => borrarItemAdmin(item, tipo));
            ul.appendChild(li);
        });
    }
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

// ===== INICIO DE FUNCIÓN MODIFICADA =====
async function modificarItemAdmin(item, tipo) { 
    const valorActual = item.nombre; 
    const nuevoValor = prompt(`Modificar "${valorActual}":`, valorActual); 
    if (!nuevoValor || nuevoValor.trim() === '' || nuevoValor.trim() === valorActual) return; 
    const valorFormateado = (tipo === 'placas') ? nuevoValor.trim().toUpperCase() : nuevoValor.trim(); 
    const propiedad = { 
        placas: 'volqueta', 
        choferes: 'chofer', 
        empresas: 'empresa', 
        proveedores: 'proveedor', 
        proyectos: 'proyecto',
        detallesVolqueta: 'detallesVolqueta' // Nueva propiedad
    }[tipo]; 
    
    // Validar tipo antes de proceder
    const coleccionesPermitidas = ["choferes", "placas", "detallesVolqueta", "empresas", "proveedores", "proyectos"];
     if (!coleccionesPermitidas.includes(tipo)) {
        console.error("Tipo inválido para modificar:", tipo);
        mostrarNotificacion("Error interno.", "error");
        return;
    }

    // Si la propiedad es null (no afecta consumos) o no existe, solo actualiza el item en su colección
    if (propiedad === null || !propiedad) {
         if (confirm(`¿Estás seguro de cambiar "${valorActual}" por "${valorFormateado}"?`)) { 
            try { 
                await updateDoc(doc(db, tipo, item.id), { nombre: valorFormateado }); 
                await cargarDatosIniciales(); 
                mostrarNotificacion("Elemento actualizado.", "exito"); 
            } catch(e) { 
                console.error("Error modificando:", e); 
                mostrarNotificacion("Error al modificar.", "error"); 
            }
         }
         return; 
    }

    // Actualización masiva
    if (confirm(`¿Estás seguro de cambiar "${valorActual}" por "${valorFormateado}"? Esto actualizará TODOS los registros de consumo asociados.`)) { 
        try { 
            await updateDoc(doc(db, tipo, item.id), { nombre: valorFormateado }); 
            // Filtrar consumos que tengan la propiedad y el valor actual
            const q = query(collection(db, "consumos"), where(propiedad, "==", valorActual));
            const snapshot = await getDocs(q);
            const updates = [];
             snapshot.forEach((doc) => {
                 updates.push(updateDoc(doc.ref, { [propiedad]: valorFormateado }));
             });
             
            await Promise.all(updates); 
            await cargarDatosIniciales(); // Recargar todo después de la actualización masiva
            mostrarNotificacion("Actualización masiva completada.", "exito"); 
        } catch(e) { 
            console.error("Error en modificación masiva:", e); 
            mostrarNotificacion("Error al realizar la actualización masiva.", "error"); 
        } 
    } 
}
// ===== FIN DE FUNCIÓN MODIFICADA =====


// ===== INICIO DE FUNCIÓN MODIFICADA =====
function cargarDatosParaModificar(id) {
    const consumo = todosLosConsumos.find(c => c.id === id); 
    if (!consumo) {
        mostrarNotificacion("Registro no encontrado para modificar.", "error");
        return;
    }
    // Llenar formulario
    document.getElementById('registroId').value = consumo.id; 
    document.getElementById('fecha').value = consumo.fecha; 
    document.getElementById('hora').value = consumo.hora || ''; 
    document.getElementById('numeroFactura').value = consumo.numeroFactura || ''; 
    document.getElementById('selectChofer').value = consumo.chofer; 
    document.getElementById('selectVolqueta').value = consumo.volqueta; 
    document.getElementById('galones').value = consumo.galones; 
    document.getElementById('costo').value = consumo.costo; 
    document.getElementById('descripcion').value = consumo.descripcion; 
    document.getElementById('selectEmpresa').value = consumo.empresa || ""; 
    document.getElementById('selectProveedor').value = consumo.proveedor || ""; 
    document.getElementById('selectProyecto').value = consumo.proyecto || "";
    document.getElementById('selectDetallesVolqueta').value = consumo.detallesVolqueta || "";
    document.getElementById('kilometraje').value = consumo.kilometraje || "";

    // Cambiar a la pestaña Registrar y abrir modal
    openMainTab(null, 'tabRegistrar'); 
    abrirModal(); 
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

function calcularYMostrarTotalesPorCategoria(consumos, categoria, bodyId, footerId) { /* ... (sin cambios) ... */ }
const calcularYMostrarTotalesPorEmpresa = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'empresa', 'resumenEmpresaBody', 'resumenEmpresaFooter');
const calcularYMostrarTotalesPorProveedor = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proveedor', 'resumenProveedorBody', 'resumenProveedorFooter');
const calcularYMostrarTotalesPorProyecto = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proyecto', 'resumenProyectoBody', 'resumenProyectoFooter');
const calcularYMostrarTotalesPorChofer = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'chofer', 'resumenChoferBody', 'resumenChoferFooter');
const calcularYMostrarTotales = (consumos) => { calcularYMostrarTotalesPorCategoria(consumos, 'volqueta', 'resumenBody', 'resumenFooter'); };

// ===== INICIO DE FUNCIÓN MODIFICADA =====
async function borrarItemAdmin(item, tipo) { 
    const coleccionesPermitidas = ["choferes", "placas", "detallesVolqueta", "empresas", "proveedores", "proyectos"];
    if (!coleccionesPermitidas.includes(tipo)) { 
        console.error("Intento de borrar de una colección no permitida:", tipo); 
        mostrarNotificacion("Error interno al borrar.", "error"); 
        return; 
    }
    // Verificar si el item existe antes de confirmar
    if (!item || !item.id || !item.nombre) {
         console.error("Item inválido para borrar:", item);
         mostrarNotificacion("Error: No se pudo identificar el elemento a borrar.", "error");
         return;
    }
    if (confirm(`¿Seguro que quieres borrar "${item.nombre}"?`)) { 
        try { 
            await deleteDoc(doc(db, tipo, item.id)); 
            mostrarNotificacion("Elemento borrado.", "exito"); 
            await cargarDatosIniciales(); // Recargar para actualizar la lista
        } catch(e) { 
            console.error("Error borrando:", e); 
            mostrarNotificacion("No se pudo borrar.", "error"); 
        } 
    } 
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

async function borrarConsumoHistorial(id) { /* ... (sin cambios) ... */ }
function poblarFiltroDeMes() { /* ... (sin cambios) ... */ }
function poblarFiltrosReportes() { /* ... (sin cambios) ... */ }

// ===== INICIO DE FUNCIÓN MODIFICADA =====
function mostrarHistorialAgrupado(consumos) {
    const historialBody = document.getElementById('historialBody'); 
    const historialFooter = document.getElementById('historialFooter');
    if (!historialBody || !historialFooter) { console.error("Elementos del historial no encontrados"); return; }
    historialBody.innerHTML = ''; 
    historialFooter.innerHTML = '';

    if (!Array.isArray(consumos) || consumos.length === 0) { 
        historialBody.innerHTML = `<tr><td colspan="14" class="empty-state"><i class="fa-solid fa-folder-open"></i><p>No se encontraron registros.</p></td></tr>`; 
        return; 
    }
    let totalGalones = 0, totalCosto = 0;
    // Ordenar consumos (copia para no modificar el original si se usa en otro lado)
    const consumosOrdenados = [...consumos].sort((a,b) => new Date(b.fecha) - new Date(a.fecha) || a.volqueta.localeCompare(b.volqueta));
    let mesAnioActual = "";
    consumosOrdenados.forEach(consumo => {
        totalGalones += parseFloat(consumo.galones) || 0; 
        totalCosto += parseFloat(consumo.costo) || 0;
        const fechaConsumo = new Date(consumo.fecha + 'T00:00:00'); // Asegurar UTC para consistencia
        const mesAnio = fechaConsumo.toLocaleDateString('es-EC', { month: 'long', year: 'numeric', timeZone: 'UTC' });
        
        // Obtener filtros de fecha para decidir si agrupar por mes
        const fechaInicioFiltro = document.querySelector('.filtro-sincronizado[data-sync-id="filtroFechaInicio"]')?.value;
        const fechaFinFiltro = document.querySelector('.filtro-sincronizado[data-sync-id="filtroFechaFin"]')?.value;

        if (mesAnio !== mesAnioActual && !(fechaInicioFiltro && fechaFinFiltro)) { // No agrupar si hay rango de fechas
            mesAnioActual = mesAnio;
            const filaGrupo = document.createElement('tr'); 
            filaGrupo.className = 'fila-grupo'; 
            filaGrupo.innerHTML = `<td colspan="14">${mesAnioActual.charAt(0).toUpperCase() + mesAnioActual.slice(1)}</td>`;
            historialBody.appendChild(filaGrupo);
        }
        const filaDato = document.createElement('tr');
        // Usar data-id en los botones
        filaDato.innerHTML = `<td class="no-print">
                                <button class="btn-accion btn-modificar button-warning" data-id="${consumo.id}" title="Modificar"><i class="fa-solid fa-pencil" style="margin: 0;"></i></button>
                                <button class="btn-accion btn-borrar" data-id="${consumo.id}" title="Borrar"><i class="fa-solid fa-trash-can" style="margin: 0;"></i></button>
                              </td>
            <td>${consumo.fecha}</td><td>${consumo.hora || ''}</td><td>${consumo.numeroFactura || ''}</td><td>${consumo.chofer}</td><td>${consumo.volqueta}</td>
            <td>${consumo.detallesVolqueta || ''}</td><td>${consumo.kilometraje || ''}</td>
            <td>${consumo.proveedor || ''}</td><td>${consumo.proyecto || ''}</td><td>${(parseFloat(consumo.galones) || 0).toFixed(2)}</td><td>$${(parseFloat(consumo.costo) || 0).toFixed(2)}</td><td>${consumo.empresa || ''}</td><td>${consumo.descripcion}</td>`;
        historialBody.appendChild(filaDato);
    });
    // Ajustar colspan
    historialFooter.innerHTML = `<tr><td class="no-print"></td><td colspan="9" style="text-align: right;"><strong>TOTAL GALONES:</strong></td><td><strong>${totalGalones.toFixed(2)}</strong></td><td style="text-align: right;"><strong>VALOR TOTAL:</strong></td><td><strong>$${totalCosto.toFixed(2)}</strong></td><td></td></tr>`;
}
// ===== FIN DE FUNCIÓN MODIFICADA =====


function asignarSincronizacionDeFiltros() { /* ... (sin cambios) ... */ }
function handleLogin(e) { /* ... (sin cambios) ... */ }
function handleLogout() { /* ... (sin cambios) ... */ }

// ===== INICIO DE FUNCIÓN MODIFICADA (Añadir evento para nuevo form admin) =====
function asignarEventosApp() {
    if(btnAbrirModal) btnAbrirModal.addEventListener('click', abrirModal);
    if(btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);
    
    const btnReg = document.getElementById('btnTabRegistrar'); if(btnReg) btnReg.addEventListener('click', (e) => openMainTab(e, 'tabRegistrar'));
    const btnRep = document.getElementById('btnTabReportes'); if(btnRep) btnRep.addEventListener('click', (e) => openMainTab(e, 'tabReportes'));
    const btnHist = document.getElementById('btnTabHistorial'); if(btnHist) btnHist.addEventListener('click', (e) => openMainTab(e, 'tabHistorial'));
    const btnAdm = document.getElementById('btnTabAdmin'); if(btnAdm) btnAdm.addEventListener('click', (e) => openMainTab(e, 'tabAdmin'));
    
    const consumoForm = document.getElementById('consumoForm'); if(consumoForm) consumoForm.addEventListener('submit', guardarOActualizar);

    document.querySelectorAll('.btn-print').forEach(btn => btn.addEventListener('click', (e) => { /* ... */ }));
    window.onafterprint = () => { /* ... */ };
    document.querySelectorAll('#btnAplicarFiltros').forEach(btn => btn.addEventListener('click', actualizarTodaLaUI));
    document.querySelectorAll('#btnLimpiarFiltros').forEach(btn => btn.addEventListener('click', () => { /* ... */ }));
    
    const histBody = document.getElementById('historialBody'); if(histBody) histBody.addEventListener('click', manejarAccionesHistorial);
    
    // Forms Admin
    const formChofer = document.getElementById('formAdminChofer'); if(formChofer) formChofer.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('choferes', document.getElementById('nuevoChofer')); });
    const formPlaca = document.getElementById('formAdminPlaca'); if(formPlaca) formPlaca.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('placas', document.getElementById('nuevaPlaca')); });
    const formDetalles = document.getElementById('formAdminDetallesVolqueta'); if(formDetalles) formDetalles.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('detallesVolqueta', document.getElementById('nuevoDetalleVolqueta')); }); // <-- NUEVO EVENTO
    const formEmpresa = document.getElementById('formAdminEmpresa'); if(formEmpresa) formEmpresa.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('empresas', document.getElementById('nuevaEmpresa')); });
    const formProveedor = document.getElementById('formAdminProveedor'); if(formProveedor) formProveedor.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proveedores', document.getElementById('nuevoProveedor')); });
    const formProyecto = document.getElementById('formAdminProyecto'); if(formProyecto) formProyecto.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proyectos', document.getElementById('nuevoProyecto')); });
    
    const botonesAcordeon = document.querySelectorAll('.accordion-button');
    botonesAcordeon.forEach(boton => {
        boton.addEventListener('click', function() { /* ... */ });
    });
    asignarSincronizacionDeFiltros();
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

function iniciarAplicacion() {
    asignarEventosApp();
    cargarDatosIniciales();
}

const elLoginForm = document.getElementById('login-form');
if (elLoginForm) elLoginForm.addEventListener('submit', handleLogin);
if (btnLogout) btnLogout.addEventListener('click', handleLogout);