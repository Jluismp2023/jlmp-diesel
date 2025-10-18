import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
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
let listasAdmin = { choferes: [], placas: [], detallesVolqueta: [], empresas: [], proveedores: [], proyectos: [] };
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
    
    // Preparar para impresión
    tabActivaParaImprimir = tabName;
    document.querySelectorAll('.main-tab-content').forEach(tab => {
        tab.classList.remove('printable-active');
    });
    if (tabElement) {
        tabElement.classList.add('printable-active');
    }
}

async function cargarDatosIniciales() {
    const loadingMessageElement = document.getElementById('loadingMessage');
    const loaderContainer = document.getElementById('loaderContainer');
    if (loadingMessageElement) loadingMessageElement.style.display = 'block';
    if (loaderContainer) loaderContainer.style.display = 'block';

    try {
        const [
            consumosRes, choferesRes, placasRes, detallesVolquetaRes, 
            empresasRes, proveedoresRes, proyectosRes
        ] = await Promise.all([
            getDocs(query(collection(db, "consumos"), orderBy("fecha", "desc"))), 
            getDocs(query(collection(db, "choferes"), orderBy("nombre"))), 
            getDocs(query(collection(db, "placas"), orderBy("nombre"))), 
            getDocs(query(collection(db, "detallesVolqueta"), orderBy("nombre"))), 
            getDocs(query(collection(db, "empresas"), orderBy("nombre"))), 
            getDocs(query(collection(db, "proveedores"), orderBy("nombre"))), 
            getDocs(query(collection(db, "proyectos"), orderBy("nombre")))
        ]);
        todosLosConsumos = consumosRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.choferes = choferesRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.placas = placasRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.detallesVolqueta = detallesVolquetaRes.docs.map(doc => ({ id: doc.id, ...doc.data() })); 
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

// ===== INICIO DE FUNCIÓN MODIFICADA (AÑADIDA NUEVA LLAMADA) =====
function actualizarTodaLaUI() {
    try {
        poblarFiltroDeMes();
        poblarFiltrosReportes();
        const consumosFiltrados = obtenerConsumosFiltrados();
        if (!Array.isArray(consumosFiltrados)) throw new Error("consumosFiltrados no es un array"); 
        
        calcularYMostrarTotalesPorEmpresa(consumosFiltrados);
        calcularYMostrarTotalesPorProveedor(consumosFiltrados);
        calcularYMostrarTotalesPorProyecto(consumosFiltrados);
        calcularYMostrarTotalesPorChofer(consumosFiltrados);
        calcularYMostrarTotalesPorDetallesVolqueta(consumosFiltrados); // <-- NUEVA LLAMADA
        calcularYMostrarTotales(consumosFiltrados);
        poblarSelectores();
        mostrarListasAdmin();
        mostrarHistorialAgrupado(consumosFiltrados);
    } catch (error) {
        console.error("Error en actualizarTodaLaUI:", error);
        mostrarNotificacion("Error al actualizar la interfaz.", "error");
    }
}
// ===== FIN DE FUNCIÓN MODIFICADA =====

function poblarSelectores() {
    const selectores = { 
        choferes: document.getElementById('selectChofer'), 
        placas: document.getElementById('selectVolqueta'), 
        detallesVolqueta: document.getElementById('selectDetallesVolqueta'), 
        empresas: document.getElementById('selectEmpresa'), 
        proveedores: document.getElementById('selectProveedor'), 
        proyectos: document.getElementById('selectProyecto') 
    };
    const titulos = { 
        choferes: '--- Chofer ---', 
        placas: '--- Placa ---', 
        detallesVolqueta: '--- Detalles Volqueta ---', 
        empresas: '--- Empresa ---', 
        proveedores: '--- Proveedor ---', 
        proyectos: '--- Proyecto ---' 
    };
    for (const tipo in selectores) {
        const select = selectores[tipo];
        if (!select || !listasAdmin[tipo] || !titulos[tipo]) {
            continue; 
        }
        const valorActual = select.value;
        select.innerHTML = `<option value="">${titulos[tipo]}</option>`; 
        listasAdmin[tipo].forEach(item => { select.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });
        select.value = valorActual;
    }
}

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


async function agregarItemAdmin(tipo, inputElement) {
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
    if (valor && listasAdmin[tipo]) { 
        const listaNombres = listasAdmin[tipo].map(item => item.nombre.toUpperCase());
        if (listaNombres.includes(valor.toUpperCase())) { mostrarNotificacion(`"${valor}" ya existe.`, "error"); return; }
        try {
            await addDoc(collection(db, tipo), { nombre: valor });
            mostrarNotificacion(`Elemento agregado correctamente.`, "exito");
            inputElement.value = '';
            await cargarDatosIniciales(); 
        } catch (error) {
            console.error("Error agregando:", error);
            mostrarNotificacion("No se pudo agregar el elemento.", "error");
        }
    } else if (!listasAdmin[tipo]) {
         console.error(`La lista para el tipo "${tipo}" no existe en listasAdmin.`);
    }
}

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
        return []; 
    }
}

