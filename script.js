import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, doc, addDoc, updateDoc, deleteDoc, query, orderBy, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCElg_et8_Z8ERTWo5tAwZJk2tb2ztUwlc",
    authDomain: "jlmp-diesel.firebaseapp.com",
    projectId: "jlmp-diesel",
    storageBucket: "jlmp-diesel.firebasestorage.app",
    messagingSenderId: "763318949751",
    appId: "1:763318949751:web:e712d1008d34fbc98ab372"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const vistaLogin = document.getElementById('vista-login');
const vistaApp = document.getElementById('vista-app');
const modalGestionarVolquetas = document.getElementById('modalGestionarVolquetas');

let todosLosConsumos = [];
let listasAdmin = { choferes: [], placas: [], empresas: [], proveedores: [], proyectos: [] };
let appInicializada = false;
let choferSiendoEditado = null;

onAuthStateChanged(auth, (user) => {
    if (user) {
        vistaLogin.style.display = 'none';
        vistaApp.style.display = 'block';
        if (!appInicializada) {
            iniciarAplicacion();
            appInicializada = true;
        }
    } else {
        vistaLogin.style.display = 'flex';
        vistaApp.style.display = 'none';
        appInicializada = false;
    }
});

function mostrarNotificacion(texto, tipo = 'info') {
    let backgroundColor;
    switch (tipo) {
        case 'exito': backgroundColor = "linear-gradient(to right, #00b09b, #96c93d)"; break;
        case 'error': backgroundColor = "linear-gradient(to right, #ff5f6d, #ffc371)"; break;
        default: backgroundColor = "#007bff"; break;
    }
    Toastify({ text: texto, duration: 3500, close: true, gravity: "top", position: "right", stopOnFocus: true, style: { background: backgroundColor, } }).showToast();
}

const modal = document.getElementById('modalRegistro');
const btnAbrirModal = document.getElementById('btnAbrirModal');
const btnCerrarModal = modal.querySelector('.close-button');
function abrirModal() { modal.style.display = 'block'; }
function cerrarModal() { modal.style.display = 'none'; reiniciarFormulario(); }

function openMainTab(evt, tabName) {
    let i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("main-tab-content");
    for (i = 0; i < tabcontent.length; i++) { tabcontent[i].style.display = "none"; }
    tablinks = document.getElementsByClassName("main-tab-link");
    for (i = 0; i < tablinks.length; i++) { tablinks[i].className = tablinks[i].className.replace(" active", ""); }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}

async function cargarDatosIniciales() {
    document.getElementById('loadingMessage').style.display = 'block';
    try {
        const [consumosRes, choferesRes, placasRes, empresasRes, proveedoresRes, proyectosRes] = await Promise.all([
            getDocs(query(collection(db, "consumos"), orderBy("fecha", "desc"))), 
            getDocs(query(collection(db, "choferes"), orderBy("nombre"))), 
            getDocs(query(collection(db, "placas"), orderBy("nombre"))), 
            getDocs(query(collection(db, "empresas"), orderBy("nombre"))), 
            getDocs(query(collection(db, "proveedores"), orderBy("nombre"))), 
            getDocs(query(collection(db, "proyectos"), orderBy("nombre")))
        ]);
        todosLosConsumos = consumosRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.choferes = choferesRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.placas = placasRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.empresas = empresasRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.proveedores = proveedoresRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        listasAdmin.proyectos = proyectosRes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        actualizarTodaLaUI();
    } catch (error) {
        console.error("Error cargando datos:", error);
        document.getElementById('loadingMessage').textContent = "Error al cargar datos. Revisa la consola (F12) y las Reglas de Firestore.";
    } finally {
        if (document.getElementById('loaderContainer')) { document.getElementById('loaderContainer').style.display = 'none'; }
    }
}

function actualizarTodaLaUI() {
    poblarFiltroDeMes();
    poblarFiltrosReportes();
    const consumosFiltrados = obtenerConsumosFiltrados();
    calcularYMostrarTotalesPorEmpresa(consumosFiltrados);
    calcularYMostrarTotalesPorProveedor(consumosFiltrados);
    calcularYMostrarTotalesPorProyecto(consumosFiltrados);
    calcularYMostrarTotalesPorChofer(consumosFiltrados);
    poblarSelectores();
    mostrarListasAdmin();
    mostrarHistorialAgrupado(consumosFiltrados);
    crearOActualizarGrafico(calcularYMostrarTotales(consumosFiltrados));
}

