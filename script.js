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
let listasAdmin = { choferes: [], placas: [], detallesVolqueta: [], empresas: [], proveedores: [], proyectos: [] };
let appInicializada = false;
let tabActivaParaImprimir = null;
let esModoObservador = false; // Variable global para el rol
let registrosParaGuardar = []; // ALMACENA TEMPORALMENTE LOS REGISTROS PARA LA PREVISUALIZACIÓN

onAuthStateChanged(auth, (user) => {
    if (user) {
        
        const emailObservador = "obreco@observador.com"; 
        esModoObservador = (user.email === emailObservador);

        if (esModoObservador) {
            // --- Lógica para Observador ---
            document.body.classList.add('modo-observador');
            // Oculta pestañas que no debe ver
            document.getElementById('tabInicio').style.display = 'none';
            document.getElementById('tabRegistrar').style.display = 'none';
            document.getElementById('tabDistribuir').style.display = 'none';
            document.getElementById('tabAdmin').style.display = 'none';
            
            // Muestra 'Reportes' por defecto y activa la pestaña
            document.getElementById('tabReportes').style.display = 'block';
            document.querySelector('.main-tab-link.active')?.classList.remove('active');
            document.getElementById('btnTabReportes').classList.add('active');
        } else {
            // --- Lógica para Administrador ---
            document.body.classList.remove('modo-observador');
            // Muestra 'Inicio' por defecto
            document.getElementById('tabInicio').style.display = 'block';
            document.querySelector('.main-tab-link.active')?.classList.remove('active');
            document.getElementById('btnTabInicio').classList.add('active');
        }

        vistaLogin.style.display = 'none';
        vistaApp.style.display = 'block';
        btnLogout.style.display = 'block';
        if (!appInicializada) {
            iniciarAplicacion();
            appInicializada = true;
        }
    } else {
        // --- Lógica de Logout ---
        vistaLogin.style.display = 'block';
        vistaApp.style.display = 'none';
        btnLogout.style.display = 'none';
        appInicializada = false;
        esModoObservador = false; // Resetea el modo
        document.body.classList.remove('modo-observador'); // Limpia la clase
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
const btnCerrarModal = modal ? modal.querySelector('.close-button') : null; // Se añade chequeo de null
function abrirModal() { if (modal) modal.style.display = 'block'; }
function cerrarModal() { if (modal) modal.style.display = 'none'; reiniciarFormulario(); }

function openMainTab(evt, tabName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("main-tab-content");
    for (i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; }
    tablinks = document.getElementsByClassName("main-tab-link");
    for (i = 0; i < tablinks.length; i++) { tablinks[i].className = tablinks[i].className.replace(" active", ""); }
    document.getElementById(tabName).style.display = "block";
    // Si el evento existe (clic real), usa currentTarget. Si no (llamada programática), busca por ID.
    const buttonToActivate = evt ? evt.currentTarget : document.getElementById(`btnTab${tabName.replace('tab','')}`);
    if (buttonToActivate) {
        buttonToActivate.className += " active";
    }
}

async function cargarDatosIniciales() {
    // Si existe el elemento loadingMessage, lo mostramos
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) {
        loadingMessage.textContent = "Cargando datos desde la nube...";
        loadingMessage.style.display = 'block';
    }

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
        if (loadingMessage) {
            loadingMessage.textContent = "Error al cargar datos. Revisa la consola (F12).";
        }
    } finally {
        const loaderContainer = document.getElementById('loaderContainer');
        if (loaderContainer) { loaderContainer.style.display = 'none'; }
    }
}


// Función para el Dashboard (Actualizada para incluir Semana)
function actualizarTarjetasResumen() {
    const ahora = new Date();
    
    // --- Cálculo Mensual ---
    const anio = ahora.getFullYear();
    const mes = (ahora.getMonth() + 1).toString().padStart(2, '0');
    const mesActual = `${anio}-${mes}`;

    // --- Cálculo Semanal (Domingo a Sábado) ---
    const hoy = ahora.getDay(); // 0 = Domingo
    const inicioSemana = new Date(ahora);
    inicioSemana.setDate(ahora.getDate() - hoy); 
    inicioSemana.setHours(0, 0, 0, 0); 

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6); 
    finSemana.setHours(23, 59, 59, 999); 

    let totalGalonesMes = 0;
    let totalCostoMes = 0;
    let totalGalonesSemana = 0; 
    let totalCostoSemana = 0; 

    todosLosConsumos.forEach(c => {
        // --- Lógica Mensual ---
        if (c.fecha.startsWith(mesActual)) {
            totalGalonesMes += parseFloat(c.galones) || 0;
            totalCostoMes += parseFloat(c.costo) || 0;
        }

        // --- Lógica Semanal ---
        const [y, m, d] = c.fecha.split('-').map(Number);
        // Crear la fecha en UTC para evitar problemas de zona horaria al comparar
        // El formato YYYY-MM-DD se interpreta como UTC por defecto en new Date() if no hay hora
        const fechaConsumoUTC = new Date(Date.UTC(y, m - 1, d)); 
        
        // Crear fechas de inicio y fin de semana también en UTC para comparación correcta
        const inicioSemanaUTC = new Date(Date.UTC(inicioSemana.getFullYear(), inicioSemana.getMonth(), inicioSemana.getDate()));
        const finSemanaUTC = new Date(Date.UTC(finSemana.getFullYear(), finSemana.getMonth(), finSemana.getDate(), 23, 59, 59, 999));

        if (fechaConsumoUTC >= inicioSemanaUTC && fechaConsumoUTC <= finSemanaUTC) {
            totalGalonesSemana += parseFloat(c.galones) || 0;
            totalCostoSemana += parseFloat(c.costo) || 0;
        }
    });

    // --- Actualizar DOM ---
    if (document.getElementById('resumenMesGalones')) {
        document.getElementById('resumenMesGalones').textContent = `${totalGalonesMes.toFixed(2)} Gal`;
    }
    if (document.getElementById('resumenMesCosto')) {
        document.getElementById('resumenMesCosto').textContent = `$ ${totalCostoMes.toFixed(2)}`;
    }
    if (document.getElementById('resumenSemanaGalones')) {
        document.getElementById('resumenSemanaGalones').textContent = `${totalGalonesSemana.toFixed(2)} Gal`;
    }
    if (document.getElementById('resumenSemanaCosto')) {
        document.getElementById('resumenSemanaCosto').textContent = `$ ${totalCostoSemana.toFixed(2)}`;
    }
}