function mostrarListasAdmin() {
    const contenedores = { 
        choferes: 'listaChoferes', 
        placas: 'listaPlacas', 
        detallesVolqueta: 'listaDetallesVolqueta', 
        empresas: 'listaEmpresas', 
        proveedores: 'listaProveedores', 
        proyectos: 'listaProyectos' 
    };
    for (const tipo in contenedores) {
        const ul = document.getElementById(contenedores[tipo]);
        if (!ul || !listasAdmin[tipo]) { 
             if(ul) ul.innerHTML = `<li class="empty-state">Error al cargar datos.</li>`;
             continue; 
        }
        ul.innerHTML = '';
        if (listasAdmin[tipo].length === 0) { ul.innerHTML = `<li class="empty-state">No hay elementos.</li>`; continue; }
        
        const listaOrdenada = [...listasAdmin[tipo]].sort((a, b) => a.nombre.localeCompare(b.nombre));
        listaOrdenada.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.nombre}</span>
                          <div>
                              <button class="btn-accion btn-modificar button-warning" data-id="${item.id}" title="Modificar"><i class="fa-solid fa-pencil" style="margin:0;"></i></button>
                              <button class="btn-accion btn-borrar" data-id="${item.id}" title="Borrar"><i class="fa-solid fa-trash-can" style="margin:0;"></i></button>
                          </div>`;
             li.querySelector('.btn-modificar').addEventListener('click', () => modificarItemAdmin(item, tipo));
             li.querySelector('.btn-borrar').addEventListener('click', () => borrarItemAdmin(item, tipo));
            ul.appendChild(li);
        });
    }
}

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
        detallesVolqueta: 'detallesVolqueta' 
    }[tipo]; 
    
    const coleccionesPermitidas = ["choferes", "placas", "detallesVolqueta", "empresas", "proveedores", "proyectos"];
     if (!coleccionesPermitidas.includes(tipo)) {
        console.error("Tipo inválido para modificar:", tipo);
        mostrarNotificacion("Error interno.", "error");
        return;
    }

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

    if (confirm(`¿Estás seguro de cambiar "${valorActual}" por "${valorFormateado}"? Esto actualizará TODOS los registros de consumo asociados.`)) { 
        try { 
            await updateDoc(doc(db, tipo, item.id), { nombre: valorFormateado }); 
            const q = query(collection(db, "consumos"), where(propiedad, "==", valorActual));
            const snapshot = await getDocs(q);
            const updates = [];
             snapshot.forEach((doc) => {
                 updates.push(updateDoc(doc.ref, { [propiedad]: valorFormateado }));
             });
             
            await Promise.all(updates); 
            await cargarDatosIniciales(); 
            mostrarNotificacion("Actualización masiva completada.", "exito"); 
        } catch(e) { 
            console.error("Error en modificación masiva:", e); 
            mostrarNotificacion("Error al realizar la actualización masiva.", "error"); 
        } 
    } 
}


function cargarDatosParaModificar(id) {
    const consumo = todosLosConsumos.find(c => c.id === id); 
    if (!consumo) {
        mostrarNotificacion("Registro no encontrado para modificar.", "error");
        return;
    }
    
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

    openMainTab(null, 'tabRegistrar'); 
    abrirModal(); 
}

function calcularYMostrarTotalesPorCategoria(consumos, categoria, bodyId, footerId) {
    const tbody = document.getElementById(bodyId);
    const tfoot = document.getElementById(footerId);
    if (!tbody || !tfoot) {
        console.warn(`Elementos no encontrados para categoría: ${categoria} (IDs: ${bodyId}, ${footerId})`);
        return; 
    }

    tbody.innerHTML = '';
    tfoot.innerHTML = '';

    if (!Array.isArray(consumos) || consumos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="empty-state" style="text-align:center; padding:10px;">No hay datos.</td></tr>`;
        return;
    }
    
    const resumen = {};
    let granTotalGalones = 0;
    let granTotalCosto = 0;

    consumos.forEach(consumo => {
        const nombreCategoria = consumo[categoria] || 'Sin Asignar';
        const galones = parseFloat(consumo.galones) || 0;
        const costo = parseFloat(consumo.costo) || 0;
        
        if (!resumen[nombreCategoria]) {
            resumen[nombreCategoria] = { totalGalones: 0, totalCosto: 0 };
        }
        resumen[nombreCategoria].totalGalones += galones;
        resumen[nombreCategoria].totalCosto += costo;
        
        granTotalGalones += galones;
        granTotalCosto += costo;
    });

    // Ordenar alfabéticamente
    const clavesOrdenadas = Object.keys(resumen).sort((a, b) => a.localeCompare(b));
    
    clavesOrdenadas.forEach(nombre => {
        const fila = `<tr>
            <td>${nombre}</td>
            <td>${resumen[nombre].totalGalones.toFixed(2)}</td>
            <td>$${resumen[nombre].totalCosto.toFixed(2)}</td>
        </tr>`;
        tbody.innerHTML += fila;
    });

    tfoot.innerHTML = `<tr>
        <td><strong>TOTALES</strong></td>
        <td><strong>${granTotalGalones.toFixed(2)}</strong></td>
        <td><strong>$${granTotalCosto.toFixed(2)}</strong></td>
    </tr>`;
}