function poblarSelectores() {
    const selectChofer = document.getElementById('selectChofer');
    const volquetaSelect = document.getElementById('selectVolqueta');
    const choferActual = selectChofer.value;
    selectChofer.innerHTML = '<option value="" disabled selected>--- Chofer ---</option>';
    listasAdmin.choferes.forEach(item => {
        selectChofer.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`;
    });
    selectChofer.value = choferActual;
    if (!choferActual) {
        volquetaSelect.innerHTML = '<option value="" disabled selected>--- Primero elija un chofer ---</option>';
    }

    const otrosSelectores = { empresas: document.getElementById('selectEmpresa'), proveedores: document.getElementById('selectProveedor'), proyectos: document.getElementById('selectProyecto') };
    const titulos = { empresas: '--- Empresa ---', proveedores: '--- Proveedor ---', proyectos: '--- Proyecto ---' };

    for (const tipo in otrosSelectores) {
        const select = otrosSelectores[tipo];
        if (!select) continue;
        const valorActual = select.value;
        select.innerHTML = `<option value="" disabled selected>${titulos[tipo]}</option>`;
        listasAdmin[tipo].forEach(item => { select.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; });
        select.value = valorActual;
    }
}

function reiniciarFormulario() {
    document.getElementById('consumoForm').reset();
    document.getElementById('registroId').value = '';
    document.getElementById('fecha').valueAsDate = new Date();
    document.getElementById('formularioTitulo').textContent = 'Nuevo Registro';
    poblarSelectores();
}

async function guardarOActualizar(e) {
    e.preventDefault();
    const id = document.getElementById('registroId').value;
    const datosConsumo = { volqueta: document.getElementById('selectVolqueta').value, fecha: document.getElementById('fecha').value, galones: document.getElementById('galones').value, costo: document.getElementById('costo').value, descripcion: document.getElementById('descripcion').value, chofer: document.getElementById('selectChofer').value, empresa: document.getElementById('selectEmpresa').value, proveedor: document.getElementById('selectProveedor').value, proyecto: document.getElementById('selectProyecto').value };
    if (!datosConsumo.chofer || !datosConsumo.volqueta || !datosConsumo.empresa || !datosConsumo.proveedor || !datosConsumo.proyecto) {
        mostrarNotificacion("Por favor, complete todos los campos.", "error"); return;
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
    } catch (error) {
        console.error("Error guardando:", error);
        mostrarNotificacion("No se pudo guardar el registro.", "error");
    }
}

async function agregarItemAdmin(tipo, inputElement) {
    // Esta función ahora solo maneja los tipos simples
    const valor = (tipo === 'placas') ? inputElement.value.trim().toUpperCase() : inputElement.value.trim();
    if (valor) {
        try {
            await addDoc(collection(db, tipo), { nombre: valor });
            mostrarNotificacion(`Elemento agregado correctamente.`, "exito");
            inputElement.value = '';
            await cargarDatosIniciales();
        } catch (error) {
            console.error("Error agregando:", error);
            mostrarNotificacion("No se pudo agregar el elemento.", "error");
        }
    }
}

async function handleAgregarChofer(e) {
    e.preventDefault();
    const nombre = document.getElementById('nuevoChofer').value.trim();
    if (nombre) {
        const listaNombres = listasAdmin.choferes.map(item => item.nombre.toUpperCase());
        if (listaNombres.includes(nombre.toUpperCase())) {
            mostrarNotificacion(`El chofer "${nombre}" ya existe.`, "error"); return;
        }
        try {
            await addDoc(collection(db, "choferes"), { nombre: nombre, volquetas: [] });
            mostrarNotificacion(`Chofer agregado correctamente.`, "exito");
            document.getElementById('nuevoChofer').value = '';
            await cargarDatosIniciales();
        } catch (error) {
            console.error("Error agregando chofer:", error);
            mostrarNotificacion("No se pudo agregar el chofer.", "error");
        }
    } else {
        mostrarNotificacion("Por favor, ingresa el nombre del chofer.", "error");
    }
}

function manejarAccionesHistorial(e) { const target = e.target.closest('button'); if (!target) return; const id = target.dataset.id; if (!id) return; if (target.classList.contains('btn-modificar')) cargarDatosParaModificar(id); if (target.classList.contains('btn-borrar')) borrarConsumoHistorial(id); }

function obtenerConsumosFiltrados() {
    const mes = document.getElementById('filtroMes').value;
    const fechaInicio = document.getElementById('filtroFechaInicio').value;
    const fechaFin = document.getElementById('filtroFechaFin').value;
    const chofer = document.getElementById('filtroChofer').value, proveedor = document.getElementById('filtroProveedor').value, empresa = document.getElementById('filtroEmpresa').value, proyecto = document.getElementById('filtroProyecto').value;
    let consumosFiltrados = todosLosConsumos;
    if (fechaInicio && fechaFin) {
        if (fechaFin < fechaInicio) { mostrarNotificacion("La fecha de fin no puede ser anterior a la de inicio.", "error"); return []; }
        consumosFiltrados = consumosFiltrados.filter(c => c.fecha >= fechaInicio && c.fecha <= fechaFin);
    } else if (fechaInicio) { consumosFiltrados = consumosFiltrados.filter(c => c.fecha === fechaInicio); } else if (mes !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.fecha.startsWith(mes)); }
    if (chofer !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.chofer === chofer); }
    if (proveedor !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.proveedor === proveedor); }
    if (empresa !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.empresa === empresa); }
    if (proyecto !== 'todos') { consumosFiltrados = consumosFiltrados.filter(c => c.proyecto === proyecto); }
    return consumosFiltrados;
}

function mostrarListasAdmin() {
    const contenedores = { choferes: 'listaChoferes', placas: 'listaPlacas', empresas: 'listaEmpresas', proveedores: 'listaProveedores', proyectos: 'listaProyectos' };
    for (const tipo in contenedores) {
        const ul = document.getElementById(contenedores[tipo]);
        if (!ul) continue;
        ul.innerHTML = '';
        if (listasAdmin[tipo].length === 0) {
            ul.innerHTML = `<li class="empty-state">No hay elementos.</li>`;
            continue;
        }
        listasAdmin[tipo].forEach(item => {
            const li = document.createElement('li');
            const nombreSpan = document.createElement('span');
            if (tipo === 'choferes') {
                nombreSpan.innerHTML = `${item.nombre} <small>(${(item.volquetas || []).length} volquetas)</small>`;
            } else {
                nombreSpan.textContent = item.nombre;
            }
            li.appendChild(nombreSpan);

            const divBotones = document.createElement('div');
            const btnModificar = document.createElement('button');
            btnModificar.className = "btn-accion btn-modificar";
            btnModificar.title = "Modificar";
            btnModificar.innerHTML = `<i class="fa-solid fa-pencil" style="margin:0;"></i>`;
            btnModificar.addEventListener('click', () => modificarItemAdmin(item, tipo));
            
            const btnBorrar = document.createElement('button');
            btnBorrar.className = "btn-accion btn-borrar";
            btnBorrar.title = "Borrar";
            btnBorrar.innerHTML = `<i class="fa-solid fa-trash-can" style="margin:0;"></i>`;
            btnBorrar.addEventListener('click', () => borrarItemAdmin(item, tipo));

            divBotones.appendChild(btnModificar);
            divBotones.appendChild(btnBorrar);
            li.appendChild(divBotones);
            ul.appendChild(li);
        });
    }
}

async function modificarItemAdmin(item, tipo) {
    if (tipo === 'choferes') {
        abrirModalVolquetas(item);
    } else {
        const valorActual = item.nombre;
        const nuevoValor = prompt(`Modificar "${valorActual}":`, valorActual);
        if (!nuevoValor || nuevoValor.trim() === '' || nuevoValor.trim() === valorActual) return;
        const valorFormateado = (tipo === 'placas') ? nuevoValor.trim().toUpperCase() : nuevoValor.trim();
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
    }
}

function cargarDatosParaModificar(id) {
    const consumo = todosLosConsumos.find(c => c.id === id); if (!consumo) return;
    document.getElementById('registroId').value = consumo.id; document.getElementById('fecha').value = consumo.fecha; 
    document.getElementById('selectChofer').value = consumo.chofer;
    actualizarVolquetasParaChofer(consumo.chofer, consumo.volqueta); 
    document.getElementById('galones').value = consumo.galones; document.getElementById('costo').value = consumo.costo; document.getElementById('descripcion').value = consumo.descripcion; document.getElementById('selectEmpresa').value = consumo.empresa || ""; document.getElementById('selectProveedor').value = consumo.proveedor || ""; document.getElementById('selectProyecto').value = consumo.proyecto || "";
    abrirModal();
}

function calcularYMostrarTotalesPorCategoria(consumos, categoria, bodyId, footerId) {
    const resumenBody = document.getElementById(bodyId);
    const resumenFooter = document.getElementById(footerId);
    resumenBody.innerHTML = '';
    resumenFooter.innerHTML = '';
    const totales = {};
    consumos.forEach(c => {
        const clave = c[categoria];
        if (!clave) return;
        if (!totales[clave]) totales[clave] = { totalGalones: 0, totalCosto: 0 };
        totales[clave].totalGalones += parseFloat(c.galones) || 0;
        totales[clave].totalCosto += parseFloat(c.costo) || 0;
    });
    if (Object.keys(totales).length === 0) {
        resumenBody.innerHTML = `<tr><td colspan="3" class="empty-state">No hay datos para esta categoría.</td></tr>`;
        return;
    }
    const clavesOrdenadas = Object.keys(totales).sort();
    let htmlBody = '', granTotalGalones = 0, granTotalCosto = 0;
    clavesOrdenadas.forEach(clave => {
        const total = totales[clave];
        htmlBody += `<tr><td><strong>${clave}</strong></td><td>${total.totalGalones.toFixed(2)}</td><td>$${total.totalCosto.toFixed(2)}</td></tr>`;
        granTotalGalones += total.totalGalones;
        granTotalCosto += total.totalCosto;
    });
    resumenBody.innerHTML = htmlBody;
    resumenFooter.innerHTML = `<tr><td><strong>TOTAL GENERAL</strong></td><td><strong>${granTotalGalones.toFixed(2)}</strong></td><td><strong>$${granTotalCosto.toFixed(2)}</strong></td></tr>`;
}

const calcularYMostrarTotalesPorEmpresa = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'empresa', 'resumenEmpresaBody', 'resumenEmpresaFooter');
const calcularYMostrarTotalesPorProveedor = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proveedor', 'resumenProveedorBody', 'resumenProveedorFooter');
const calcularYMostrarTotalesPorProyecto = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'proyecto', 'resumenProyectoBody', 'resumenProyectoFooter');
const calcularYMostrarTotalesPorChofer = (consumos) => calcularYMostrarTotalesPorCategoria(consumos, 'chofer', 'resumenChoferBody', 'resumenChoferFooter');
const calcularYMostrarTotales = (consumos) => {
    calcularYMostrarTotalesPorCategoria(consumos, 'volqueta', 'resumenBody', 'resumenFooter');
    const totales = {};
    consumos.forEach(c => {
        if (!totales[c.volqueta]) totales[c.volqueta] = { totalCosto: 0 };
        totales[c.volqueta].totalCosto += parseFloat(c.costo) || 0;
    });
    const placasOrdenadas = Object.keys(totales).sort();
    return { labels: placasOrdenadas, data: placasOrdenadas.map(placa => totales[placa].totalCosto) };
};

async function borrarItemAdmin(item, tipo) { if (confirm(`¿Seguro que quieres borrar "${item.nombre}"?`)) { try { await deleteDoc(doc(db, tipo, item.id)); mostrarNotificacion("Elemento borrado.", "exito"); await cargarDatosIniciales(); } catch(e) { console.error("Error borrando:", e); mostrarNotificacion("No se pudo borrar el elemento.", "error"); } } }
async function borrarConsumoHistorial(id) { if (confirm('¿Seguro que quieres borrar este registro?')) { try { await deleteDoc(doc(db, "consumos", id)); mostrarNotificacion("Registro borrado.", "exito"); await cargarDatosIniciales(); } catch (e) { console.error("Error borrando consumo:", e); mostrarNotificacion("No se pudo borrar el registro.", "error"); } } }

function poblarFiltroDeMes() { const filtroSelect = document.getElementById('filtroMes'); const mesesUnicos = [...new Set(todosLosConsumos.map(c => c.fecha.substring(0, 7)))]; mesesUnicos.sort().reverse(); const valorSeleccionado = filtroSelect.value; filtroSelect.innerHTML = '<option value="todos">Todos los Meses</option>'; mesesUnicos.forEach(mes => { const [year, month] = mes.split('-'); const fechaMes = new Date(year, month - 1); const nombreMes = fechaMes.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' }); const opcion = document.createElement('option'); opcion.value = mes; opcion.textContent = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1); filtroSelect.appendChild(opcion); }); if (filtroSelect.value) filtroSelect.value = valorSeleccionado || 'todos'; }
function poblarFiltrosReportes() { const selectores = { choferes: document.getElementById('filtroChofer'), proveedores: document.getElementById('filtroProveedor'), empresas: document.getElementById('filtroEmpresa'), proyectos: document.getElementById('filtroProyecto') }; const titulos = { choferes: 'Todos los Choferes', proveedores: 'Todos los Proveedores', empresas: 'Todas las Empresas', proyectos: 'Todos los Proyectos' }; for (const tipo in selectores) { const select = selectores[tipo]; if (!select) continue; const valorActual = select.value; select.innerHTML = `<option value="todos">${titulos[tipo]}</option>`; listasAdmin[tipo].forEach(item => { select.innerHTML += `<option value="${item.nombre}">${item.nombre}</option>`; }); select.value = valorActual || 'todos'; } }

function crearOActualizarGrafico(datos) {
    const ctx = document.getElementById('graficoConsumo').getContext('2d');
    if (miGrafico) { miGrafico.destroy(); }
    miGrafico = new Chart(ctx, { type: 'bar', data: { labels: datos.labels, datasets: [{ label: 'Costo Total de Consumo ($)', data: datos.data, backgroundColor: 'rgba(40, 167, 69, 0.7)', borderColor: 'rgba(40, 167, 69, 1)', borderWidth: 1 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { callback: function(value) { return '$' + value.toFixed(2); } } } }, plugins: { legend: { display: true, position: 'top' } } } });
}

function mostrarHistorialAgrupado(consumos) {
    const historialBody = document.getElementById('historialBody'); const historialFooter = document.getElementById('historialFooter');
    historialBody.innerHTML = '';
    historialFooter.innerHTML = '';
    if (consumos.length === 0) {
        historialBody.innerHTML = `<tr><td colspan="10" class="empty-state"><i class="fa-solid fa-folder-open"></i><p>No se encontraron registros para los filtros seleccionados.</p></td></tr>`;
        return;
    }
    let totalGalones = 0, totalCosto = 0;
    consumos.sort((a,b) => new Date(b.fecha) - new Date(a.fecha) || a.volqueta.localeCompare(b.volqueta));
    let mesAnioActual = "";
    consumos.forEach(consumo => {
        totalGalones += parseFloat(consumo.galones) || 0; totalCosto += parseFloat(consumo.costo) || 0;
        const fechaConsumo = new Date(consumo.fecha + 'T00:00:00'); const mesAnio = fechaConsumo.toLocaleDateString('es-EC', { month: 'long', year: 'numeric' });
        if (mesAnio !== mesAnioActual && !(document.getElementById('filtroFechaInicio').value && document.getElementById('filtroFechaFin').value)) {
            mesAnioActual = mesAnio;
            const filaGrupo = document.createElement('tr'); filaGrupo.className = 'fila-grupo'; filaGrupo.innerHTML = `<td colspan="10">${mesAnioActual.charAt(0).toUpperCase() + mesAnioActual.slice(1)}</td>`;
            historialBody.appendChild(filaGrupo);
        }
        const filaDato = document.createElement('tr');
        filaDato.innerHTML = `<td class="no-print"><button class="btn-accion btn-modificar" data-id="${consumo.id}" title="Modificar"><i class="fa-solid fa-pencil" style="margin: 0;"></i></button><button class="btn-accion btn-borrar" data-id="${consumo.id}" title="Borrar"><i class="fa-solid fa-trash-can" style="margin: 0;"></i></button></td><td>${consumo.fecha}</td> <td>${consumo.chofer}</td> <td>${consumo.volqueta}</td> <td>${consumo.proveedor || ''}</td> <td>${consumo.proyecto || ''}</td> <td>${(parseFloat(consumo.galones) || 0).toFixed(2)}</td> <td>$${(parseFloat(consumo.costo) || 0).toFixed(2)}</td> <td>${consumo.empresa || ''}</td> <td>${consumo.descripcion}</td>`;
        historialBody.appendChild(filaDato);
    });
    historialFooter.innerHTML = `<tr><td class="no-print"></td><td colspan="5" style="text-align: right;"><strong>TOTAL DE GALONES:</strong></td><td><strong>${totalGalones.toFixed(2)}</strong></td><td style="text-align: right;"><strong>VALOR TOTAL:</strong></td><td><strong>$${totalCosto.toFixed(2)}</strong></td><td></td></tr>`;
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => { mostrarNotificacion("Bienvenido de nuevo", "exito"); })
        .catch(error => { mostrarNotificacion("Credenciales incorrectas.", "error"); });
}

function handleLogout() {
    signOut(auth).catch(error => { mostrarNotificacion("Error al cerrar sesión: " + error.message, "error"); });
}

function asignarEventosApp() {
    btnAbrirModal.addEventListener('click', abrirModal);
    btnCerrarModal.addEventListener('click', cerrarModal);
    
    document.getElementById('btnTabRegistrar').addEventListener('click', (e) => openMainTab(e, 'tabRegistrar'));
    document.getElementById('btnTabReportes').addEventListener('click', (e) => openMainTab(e, 'tabReportes'));
    document.getElementById('btnTabAdmin').addEventListener('click', (e) => openMainTab(e, 'tabAdmin'));
    
    document.getElementById('consumoForm').addEventListener('submit', guardarOActualizar);
    document.getElementById('btnPrint').addEventListener('click', () => window.print());
    document.getElementById('btnAplicarFiltros').addEventListener('click', actualizarTodaLaUI);
    document.getElementById('btnLimpiarFiltros').addEventListener('click', () => {
        const filtros = ['filtroMes', 'filtroFechaInicio', 'filtroFechaFin', 'filtroChofer', 'filtroProveedor', 'filtroEmpresa', 'filtroProyecto'];
        filtros.forEach(id => { const el = document.getElementById(id); if(el) { if(el.tagName === 'SELECT') el.value = 'todos'; else el.value = ''; } });
        actualizarTodaLaUI();
    });
    
    document.getElementById('historialBody').addEventListener('click', manejarAccionesHistorial);
    document.getElementById('formAdminChofer').addEventListener('submit', handleAgregarChofer);
    document.getElementById('formAdminPlaca').addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('placas', document.getElementById('nuevaPlaca')); });
    document.getElementById('formAdminEmpresa').addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('empresas', document.getElementById('nuevaEmpresa')); });
    document.getElementById('formAdminProveedor').addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proveedores', document.getElementById('nuevoProveedor')); });
    document.getElementById('formAdminProyecto').addEventListener('submit', (e) => { e.preventDefault(); agregarItemAdmin('proyectos', document.getElementById('nuevoProyecto')); });
    
    const botonesAcordeon = document.querySelectorAll('.accordion-button');
    botonesAcordeon.forEach(boton => {
        boton.addEventListener('click', function() {
            this.classList.toggle('active');
            const panel = this.nextElementSibling;
            if (panel.style.maxHeight) { panel.style.maxHeight = null; } else { panel.style.maxHeight = panel.scrollHeight + "px"; } 
        });
    });
}

function iniciarAplicacion() {
    asignarEventosApp();
    cargarDatosIniciales();
}

// ASIGNACIÓN INICIAL DE EVENTOS DE LOGIN
document.getElementById('login-form').addEventListener('submit', handleLogin);
document.getElementById('btn-logout').addEventListener('click', handleLogout);