function actualizarTodaLaUI() {
    poblarFiltroDeMes();
    poblarFiltrosReportes();
    
    // Ejecutar obtenerConsumosFiltrados después de poblar filtros
    const consumosFiltrados = obtenerConsumosFiltrados();

    calcularYMostrarTotalesPorEmpresa(consumosFiltrados);
    calcularYMostrarTotalesPorProveedor(consumosFiltrados);
    calcularYMostrarTotalesPorProyecto(consumosFiltrados);
    calcularYMostrarTotalesPorChofer(consumosFiltrados);
    calcularYMostrarTotales(consumosFiltrados);
    poblarSelectores();
    mostrarListasAdmin();
    mostrarHistorialAgrupado(consumosFiltrados);
    
    actualizarTarjetasResumen(); 
    // Asegurar que los campos de distribución estén actualizados si la pestaña es visible
    if (document.getElementById('tabDistribuir') && document.getElementById('tabDistribuir').style.display === 'block') {
         actualizarCamposDistribucion();
    }
}

// MODIFICACIÓN: Esta función ahora solo pobla los selectores de la pestaña "Registrar"
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
        if (!select) continue;
        const valorActual = select.value;
        select.innerHTML = `<option value="">${titulos[tipo]}</option>`; 
        listasAdmin[tipo].forEach(item => { select.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });
        select.value = valorActual;
    }
    // Llamar a la función de la pestaña de distribución para poblar sus selectores también
    sincronizarSelectoresDistribucion();
}

function reiniciarFormulario() {
    const form = document.getElementById('consumoForm');
    if (form) {
        form.reset();
        document.getElementById('registroId').value = '';
        const fechaInput = document.getElementById('fecha');
        if (fechaInput) fechaInput.valueAsDate = new Date();
        const titulo = document.getElementById('formularioTitulo');
        if (titulo) titulo.textContent = 'Nuevo Registro';
        poblarSelectores();
    }
}

async function guardarOActualizar(e) {
    e.preventDefault();
    const btnGuardar = document.getElementById('btnGuardar');
    if (!btnGuardar) return;

    btnGuardar.disabled = true;
    btnGuardar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando...';

    const id = document.getElementById('registroId').value;
    
    const datosConsumo = {
        volqueta: document.getElementById('selectVolqueta').value,
        fecha: document.getElementById('fecha').value,
        hora: document.getElementById('hora').value,
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
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Registro';
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
        await cargarDatosIniciales();
        
        if (!esModoObservador) {
            openMainTab(null, 'tabInicio');
        }

    } catch (error) {
        console.error("Error guardando en Firestore:", error);
        mostrarNotificacion(`Error al guardar: ${error.message}`, "error", 5000);
    } finally {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Registro';
    }
}