// ===== INICIO DE DEFINICIONES DE CÁLCULO (NUEVA FUNCIÓN AÑADIDA) =====
const calcularYMostrarTotalesPorEmpresa = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'empresa', 'resumenEmpresaBody', 'resumenEmpresaFooter');
const calcularYMostrarTotalesPorProveedor = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proveedor', 'resumenProveedorBody', 'resumenProveedorFooter');
const calcularYMostrarTotalesPorProyecto = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proyecto', 'resumenProyectoBody', 'resumenProyectoFooter');
const calcularYMostrarTotalesPorChofer = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'chofer', 'resumenChoferBody', 'resumenChoferFooter');
const calcularYMostrarTotalesPorDetallesVolqueta = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'detallesVolqueta', 'resumenDetallesVolquetaBody', 'resumenDetallesVolquetaFooter'); // <-- NUEVA FUNCIÓN
const calcularYMostrarTotales = (consumos) => { calcularYMostrarTotalesPorCategoria(consumos, 'volqueta', 'resumenBody', 'resumenFooter'); };
// ===== FIN DE DEFINICIONES DE CÁLCULO =====

async function borrarItemAdmin(item, tipo) { 
    const coleccionesPermitidas = ["choferes", "placas", "detallesVolqueta", "empresas", "proveedores", "proyectos"];
    if (!coleccionesPermitidas.includes(tipo)) { 
        console.error("Intento de borrar de una colección no permitida:", tipo); 
        mostrarNotificacion("Error interno al borrar.", "error"); 
        return; 
    }
    if (!item || !item.id || !item.nombre) {
         console.error("Item inválido para borrar:", item);
         mostrarNotificacion("Error: No se pudo identificar el elemento a borrar.", "error");
         return;
    }
    if (confirm(`¿Seguro que quieres borrar "${item.nombre}"?`)) { 
        try { 
            await deleteDoc(doc(db, tipo, item.id)); 
            mostrarNotificacion("Elemento borrado.", "exito"); 
            await cargarDatosIniciales(); 
        } catch(e) { 
            console.error("Error borrando:", e); 
            mostrarNotificacion("No se pudo borrar.", "error"); 
        } 
    } 
}

async function borrarConsumoHistorial(id) { 
    if (!id) {
        console.error("ID no proporcionado para borrar.");
        return;
    }
    if (confirm("¿Estás seguro de que quieres borrar este registro de consumo?")) {
        try {
            await deleteDoc(doc(db, "consumos", id));
            mostrarNotificacion("Registro borrado con éxito.", "exito");
            await cargarDatosIniciales(); // Recargar datos
        } catch (error) {
            console.error("Error borrando registro:", error);
            mostrarNotificacion("No se pudo borrar el registro.", "error");
        }
    }
}

function poblarFiltroDeMes() {
    const meses = new Set();
    todosLosConsumos.forEach(c => {
        if (c.fecha) meses.add(c.fecha.substring(0, 7)); // 'YYYY-MM'
    });
    
    const mesesOrdenados = Array.from(meses).sort().reverse();
    const selectoresMes = document.querySelectorAll('.filtro-sincronizado[data-sync-id="filtroMes"]');
    
    selectoresMes.forEach(select => {
        const valorActual = select.value;
        select.innerHTML = '<option value="todos">Todos los Meses</option>';
        mesesOrdenados.forEach(mesAnio => {
            const [anio, mes] = mesAnio.split('-');
            const fecha = new Date(anio, mes - 1, 1);
            const nombreMes = fecha.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
            select.innerHTML += `<option value="${mesAnio}">${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}</option>`;
        });
        select.value = valorActual || 'todos';
    });
}