async function agregarItemAdmin(tipo, inputElement) {
    const valor = (tipo === 'placas') ? inputElement.value.trim().toUpperCase() : inputElement.value.trim();
    if (valor) {
        const listaNombres = listasAdmin[tipo].map(item => item.nombre.toUpperCase());
        if (listaNombres.includes(valor.toUpperCase())) { mostrarNotificacion(`"${valor}" ya existe.`, "error"); return; }
        try {
            await addDoc(collection(db, tipo), { nombre: valor });
            mostrarNotificacion(`Elemento agregado correctamente.`, "exito");
            inputElement.value = '';
            await cargarDatosIniciales();
            // Si se agregan proyectos, actualizar la pestaña de distribución si está activa
            if (tipo === 'proyectos') { actualizarCamposDistribucion(); } 
        } catch (error) {
            console.error("Error agregando:", error);
            mostrarNotificacion("No se pudo agregar el elemento.", "error");
        }
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

// CORRECCIÓN: Función blindada para evitar el TypeError al inicio
function obtenerConsumosFiltrados() {
    const obtenerValorFiltro = (syncId) => {
        const elemento = document.querySelector(`.filtro-sincronizado[data-sync-id="${syncId}"]`);
        if (!elemento) {
            // Si el elemento no existe (porque la pestaña está oculta al inicio), 
            // asumimos 'todos' para SELECTs o cadena vacía para INPUTs de fecha.
            return (syncId === 'filtroMes' || syncId === 'filtroChofer' || syncId === 'filtroProveedor' || syncId === 'filtroEmpresa' || syncId === 'filtroProyecto') ? 'todos' : '';
        }
        return elemento.value;
    };
    
    const mes = obtenerValorFiltro('filtroMes');
    const fechaInicio = obtenerValorFiltro('filtroFechaInicio');
    const fechaFin = obtenerValorFiltro('filtroFechaFin');
    const chofer = obtenerValorFiltro('filtroChofer');
    const proveedor = obtenerValorFiltro('filtroProveedor');
    const empresa = obtenerValorFiltro('filtroEmpresa');
    const proyecto = obtenerValorFiltro('filtroProyecto');

    let consumosFiltrados = todosLosConsumos;
    
    // Aplicar filtros de fecha
    if (fechaInicio && fechaFin) { 
        if (fechaFin < fechaInicio) { 
            mostrarNotificacion("La fecha de fin no puede ser anterior a la de inicio.", "error"); 
            return []; 
        } 
        consumosFiltrados = consumosFiltrados.filter(c => c.fecha >= fechaInicio && c.fecha <= fechaFin); 
    } else if (fechaInicio) { 
        consumosFiltrados = consumosFiltrados.filter(c => c.fecha === fechaInicio); 
    } else if (mes !== 'todos' && mes !== '') { 
        consumosFiltrados = consumosFiltrados.filter(c => c.fecha.startsWith(mes)); 
    }
    
    // Aplicar filtros de selección
    if (chofer !== 'todos' && chofer !== '') { consumosFiltrados = consumosFiltrados.filter(c => c.chofer === chofer); }
    if (proveedor !== 'todos' && proveedor !== '') { consumosFiltrados = consumosFiltrados.filter(c => c.proveedor === proveedor); }
    if (empresa !== 'todos' && empresa !== '') { consumosFiltrados = consumosFiltrados.filter(c => c.empresa === empresa); }
    if (proyecto !== 'todos' && proyecto !== '') { consumosFiltrados = consumosFiltrados.filter(c => c.proyecto === proyecto); }
    
    return consumosFiltrados;
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
        if (!ul) continue;
        ul.innerHTML = '';
        if (listasAdmin[tipo].length === 0) { ul.innerHTML = `<li class="empty-state">No hay elementos.</li>`; continue; }
        listasAdmin[tipo].forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.nombre}</span><div><button class="btn-accion btn-modificar button-warning" title="Modificar"><i class="fa-solid fa-pencil" style="margin:0;"></i></button><button class="btn-accion btn-borrar" title="Borrar"><i class="fa-solid fa-trash-can" style="margin:0;"></i></button></div>`;
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
        placas: 'volqueta', choferes: 'chofer', empresas: 'empresa', proveedores: 'proveedor', 
        proyectos: 'proyecto', detallesVolqueta: 'detallesVolqueta' 
    }[tipo]; 
    if (!propiedad) { console.error("Tipo de item desconocido:", tipo); mostrarNotificacion("Error interno al modificar.", "error"); return; }
    if (confirm(`¿Estás seguro de cambiar "${valorActual}" por "${valorFormateado}"? Esto actualizará TODOS los registros.`)) { 
        try { 
            await updateDoc(doc(db, tipo, item.id), { nombre: valorFormateado }); 
            const updates = todosLosConsumos.filter(consumo => consumo[propiedad] === valorActual).map(consumo => updateDoc(doc(db, "consumos", consumo.id), { [propiedad]: valorFormateado })); 
            await Promise.all(updates); 
            await cargarDatosIniciales(); 
            mostrarNotificacion("Actualización masiva completada.", "exito"); 
        } catch(e) { console.error("Error modificando:", e); mostrarNotificacion("Error al modificar.", "error"); } 
    } 
}

function cargarDatosParaModificar(id) {
    const consumo = todosLosConsumos.find(c => c.id === id); if (!consumo) return;
    document.getElementById('registroId').value = consumo.id; 
    document.getElementById('fecha').value = consumo.fecha; 
    document.getElementById('hora').value = consumo.hora || ''; 
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
    const resumenBody = document.getElementById(bodyId); const resumenFooter = document.getElementById(footerId);
    resumenBody.innerHTML = ''; resumenFooter.innerHTML = '';
    const totales = {};
    consumos.forEach(c => { const clave = c[categoria]; if (!clave) return; if (!totales[clave]) totales[clave] = { totalGalones: 0, totalCosto: 0 }; totales[clave].totalGalones += parseFloat(c.galones) || 0; totales[clave].totalCosto += parseFloat(c.costo) || 0; });
    if (Object.keys(totales).length === 0) { resumenBody.innerHTML = `<tr><td colspan="3" class="empty-state">No hay datos.</td></tr>`; return; }
    const clavesOrdenadas = Object.keys(totales).sort();
    let htmlBody = '', granTotalGalones = 0, granTotalCosto = 0;
    clavesOrdenadas.forEach(clave => { const total = totales[clave]; htmlBody += `<tr><td><strong>${clave}</strong></td><td>${total.totalGalones.toFixed(2)}</td><td>$${total.totalCosto.toFixed(2)}</td></tr>`; granTotalGalones += total.totalGalones; granTotalCosto += total.totalCosto; });
    resumenBody.innerHTML = htmlBody;
    resumenFooter.innerHTML = `<tr><td><strong>TOTAL</strong></td><td><strong>${granTotalGalones.toFixed(2)}</strong></td><td><strong>$${granTotalCosto.toFixed(2)}</strong></td></tr>`;
}

const calcularYMostrarTotalesPorEmpresa = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'empresa', 'resumenEmpresaBody', 'resumenEmpresaFooter');
const calcularYMostrarTotalesPorProveedor = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proveedor', 'resumenProveedorBody', 'resumenProveedorFooter');
const calcularYMostrarTotalesPorProyecto = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proyecto', 'resumenProyectoBody', 'resumenProyectoFooter');
const calcularYMostrarTotalesPorChofer = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'chofer', 'resumenChoferBody', 'resumenChoferFooter');
const calcularYMostrarTotales = (consumos) => { calcularYMostrarTotalesPorCategoria(consumos, 'volqueta', 'resumenBody', 'resumenFooter'); };

async function borrarItemAdmin(item, tipo) { 
    const coleccionesPermitidas = ["choferes", "placas", "detallesVolqueta", "empresas", "proveedores", "proyectos"];
    if (!coleccionesPermitidas.includes(tipo)) { console.error("Intento de borrar de una colección no permitida:", tipo); mostrarNotificacion("Error interno al borrar.", "error"); return; }
    if (confirm(`¿Seguro que quieres borrar "${item.nombre}"?`)) { 
        try { await deleteDoc(doc(db, tipo, item.id)); mostrarNotificacion("Elemento borrado.", "exito"); await cargarDatosIniciales(); } 
        catch(e) { console.error("Error borrando:", e); mostrarNotificacion("No se pudo borrar.", "error"); } 
    } 
}

async function borrarConsumoHistorial(id) {
    if (confirm('¿Seguro que quieres borrar este registro? Esta acción no se puede deshacer.')) {
        try {
            await deleteDoc(doc(db, "consumos", id));
            mostrarNotificacion("Registro borrado con éxito.", "exito");
            await cargarDatosIniciales();
        } catch (error) {
            console.error("Error borrando registro:", error);
            mostrarNotificacion("No se pudo borrar el registro.", "error");
        }
    }
}

function poblarFiltroDeMes() { const filtros = document.querySelectorAll('.filtro-sincronizado[data-sync-id="filtroMes"]'); const mesesUnicos = [...new Set(todosLosConsumos.map(c => c.fecha.substring(0, 7)))]; mesesUnicos.sort().reverse(); filtros.forEach(filtroSelect => { const valorSeleccionado = filtroSelect.value; filtroSelect.innerHTML = '<option value="todos">Todos los Meses</option>'; mesesUnicos.forEach(mes => { const [year, month] = mes.split('-'); const fechaMes = new Date(year, month - 1); const nombreMes = fechaMes.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }); const opcion = document.createElement('option'); opcion.value = mes; opcion.textContent = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1); filtroSelect.appendChild(opcion); }); if (filtroSelect.value) filtroSelect.value = valorSeleccionado || 'todos'; }); }
function poblarFiltrosReportes() { const tipos = { choferes: 'filtroChofer', proveedores: 'filtroProveedor', empresas: 'filtroEmpresa', proyectos: 'filtroProyecto' }; const titulos = { choferes: 'Todos los Choferes', proveedores: 'Todos los Proveedores', empresas: 'Todas las Empresas', proyectos: 'Todos los Proyectos' }; for (const tipo in tipos) { const syncId = tipos[tipo]; const selects = document.querySelectorAll(`.filtro-sincronizado[data-sync-id="${syncId}"]`); selects.forEach(select => { const valorActual = select.value; select.innerHTML = `<option value="todos">${titulos[tipo]}</option>`; listasAdmin[tipo].forEach(item => { select.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; }); select.value = valorActual || 'todos'; }); } }

function mostrarHistorialAgrupado(consumos) {
    const historialBody = document.getElementById('historialBody'); const historialFooter = document.getElementById('historialFooter');
    historialBody.innerHTML = ''; historialFooter.innerHTML = '';
    if (consumos.length === 0) { historialBody.innerHTML = `<tr><td colspan="14" class="empty-state"><i class="fa-solid fa-folder-open"></i><p>No se encontraron registros.</p></td></tr>`; return; }
    let totalGalones = 0, totalCosto = 0;
    consumos.sort((a,b) => new Date(b.fecha) - new Date(a.fecha) || a.volqueta.localeCompare(b.volqueta));
    let mesAnioActual = "";
    consumos.forEach(consumo => {
        totalGalones += parseFloat(consumo.galones) || 0; totalCosto += parseFloat(consumo.costo) || 0;
        const fechaConsumo = new Date(consumo.fecha + 'T00:00:00'); const mesAnio = fechaConsumo.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
        if (mesAnio !== mesAnioActual && !(obtenerConsumosFiltrados.fechaInicio && obtenerConsumosFiltrados.fechaFin)) {
            mesAnioActual = mesAnio;
            // Se ajusta el colspan a 13 
            const filaGrupo = document.createElement('tr'); filaGrupo.className = 'fila-grupo'; 
            filaGrupo.innerHTML = `<td colspan="13">${mesAnioActual.charAt(0).toUpperCase() + mesAnioActual.slice(1)}</td>`;
            historialBody.appendChild(filaGrupo);
        }
        const filaDato = document.createElement('tr');
        
        filaDato.innerHTML = `<td class="no-print"><button class="btn-accion btn-modificar button-warning" data-id="${consumo.id}" title="Modificar"><i class="fa-solid fa-pencil" style="margin: 0;"></i></button><button class="btn-accion btn-borrar" data-id="${consumo.id}" title="Borrar"><i class="fa-solid fa-trash-can" style="margin: 0;"></i></button></td>
            <td>${consumo.fecha}</td><td>${consumo.hora || ''}</td><td>${consumo.chofer}</td><td>${consumo.volqueta}</td>
            <td>${consumo.detallesVolqueta || ''}</td><td>${consumo.kilometraje || ''}</td>
            <td>${consumo.proveedor || ''}</td><td>${consumo.proyecto || ''}</td><td>${(parseFloat(consumo.galones) || 0).toFixed(2)}</td><td>$${(parseFloat(consumo.costo) || 0).toFixed(2)}</td><td>${consumo.empresa || ''}</td><td>${consumo.descripcion}</td>`;
        historialBody.appendChild(filaDato);
    });
    
    let footerHtml;
    // Colspan de 8 para la suma, excluyendo Acciones (no-print) y Descripcion
    const colspanTotal = 8; 
    
    if (esModoObservador) {
        // En modo observador, no hay columna 'Acciones' (no-print), por lo que el colspan es 8.
        footerHtml = `<tr><td colspan="${colspanTotal}" style="text-align: right;"><strong>TOTAL GALONES:</strong></td><td><strong>${totalGalones.toFixed(2)}</strong></td><td style="text-align: right;"><strong>VALOR TOTAL:</strong></strong></td><td><strong>$${totalCosto.toFixed(2)}</strong></td><td></td></tr>`;
    } else {
        // En modo administrador, la columna 'Acciones' existe.
        footerHtml = `<tr><td class="no-print"></td><td colspan="${colspanTotal}" style="text-align: right;"><strong>TOTAL GALONES:</strong></td><td><strong>${totalGalones.toFixed(2)}</strong></td><td style="text-align: right;"><strong>VALOR TOTAL:</strong></td><td><strong>$${totalCosto.toFixed(2)}</strong></td><td></td></tr>`;
    }
    historialFooter.innerHTML = footerHtml;
}

function asignarSincronizacionDeFiltros() {
    const filtros = document.querySelectorAll('.filtro-sincronizado');
    filtros.forEach(filtro => {
        filtro.addEventListener('change', (e) => {
            const syncId = e.target.dataset.syncId;
            const newValue = e.target.value;
            const filtrosASincronizar = document.querySelectorAll(`.filtro-sincronizado[data-sync-id="${syncId}"]`);
            filtrosASincronizar.forEach(f => { if (f !== e.target) { f.value = newValue; } });
        });
    });
}

function handleLogin(e) { e.preventDefault(); const email = document.getElementById('login-email').value; const password = document.getElementById('login-password').value; signInWithEmailAndPassword(auth, email, password).then(userCredential => { mostrarNotificacion("Bienvenido de nuevo", "exito"); }).catch(error => { mostrarNotificacion("Credenciales incorrectas.", "error"); }); }
function handleLogout() { signOut(auth).catch(error => { mostrarNotificacion("Error al cerrar sesión: " + error.message, "error"); }); }

function asignarEventosApp() {
    // Eventos de Navegación
    document.getElementById('btnTabInicio').addEventListener('click', (e) => openMainTab(e, 'tabInicio'));
    document.getElementById('btnTabRegistrar').addEventListener('click', (e) => openMainTab(e, 'tabRegistrar'));
    document.getElementById('btnTabReportes').addEventListener('click', (e) => openMainTab(e, 'tabReportes'));
    document.getElementById('btnTabHistorial').addEventListener('click', (e) => openMainTab(e, 'tabHistorial'));
    
    // Evento para la pestaña de Distribución
    document.getElementById('btnTabDistribuir').addEventListener('click', (e) => {
        openMainTab(e, 'tabDistribuir');
        reiniciarFormularioDistribucion(); 
        actualizarCamposDistribucion();
        // Ocultar previsualización al abrir
        document.getElementById('tablaDistribucionPreview').style.display = 'none';
        document.getElementById('btnPrevisualizarDistribucion').style.display = 'block';
        document.getElementById('btnCancelarPreview').style.display = 'none';
        // Asegurarse de que el formulario esté habilitado
        document.querySelectorAll('#distribucionForm input, #distribucionForm select, #distribucionForm textarea').forEach(el => el.disabled = false);
    });
    
    document.getElementById('btnTabAdmin').addEventListener('click', (e) => openMainTab(e, 'tabAdmin'));
    
    // Eventos de Formularios
    document.getElementById('consumoForm').addEventListener('submit', guardarOActualizar);
    
    // Evento para guardar distribución (Ahora es la función de previsualización)
    const btnPrevisualizar = document.getElementById('btnPrevisualizarDistribucion');
    const btnConfirmar = document.getElementById('btnConfirmarGuardado');
    const btnCancelar = document.getElementById('btnCancelarPreview');

    if (btnPrevisualizar) btnPrevisualizar.addEventListener('click', previsualizarDistribucion); 
    if (btnConfirmar) btnConfirmar.addEventListener('click', confirmarGuardado);
    
    // Evento para cancelar previsualización/editar
    if (btnCancelar) btnCancelar.addEventListener('click', () => {
        document.getElementById('tablaDistribucionPreview').style.display = 'none';
        document.getElementById('btnPrevisualizarDistribucion').style.display = 'block';
        document.getElementById('btnCancelarPreview').style.display = 'none';
        // Habilitar inputs del formulario
        document.querySelectorAll('#distribucionForm input, #distribucionForm select, #distribucionForm textarea').forEach(el => el.disabled = false);
        // Desactivar el botón de confirmar
        document.getElementById('btnConfirmarGuardado').disabled = true;
    });

    
    // Eventos de Cálculo de Distribución
    const totalGalonesInput = document.getElementById('distribucionGalonesTotal');
    const totalCostoInput = document.getElementById('distribucionCostoTotal');

    if (totalGalonesInput) totalGalonesInput.addEventListener('input', calcularTotalesDistribucion); 
    if (totalCostoInput) totalCostoInput.addEventListener('input', calcularTotalesDistribucion);

    // CORRECCIÓN: Re-habilitar los Eventos del Modal
    const modal = document.getElementById('modalRegistro');
    const btnCerrarModal = modal ? modal.querySelector('.close-button') : null; 
    
    if (btnAbrirModal) {
        btnAbrirModal.addEventListener('click', () => {
            reiniciarFormulario(); 
            abrirModal();
        });
    }

    if (btnCerrarModal) {
        btnCerrarModal.addEventListener('click', cerrarModal);
    }
    
    document.querySelectorAll('.btn-print').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetId = e.currentTarget.dataset.printTarget;
            const targetTab = document.getElementById(targetId);
            if (targetTab) {
                tabActivaParaImprimir = targetTab;
                targetTab.classList.add('printable-active');
                window.print();
            }
        });
    });
    
    window.onafterprint = () => {
        if (tabActivaParaImprimir) {
            tabActivaParaImprimir.classList.remove('printable-active');
            tabActivaParaImprimir = null;
        }
        document.getElementById('facturas-impresion').innerHTML = '';
    };
    
    document.querySelectorAll('#btnAplicarFiltros').forEach(btn => btn.addEventListener('click', actualizarTodaLaUI));
    document.querySelectorAll('#btnLimpiarFiltros').forEach(btn => btn.addEventListener('click', () => {
        document.querySelectorAll('.filtro-sincronizado').forEach(filtro => {
            const valorOriginal = filtro.value;
            if(filtro.tagName === 'SELECT') filtro.value = 'todos'; else filtro.value = '';
            if (filtro.value !== valorOriginal) { filtro.dispatchEvent(new Event('change', { 'bubbles': true })); }
        });
        actualizarTodaLaUI();
    }));
    
    document.getElementById('historialBody').addEventListener('click', manejarAccionesHistorial);

    // Eventos de Administración
    document.getElementById('formAdminChofer').addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('choferes', document.getElementById('nuevoChofer')); });
    document.getElementById('formAdminPlaca').addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('placas', document.getElementById('nuevaPlaca')); });
    document.getElementById('formAdminDetallesVolqueta').addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('detallesVolqueta', document.getElementById('nuevoDetalleVolqueta')); });
    document.getElementById('formAdminEmpresa').addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('empresas', document.getElementById('nuevaEmpresa')); });
    document.getElementById('formAdminProveedor').addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proveedores', document.getElementById('nuevoProveedor')); });
    document.getElementById('formAdminProyecto').addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proyectos', document.getElementById('nuevoProyecto')); });
    
    // Eventos de Dashboard
    document.getElementById('btnDashRegistrar').addEventListener('click', () => {
        reiniciarFormulario(); 
        openMainTab(null, 'tabRegistrar');
        abrirModal(); // Se abre el modal al navegar desde el dashboard
    });

    document.getElementById('btnDashHistorial').addEventListener('click', () => {
        openMainTab(null, 'tabHistorial');
    });

    document.getElementById('btnDashAdmin').addEventListener('click', () => {
        openMainTab(null, 'tabAdmin');
    });

    document.getElementById('btnDashImprimir').addEventListener('click', () => {
        const ahora = new Date();
        const anio = ahora.getFullYear();
        const mes = (ahora.getMonth() + 1).toString().padStart(2, '0');
        const mesActual = `${anio}-${mes}`;

        const filtroReportes = document.getElementById('filtroMesReportes');
        if (filtroReportes && filtroReportes.querySelector(`option[value="${mesActual}"]`)) {
            filtroReportes.value = mesActual;
            filtroReportes.dispatchEvent(new Event('change', { 'bubbles': true }));
        } else if (filtroReportes) {
            mostrarNotificacion("No hay datos para el mes actual.", "info");
            filtroReportes.value = 'todos';
            filtroReportes.dispatchEvent(new Event('change', { 'bubbles': true }));
        }
        
        actualizarTodaLaUI();
        openMainTab(null, 'tabReportes');

        const btnPrintReportes = document.querySelector('.btn-print[data-print-target="tabReportes"]');
        if (btnPrintReportes) {
            btnPrintReportes.click();
        }
    });

    const botonesAcordeon = document.querySelectorAll('.accordion-button');
    botonesAcordeon.forEach(boton => {
        boton.addEventListener('click', function() {
            this.classList.toggle('active');
            const panel = this.nextElementSibling;
            if (panel.style.maxHeight) { panel.style.maxHeight = null; } else { panel.style.maxHeight = panel.scrollHeight + "px"; } 
        });
    });

    asignarSincronizacionDeFiltros();
}


// --- NUEVAS FUNCIONES DE DISTRIBUCIÓN POR PROYECTO ---

function reiniciarFormularioDistribucion() {
    const form = document.getElementById('distribucionForm');
    if (form) form.reset();

    const idInput = document.getElementById('distribucionRegistroId');
    if (idInput) idInput.value = '';

    const fechaInput = document.getElementById('distribucionFecha');
    if (fechaInput) fechaInput.valueAsDate = new Date();

    // Sincronizar selectores con los datos actuales
    sincronizarSelectoresDistribucion();
    
    // Reiniciar totales pendientes
    const galonesSpan = document.getElementById('galonesPendientes');
    const costoSpan = document.getElementById('costoPendiente');

    if (galonesSpan) { 
        galonesSpan.textContent = '0.00';
        galonesSpan.style.color = 'red';
    }
    if (costoSpan) { 
        costoSpan.textContent = '$ 0.00';
        costoSpan.style.color = 'red';
    }
    
    // Volver a cargar campos de proyecto (incluye el recalculate)
    actualizarCamposDistribucion();
}

function sincronizarSelectoresDistribucion() {
    // Sincroniza los selectores de la pestaña "Distribución"
    const selectores = { 
        choferes: document.getElementById('distribucionSelectChofer'), 
        placas: document.getElementById('distribucionSelectVolqueta'), 
        // Eliminado: detallesVolqueta, empresas
        proveedores: document.getElementById('distribucionSelectProveedor'),
        // Agregado el selector de Proyecto único
        proyectos: document.getElementById('distribucionSelectProyecto')
    };
    const titulos = { 
        choferes: '--- Chofer ---', 
        placas: '--- Placa ---', 
        proveedores: '--- Proveedor ---',
        proyectos: '--- Proyecto ---'
    };
    // Listas de Admin para referencia
    const adminLists = {
        choferes: listasAdmin.choferes,
        placas: listasAdmin.placas,
        proveedores: listasAdmin.proveedores,
        proyectos: listasAdmin.proyectos
    };
    
    for (const tipo in selectores) {
        const select = selectores[tipo];
        if (!select) continue;
        const valorActual = select.value;
        const lista = adminLists[tipo];
        
        select.innerHTML = `<option value="">${titulos[tipo]}</option>`; 
        if (lista) {
             lista.forEach(item => { select.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });
        }
        select.value = valorActual;
    }
}

function actualizarCamposDistribucion() {
    const container = document.getElementById('distribucionProyectosContainer');
    if (!container) return; 

    // Guardar el bloque de totales para reinsertarlo al final
    const totalesElement = container.querySelector('#distribucionTotales');
    const totalesHTML = totalesElement ? totalesElement.outerHTML : 
        `<div id="distribucionTotales" style="grid-column: 1 / -1; display: flex; justify-content: space-between; font-weight: bold; margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 10px;">
            <span>Galones Pendientes: <span id="galonesPendientes" style="color: red;">0.00</span></span>
            <span>Costo Pendiente: <span id="costoPendiente" style="color: red;">$ 0.00</span></span>
        </div>`;
    
    container.innerHTML = '';
    
    if (listasAdmin.proyectos.length === 0) {
        container.innerHTML = '<div style="grid-column: 1 / -1;"><p class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i> No hay proyectos registrados. Vaya a Administración.</p></div>';
        return;
    }

    listasAdmin.proyectos.forEach(proyecto => {
        const div = document.createElement('div');
        div.className = 'distribucion-proyecto-item';
        div.dataset.proyecto = proyecto.nombre;
        div.innerHTML = `
            <label>Galones (${proyecto.nombre}):</label>
            <input type="number" step="0.01" data-type="galones" data-proyecto="${proyecto.nombre}" value="0.00" min="0">
            <label>Costo ($) (${proyecto.nombre}):</label>
            <input type="number" step="0.01" data-type="costo" data-proyecto="${proyecto.nombre}" value="0.00" min="0" disabled>
        `;
        container.appendChild(div);
    });

    // Reinsertar el bloque de totales pendientes
    container.insertAdjacentHTML('beforeend', totalesHTML);
    // Volver a asignar el evento de cálculo a todos los nuevos inputs
    container.querySelectorAll('input[data-type="galones"]').forEach(input => {
        input.addEventListener('input', calcularTotalesDistribucion);
    });
    // Escuchar cambios en los totales para recalcular costos unitarios
    document.getElementById('distribucionGalonesTotal')?.addEventListener('input', calcularTotalesDistribucion);
    document.getElementById('distribucionCostoTotal')?.addEventListener('input', calcularTotalesDistribucion);
    
    // Aplicar la primera ejecución del cálculo
    calcularTotalesDistribucion();
}

function calcularTotalesDistribucion() {
    const totalGalonesInput = document.getElementById('distribucionGalonesTotal');
    const totalCostoInput = document.getElementById('distribucionCostoTotal');
    const totalGalones = parseFloat(totalGalonesInput?.value) || 0;
    const totalCosto = parseFloat(totalCostoInput?.value) || 0;

    let costoUnitario = 0;
    if (totalGalones > 0 && totalCosto >= 0) {
        costoUnitario = totalCosto / totalGalones;
    }

    let sumaGalonesDistribuidos = 0;

    // 1. Calcular y actualizar los costos por proyecto
    document.querySelectorAll('#distribucionProyectosContainer input[data-type="galones"]').forEach(galonesInput => {
        const galones = parseFloat(galonesInput.value) || 0;
        const proyectoNombre = galonesInput.dataset.proyecto;
        const costoInput = document.querySelector(`input[data-proyecto="${proyectoNombre}"][data-type="costo"]`);
        
        // Calcular el costo basado en el volumen y el costo unitario
        const costoCalculado = galones * costoUnitario;
        
        if (costoInput) {
            costoInput.value = costoCalculado.toFixed(2);
        }
        
        sumaGalonesDistribuidos += galones;
    });
    
    // 2. Calcular pendientes (SOLO GALONES)
    const galonesPendientes = totalGalones - sumaGalonesDistribuidos;
    
    // El costo pendiente se calcula por diferencia para mostrar si hay desbalance
    const sumaCostoDistribuido = sumaGalonesDistribuidos * costoUnitario;
    const costoPendiente = totalCosto - sumaCostoDistribuido;
    
    // Mostrar en la UI
    const galonesSpan = document.getElementById('galonesPendientes');
    const costoSpan = document.getElementById('costoPendiente');

    if (!galonesSpan || !costoSpan) return;

    galonesSpan.textContent = galonesPendientes.toFixed(2);
    costoSpan.textContent = `$ ${costoPendiente.toFixed(2)}`;

    // Cambiar color si está OK (dentro de una pequeña tolerancia) o hay error
    galonesSpan.style.color = (Math.abs(galonesPendientes) < 0.01) ? 'green' : 'red';
    costoSpan.style.color = (Math.abs(costoPendiente) < 0.01) ? 'green' : 'red';
}


async function previsualizarDistribucion() {
    // 1. Deshabilitar botón para evitar doble clic
    const btnPrevisualizar = document.getElementById('btnPrevisualizarDistribucion');
    if (btnPrevisualizar) {
        btnPrevisualizar.disabled = true;
        btnPrevisualizar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Previsualizando...';
    }

    // 2. Obtener datos base
    const totalGalones = parseFloat(document.getElementById('distribucionGalonesTotal')?.value) || 0;
    const totalCosto = parseFloat(document.getElementById('distribucionCostoTotal')?.value) || 0;
    const proyectoUnico = document.getElementById('distribucionSelectProyecto')?.value;

    // Datos simplificados
    const datosBase = {
        fecha: document.getElementById('distribucionFecha')?.value,
        hora: document.getElementById('distribucionHora')?.value,
        volqueta: document.getElementById('distribucionSelectVolqueta')?.value,
        chofer: document.getElementById('distribucionSelectChofer')?.value,
        proveedor: document.getElementById('distribucionSelectProveedor')?.value,
        
        // Campos fijos o vacíos
        empresa: "", 
        detallesVolqueta: "", 
        kilometraje: null,
        descripcion: "Consumo distribuido (Automatizado)" 
    };

    // 3. Validación Mínima
    if (!datosBase.chofer || !datosBase.volqueta || totalGalones <= 0 || totalCosto <= 0) {
        mostrarNotificacion("Por favor, complete Chofer, Placa y que los Totales de galones/costo sean mayores a cero.", "error");
        if (btnPrevisualizar) {
            btnPrevisualizar.disabled = false;
            btnPrevisualizar.innerHTML = '<i class="fa-solid fa-eye"></i> Previsualizar y Distribuir';
        }
        return;
    }

    // 4. Determinar Modo y Recopilar Registros
    const registros = [];
    const galonesDistribuidos = Array.from(document.querySelectorAll('#distribucionProyectosContainer input[data-type="galones"]'))
        .map(input => parseFloat(input.value) || 0);
    
    const tieneDistribucion = galonesDistribuidos.some(g => g > 0);
    const previewBody = document.getElementById('previewTableBody');
    const validationMessage = document.getElementById('previewValidationMessage');
    const previewContainer = document.getElementById('tablaDistribucionPreview');
    const btnConfirmar = document.getElementById('btnConfirmarGuardado');

    previewBody.innerHTML = '';
    validationMessage.textContent = '';
    btnConfirmar.disabled = true;

    if (tieneDistribucion) {
        // MODO DISTRIBUCIÓN
        calcularTotalesDistribucion();
        const galonesPendientes = parseFloat(document.getElementById('galonesPendientes')?.textContent);
        
        // **Validación enfocada SÓLO en galones**
        if (Math.abs(galonesPendientes) >= 0.01) {
            validationMessage.textContent = "⚠️ Error: La suma de GALONES distribuidos NO coincide con el Total. Ajuste los campos.";
            previewContainer.style.display = 'block';
            if (btnPrevisualizar) {
                btnPrevisualizar.disabled = false;
                btnPrevisualizar.innerHTML = '<i class="fa-solid fa-eye"></i> Previsualizar y Distribuir';
            }
            return;
        }

        // Crear múltiples registros para la preview
        listasAdmin.proyectos.forEach(proyecto => {
            const galonesInput = document.querySelector(`input[data-proyecto="${proyecto.nombre}"][data-type="galones"]`);
            const costoInput = document.querySelector(`input[data-proyecto="${proyecto.nombre}"][data-type="costo"]`);
            
            const galones = parseFloat(galonesInput?.value) || 0;
            const costo = parseFloat(costoInput?.value) || 0; // Se toma el valor auto-calculado

            if (galones > 0 || costo > 0) {
                registros.push({
                    ...datosBase,
                    proyecto: proyecto.nombre,
                    galones: galones.toFixed(2),
                    costo: costo.toFixed(2),
                });
            }
        });

    } else if (proyectoUnico) {
        // MODO REGISTRO ÚNICO
        registros.push({
            ...datosBase,
            proyecto: proyectoUnico,
            galones: totalGalones.toFixed(2),
            costo: totalCosto.toFixed(2),
        });

    } else {
        // Ni distribución, ni proyecto único seleccionado.
        validationMessage.textContent = "⚠️ Debe seleccionar un Proyecto (si es único) O ingresar la distribución por proyecto.";
        previewContainer.style.display = 'block';
        if (btnPrevisualizar) {
            btnPrevisualizar.disabled = false;
            btnPrevisualizar.innerHTML = '<i class="fa-solid fa-eye"></i> Previsualizar y Distribuir';
        }
        return;
    }

    if (registros.length === 0) {
        validationMessage.textContent = "⚠️ No se generó ningún registro válido. Revise los campos de distribución.";
        previewContainer.style.display = 'block';
        if (btnPrevisualizar) {
            btnPrevisualizar.disabled = false;
            btnPrevisualizar.innerHTML = '<i class="fa-solid fa-eye"></i> Previsualizar y Distribuir';
        }
        return;
    }
    
    // --- 5. Mostrar la tabla de previsualización ---
    let htmlContent = '';
    registros.forEach(r => {
        htmlContent += `<tr>
            <td>${r.proyecto}</td>
            <td>${r.galones}</td>
            <td>$${r.costo}</td>
            <td>${r.fecha} ${r.hora}</td>
            <td>${r.volqueta}</td>
        </tr>`;
    });

    previewBody.innerHTML = htmlContent;
    validationMessage.textContent = `✅ Se van a crear ${registros.length} registros. Revise y confirme.`;
    btnConfirmar.disabled = false;
    
    // Deshabilitar el formulario para evitar cambios antes de guardar
    document.querySelectorAll('#distribucionForm input, #distribucionForm select, #distribucionForm textarea').forEach(el => el.disabled = true);
    
    document.getElementById('btnPrevisualizarDistribucion').style.display = 'none';
    document.getElementById('btnCancelarPreview').style.display = 'block';
    previewContainer.style.display = 'block';
    
    // Almacenar registros temporalmente para la confirmación
    registrosParaGuardar = registros;
    
    // Re-habilitar botón
    if (btnPrevisualizar) {
        btnPrevisualizar.disabled = false;
        btnPrevisualizar.innerHTML = '<i class="fa-solid fa-eye"></i> Previsualizar y Distribuir';
    }
}


// NUEVA FUNCIÓN: Confirma y guarda los registros temporales
async function confirmarGuardado() {
    if (registrosParaGuardar.length === 0) {
        mostrarNotificacion("No hay registros para guardar. Previsualice primero.", "error");
        return;
    }
    
    const btnConfirmar = document.getElementById('btnConfirmarGuardado');
    btnConfirmar.disabled = true;
    btnConfirmar.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Guardando en Firebase...';

    try {
        const promesas = registrosParaGuardar.map(registro => addDoc(collection(db, "consumos"), registro));
        await Promise.all(promesas);
        
        mostrarNotificacion(`Éxito: Se crearon ${registrosParaGuardar.length} registros distribuidos.`, "exito", 5000);
        
        // Limpiar y resetear la UI
        document.getElementById('tablaDistribucionPreview').style.display = 'none';
        reiniciarFormularioDistribucion();
        await cargarDatosIniciales();
        
        if (!esModoObservador) {
            openMainTab(null, 'tabInicio');
        }
        registrosParaGuardar = []; // Limpiar caché
        
    } catch (error) {
        console.error("Error guardando distribución:", error);
        mostrarNotificacion(`Error al guardar: ${error.message}`, "error", 5000);
        
        // Revertir el estado de los botones tras el error
        document.querySelectorAll('#distribucionForm input, #distribucionForm select, #distribucionForm textarea').forEach(el => el.disabled = false);
        document.getElementById('btnConfirmarGuardado').disabled = false;
        document.getElementById('btnConfirmarGuardado').innerHTML = '<i class="fa-solid fa-cloud-upload-alt"></i> Confirmar y Guardar Registros';
        document.getElementById('btnPrevisualizarDistribucion').style.display = 'block';
        document.getElementById('btnCancelarPreview').style.display = 'none';
        
    } finally {
        const btnPrevisualizar = document.getElementById('btnPrevisualizarDistribucion');
        if (btnPrevisualizar) {
            btnPrevisualizar.innerHTML = '<i class="fa-solid fa-eye"></i> Previsualizar y Distribuir';
            btnPrevisualizar.disabled = false;
        }
    }
}

// --- FIN NUEVAS FUNCIONES DE DISTRIBUCIÓN POR PROYECTO ---


function iniciarAplicacion() {
    asignarEventosApp();
    cargarDatosIniciales();
}

document.getElementById('login-form').addEventListener('submit', handleLogin);
btnLogout.addEventListener('click', handleLogout);