function poblarFiltrosReportes() {
    const poblarSelector = (tipo, syncId) => {
        const selectores = document.querySelectorAll(`.filtro-sincronizado[data-sync-id="${syncId}"]`);
        selectores.forEach(select => {
            if (!listasAdmin[tipo]) return;
            const valorActual = select.value;
            select.innerHTML = `<option value="todos">Todos</option>`;
            listasAdmin[tipo].forEach(item => {
                select.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`;
            });
            select.value = valorActual || 'todos';
        });
    };
    poblarSelector('choferes', 'filtroChofer');
    poblarSelector('proveedores', 'filtroProveedor');
    poblarSelector('empresas', 'filtroEmpresa');
    poblarSelector('proyectos', 'filtroProyecto');
}

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
    
    const consumosOrdenados = [...consumos].sort((a,b) => new Date(b.fecha) - new Date(a.fecha) || a.volqueta.localeCompare(b.volqueta));
    let mesAnioActual = "";
    consumosOrdenados.forEach(consumo => {
        totalGalones += parseFloat(consumo.galones) || 0; 
        totalCosto += parseFloat(consumo.costo) || 0;
        const fechaConsumo = new Date(consumo.fecha + 'T00:00:00'); // Asegurar UTC
        const mesAnio = fechaConsumo.toLocaleDateString('es-EC', { month: 'long', year: 'numeric', timeZone: 'UTC' });
        
        const fechaInicioFiltro = document.querySelector('.filtro-sincronizado[data-sync-id="filtroFechaInicio"]')?.value;
        const fechaFinFiltro = document.querySelector('.filtro-sincronizado[data-sync-id="filtroFechaFin"]')?.value;

        if (mesAnio !== mesAnioActual && !(fechaInicioFiltro && fechaFinFiltro)) { 
            mesAnioActual = mesAnio;
            const filaGrupo = document.createElement('tr'); 
            filaGrupo.className = 'fila-grupo'; 
            filaGrupo.innerHTML = `<td colspan="14">${mesAnioActual.charAt(0).toUpperCase() + mesAnioActual.slice(1)}</td>`;
            historialBody.appendChild(filaGrupo);
        }
        const filaDato = document.createElement('tr');
        
        filaDato.innerHTML = `<td class="no-print">
                                <button class="btn-accion btn-modificar button-warning" data-id="${consumo.id}" title="Modificar"><i class="fa-solid fa-pencil" style="margin: 0;"></i></button>
                                <button class="btn-accion btn-borrar" data-id="${consumo.id}" title="Borrar"><i class="fa-solid fa-trash-can" style="margin: 0;"></i></button>
                              </td>
            <td>${consumo.fecha}</td><td>${consumo.hora || ''}</td><td>${consumo.numeroFactura || ''}</td><td>${consumo.chofer}</td><td>${consumo.volqueta}</td>
            <td>${consumo.detallesVolqueta || ''}</td><td>${consumo.kilometraje || ''}</td>
            <td>${consumo.proveedor || ''}</td><td>${consumo.proyecto || ''}</td><td>${(parseFloat(consumo.galones) || 0).toFixed(2)}</td><td>$${(parseFloat(consumo.costo) || 0).toFixed(2)}</td><td>${consumo.empresa || ''}</td><td>${consumo.descripcion}</td>`;
        historialBody.appendChild(filaDato);
    });
    
    historialFooter.innerHTML = `<tr><td class="no-print"></td><td colspan="9" style="text-align: right;"><strong>TOTAL GALONES:</strong></td><td><strong>${totalGalones.toFixed(2)}</strong></td><td style="text-align: right;"><strong>VALOR TOTAL:</strong></td><td><strong>$${totalCosto.toFixed(2)}</strong></td><td></td></tr>`;
}


function asignarSincronizacionDeFiltros() {
    const filtros = document.querySelectorAll('.filtro-sincronizado');
    const manejadorSincronizacion = (e) => {
        const syncId = e.target.dataset.syncId;
        const nuevoValor = e.target.value;
        if (!syncId) return;
        
        document.querySelectorAll(`.filtro-sincronizado[data-sync-id="${syncId}"]`).forEach(el => {
            if (el !== e.target) el.value = nuevoValor;
        });

        // Lógica especial para limpiar fechas si se selecciona un mes
        if (syncId === 'filtroMes' && nuevoValor !== 'todos') {
             document.querySelectorAll('.filtro-sincronizado[data-sync-id="filtroFechaInicio"]').forEach(el => el.value = '');
             document.querySelectorAll('.filtro-sincronizado[data-sync-id="filtroFechaFin"]').forEach(el => el.value = '');
        }
        // Lógica inversa: limpiar mes si se selecciona una fecha
        if ((syncId === 'filtroFechaInicio' || syncId === 'filtroFechaFin') && nuevoValor !== '') {
             document.querySelectorAll('.filtro-sincronizado[data-sync-id="filtroMes"]').forEach(el => el.value = 'todos');
        }
    };
    filtros.forEach(filtro => filtro.addEventListener('change', manejadorSincronizacion));
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        // El onAuthStateChanged se encargará de mostrar la app
    } catch (error) {
        console.error("Error de inicio de sesión:", error.code, error.message);
        mostrarNotificacion("Error: Usuario o contraseña incorrectos.", "error");
    }
}

async function handleLogout() {
    try {
        await signOut(auth);
        // El onAuthStateChanged se encargará de mostrar el login
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
        mostrarNotificacion("Error al cerrar sesión.", "error");
    }
}

function asignarEventosApp() {
    if(btnAbrirModal) btnAbrirModal.addEventListener('click', abrirModal);
    if(btnCerrarModal) btnCerrarModal.addEventListener('click', cerrarModal);
    
    const btnReg = document.getElementById('btnTabRegistrar'); if(btnReg) btnReg.addEventListener('click', (e) => openMainTab(e, 'tabRegistrar'));
    const btnRep = document.getElementById('btnTabReportes'); if(btnRep) btnRep.addEventListener('click', (e) => openMainTab(e, 'tabReportes'));
    const btnHist = document.getElementById('btnTabHistorial'); if(btnHist) btnHist.addEventListener('click', (e) => openMainTab(e, 'tabHistorial'));
    const btnAdm = document.getElementById('btnTabAdmin'); if(btnAdm) btnAdm.addEventListener('click', (e) => openMainTab(e, 'tabAdmin'));
    
    const consumoForm = document.getElementById('consumoForm'); if(consumoForm) consumoForm.addEventListener('submit', guardarOActualizar);

    document.querySelectorAll('.btn-print').forEach(btn => btn.addEventListener('click', (e) => {
        const targetId = e.currentTarget.dataset.printTarget;
        if(targetId) {
            openMainTab(null, targetId); // Asegura que la pestaña correcta esté activa
            window.print();
        }
    }));
    
    window.onafterprint = () => {
        if(tabActivaParaImprimir) openMainTab(null, tabActivaParaImprimir);
    };

    document.querySelectorAll('#btnAplicarFiltros').forEach(btn => btn.addEventListener('click', actualizarTodaLaUI));
    
    document.querySelectorAll('#btnLimpiarFiltros').forEach(btn => btn.addEventListener('click', () => {
        document.querySelectorAll('.filtro-sincronizado').forEach(el => {
            if (el.tagName === 'SELECT') el.value = 'todos';
            else el.value = '';
        });
        actualizarTodaLaUI();
    }));
    
    const histBody = document.getElementById('historialBody'); if(histBody) histBody.addEventListener('click', manejarAccionesHistorial);
    
    // Forms Admin
    const formChofer = document.getElementById('formAdminChofer'); if(formChofer) formChofer.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('choferes', document.getElementById('nuevoChofer')); });
    const formPlaca = document.getElementById('formAdminPlaca'); if(formPlaca) formPlaca.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('placas', document.getElementById('nuevaPlaca')); });
    const formDetalles = document.getElementById('formAdminDetallesVolqueta'); if(formDetalles) formDetalles.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('detallesVolqueta', document.getElementById('nuevoDetalleVolqueta')); }); 
    const formEmpresa = document.getElementById('formAdminEmpresa'); if(formEmpresa) formEmpresa.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('empresas', document.getElementById('nuevaEmpresa')); });
    const formProveedor = document.getElementById('formAdminProveedor'); if(formProveedor) formProveedor.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proveedores', document.getElementById('nuevoProveedor')); });
    const formProyecto = document.getElementById('formAdminProyecto'); if(formProyecto) formProyecto.addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proyectos', document.getElementById('nuevoProyecto')); });
    
    const botonesAcordeon = document.querySelectorAll('.accordion-button');
    botonesAcordeon.forEach(boton => {
        boton.addEventListener('click', function() {
            this.classList.toggle('active');
            const panel = this.nextElementSibling;
            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
            }
        });
    });
    asignarSincronizacionDeFiltros();
}

function iniciarAplicacion() {
    asignarEventosApp();
    cargarDatosIniciales();
    openMainTab(null, 'tabRegistrar'); // Abrir la pestaña de registro por defecto
}

const elLoginForm = document.getElementById('login-form');
if (elLoginForm) elLoginForm.addEventListener('submit', handleLogin);
if (btnLogout) btnLogout.addEventListener('click', handleLogout);