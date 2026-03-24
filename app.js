// ===============================
// VARIABLES GENERALES
// ===============================
let graficoProgreso;
let graficoAguinaldo;
let graficoSalarioEscolar;
let historialAhorro = [];
let usuarioActual = null;

let historialGeneral = []; // se llenará cuando el usuario haga login

const usuarios = [
    { usuario: "admin", password: "1234" },
    { usuario: "usuario", password: "abcd" },
    { usuario: "Suazo", password: "1895" }
];

let totalAhorro = 0;
let meta = 1000000;


// ===============================
// LOGIN
// ===============================
const formLogin = document.getElementById("form-login");
const mensajeLogin = document.getElementById("mensaje-login");

formLogin.addEventListener("submit", function(event) {

    event.preventDefault();

    const usuarioIngresado = document.getElementById("usuario").value;
    const passwordIngresado = document.getElementById("password").value;

    const usuarioValido = usuarios.find(u =>
        u.usuario === usuarioIngresado &&
        u.password === passwordIngresado
    );

    if (usuarioValido) {

        usuarioActual = usuarioValido.usuario;

        localStorage.setItem("sesionActiva", usuarioActual);

        document.getElementById("login-section").style.display = "none";
        document.getElementById("app-container").style.display = "flex";
        activarMenu();

        cargarDatosUsuario();
        mostrarSeccion("dashboard");
        generarAnios();
        actualizarDashboard();

    } else {
        mensajeLogin.innerText = "Usuario o contraseña incorrectos";
    }

}); 


// ===============================
// CARGAR DATOS DEL USUARIO
// ===============================
function cargarDatosUsuario() {

    // Cargar historial de ahorros del usuario
    const historialGuardado = localStorage.getItem("ahorros_" + usuarioActual);
    if (historialGuardado) {
        historialAhorro = JSON.parse(historialGuardado);
    } else {
        historialAhorro = [];
    }

    // Cargar historial general del usuario
    const historialGeneralGuardado = localStorage.getItem("historialGeneral_" + usuarioActual);
    if (historialGeneralGuardado) {
        historialGeneral = JSON.parse(historialGeneralGuardado);
    } else {
        historialGeneral = [];
    }

    const datosGuardados = localStorage.getItem("datos_" + usuarioActual);
    if (datosGuardados) {
        const datos = JSON.parse(datosGuardados);
        totalAhorro = datos.totalAhorro || 0;
        meta = datos.meta || 1000000;
    } else {
        totalAhorro = 0;
        salario = 0;
        totalEscolar = 0;
    }
}


// ===============================
// MOSTRAR SECCIONES
// ===============================
function mostrarSeccion(id) {

    const secciones = document.querySelectorAll(".seccion");

    secciones.forEach(sec => {
        sec.style.opacity = "0";
        sec.style.display = "none";
    });

    const seccionActiva = document.getElementById(id);

    seccionActiva.style.display = "block";

    setTimeout(() => {
        seccionActiva.style.opacity = "1";
    }, 50);
}


// ===============================
// ANIMACIÓN PREMIUM DE NÚMEROS
// ===============================
function animarNumero(elemento, valorFinal, duracion = 800) {

    if (elemento.animacionActiva) {
        cancelAnimationFrame(elemento.animacionActiva);
    }

    let valorInicial = parseFloat(
        elemento.innerText.replace(/[₡,]/g, "")
    ) || 0;

    let inicio = null;

    function animar(timestamp) {

        if (!inicio) inicio = timestamp;

        let progreso = timestamp - inicio;
        let porcentaje = Math.min(progreso / duracion, 1);

        let valorActual = valorInicial +
            (valorFinal - valorInicial) * porcentaje;

        elemento.innerText = "₡" + valorActual.toLocaleString("es-CR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        if (porcentaje < 1) {
            elemento.animacionActiva = requestAnimationFrame(animar);
        }
    }

    elemento.animacionActiva = requestAnimationFrame(animar);
}


// ===============================
// ACTUALIZAR DASHBOARD
// ===============================


    // Calcular aguinaldo real desde historial
function actualizarDashboard() {

    // Definir rango automático: 1 de diciembre del año anterior al 30 de noviembre del siguiente
    let hoy = new Date();
    let añoActual = hoy.getFullYear();
    let fechaInicio, fechaFin;

    if (hoy.getMonth() >= 11) { 
        // Si estamos en diciembre (mes 11), el ciclo actual es del 1 dic añoActual al 30 nov añoActual+1
        fechaInicio = new Date(añoActual, 11, 1);
        fechaFin = new Date(añoActual + 1, 10, 30);
    } else {
        // Si estamos de enero a noviembre, el ciclo actual es del 1 dic añoActual-1 al 30 nov añoActual
        fechaInicio = new Date(añoActual - 1, 11, 1);
        fechaFin = new Date(añoActual, 10, 30);
    }

    // Filtrar historial dentro del rango
    let historialFiltrado = historialGeneral.filter(reg => {
        let fechaReg = new Date(reg.fecha);
        return fechaReg >= fechaInicio && fechaReg <= fechaFin;
    });

    // Calcular aguinaldo real
    let totalSalarios = historialFiltrado
        .filter(reg => reg.tipo === "salario")
        .reduce((acc, reg) => acc + reg.monto, 0);

    let aguinaldo = totalSalarios / 12;

    // Calcular salario escolar real
    let salarioEscolar = historialFiltrado
        .filter(reg => reg.tipo === "escolar")
        .reduce((acc, reg) => acc + reg.monto, 0);

    // Animar números en el dashboard
    animarNumero(document.getElementById("aguinaldo"), aguinaldo);
    animarNumero(document.getElementById("salario-escolar"), salarioEscolar);
    animarNumero(document.getElementById("ahorro-total"), totalAhorro);

    // Actualizar barra de progreso
    actualizarProgreso();

    // Guardar datos en localStorage si hay usuario actual
    if (usuarioActual) {
        localStorage.setItem(
            "datos_" + usuarioActual,
            JSON.stringify({ totalAhorro, meta })
        );
    }

    // Crear gráficos
    crearGraficos();

    // Mostrar nombre del usuario en el dashboard
    const spanUsuario = document.getElementById("nombre-usuario");
    if (spanUsuario && usuarioActual) {
        spanUsuario.innerText = " | " + usuarioActual;
    }
}


// ===============================
// AGREGAR AHORRO
// ===============================
function agregarAhorro(monto) {
    totalAhorro += monto;

    historialAhorro.push(totalAhorro);

    actualizarDashboard();
    crearGraficos();
}


// ===============================
// BARRA DE PROGRESO INTELIGENTE
// ===============================
function actualizarProgreso() {

    let porcentaje = (totalAhorro / meta) * 100;
    if (porcentaje > 100) porcentaje = 100;

    const barra = document.getElementById("barra-progreso");
    const texto = document.getElementById("porcentaje-barra");
    const contenedor = document.querySelector(".barra-contenedor");

    barra.style.width = porcentaje + "%";
    texto.innerText = Math.round(porcentaje) + "%";

    barra.classList.remove("rojo", "amarillo", "verde");

    if (porcentaje < 30) {
        barra.classList.add("rojo");
    } else if (porcentaje < 70) {
        barra.classList.add("amarillo");
    } else {
        barra.classList.add("verde");
    }

    const anchoContenedor = contenedor.offsetWidth;
    const anchoBarra = barra.offsetWidth;
    const centro = anchoContenedor / 2;

    texto.classList.remove("porcentaje-blanco");

    if (anchoBarra >= centro) {
        texto.classList.add("porcentaje-blanco");
    }
}


// ===============================
// MODO OSCURO
// ===============================
function toggleDarkMode() {

    document.body.classList.toggle("dark");

    if (document.body.classList.contains("dark")) {
        localStorage.setItem("darkMode", "activo");
    } else {
        localStorage.setItem("darkMode", "inactivo");
    }
}
// ===============================
// CERRAR SESIÓN
// ===============================
function cerrarSesion() {

    localStorage.removeItem("sesionActiva");

    usuarioActual = null;

    document.getElementById("app-container").style.display = "none";
    document.getElementById("login-section").style.display = "block";
}

// ===============================
// CARGAR AL INICIAR
// ===============================
window.onload = function() {

    const modoGuardado = localStorage.getItem("darkMode");
    const sesionGuardada = localStorage.getItem("sesionActiva");

    if (modoGuardado === "activo") {
        document.body.classList.add("dark");
    }

    if (sesionGuardada) {

        usuarioActual = sesionGuardada;

        document.getElementById("login-section").style.display = "none";
        document.getElementById("app-container").style.display = "block";

        activarMenu()

        cargarDatosUsuario();
        mostrarSeccion("dashboard");
        actualizarDashboard();

        renderizarHistorial();
        renderizarTablaAhorros();
        // Cargar meta guardada
        cargarMetaGuardada();

    }
   iniciarReloj();
};
function crearGraficos() {
    const modoOscuro = document.body.classList.contains("dark");
    const ctxMeta = document.getElementById("graficoProgreso");
    const ctxAguinaldo = document.getElementById("graficoAguinaldo");
    const ctxEscolar = document.getElementById("graficoSalarioEscolar");
    const colorTexto = modoOscuro ? "#ffffff" : "#111827";
    const colorFondo = modoOscuro ? "#1e293b" : "#ffffff";

    if (!ctxMeta || !ctxAguinaldo || !ctxEscolar) return;

    let totalSalarios = historialGeneral
    .filter(reg => reg.tipo === "salario")
    .reduce((acc, reg) => acc + reg.monto, 0);

let aguinaldo = totalSalarios / 12;

let salarioEscolar = historialGeneral
    .filter(reg => reg.tipo === "escolar")
    .reduce((acc, reg) => acc + reg.monto, 0);

    if (graficoProgreso) graficoProgreso.destroy();
    if (graficoAguinaldo) graficoAguinaldo.destroy();
    if (graficoSalarioEscolar) graficoSalarioEscolar.destroy();

    graficoProgreso = new Chart(ctxMeta, {
        type: "doughnut",
        data: {
            datasets: [{
                data: [totalAhorro, Math.max(meta - totalAhorro, 0)],
                backgroundColor: ["#10b981", "#0650e4"],
                borderWidth: 0
            }]
        },
        options: {
            cutout: "65%",
            plugins: { legend: { display: false } }
        }
    });

    graficoAguinaldo = new Chart(ctxAguinaldo, {
        type: "doughnut",
        data: {
            datasets: [{
                data: [aguinaldo, 1],
                backgroundColor: ["#10b981", "#0650e4"],
                borderWidth: 0
            }]
        },
        options: {
            cutout: "65%",
            plugins: { legend: { display: false } }
        }
    });

    graficoSalarioEscolar = new Chart(ctxEscolar, {
        type: "doughnut",
        data: {
            datasets: [{
                data: [salarioEscolar, 1],
                backgroundColor: ["#10b981", "#0650e4"],
                borderWidth: 0
            }]
        },
        options: {
            cutout: "65%",
            plugins: { legend: { display: false } }
        }
    });
}

function establecerMeta() {
    const input = document.getElementById("monto-objetivo"); // ahora solo lee el input de la sección Metas
    if (!input) return alert("⚠️ No se encontró el input de meta");

    const nuevaMeta = Number(input.value);

    if (isNaN(nuevaMeta) || nuevaMeta <= 0) {
        alert("Ingresa un monto válido (mayor que 0)");
        return;
    }

    meta = nuevaMeta;

    // Guardar en localStorage
    if (usuarioActual) {
        localStorage.setItem(
            "datos_" + usuarioActual,
            JSON.stringify({ totalAhorro, meta })
        );
    }

    // Actualizar dashboard y barra de progreso
   actualizarDashboard();
actualizarProgresoMeta(); // ahora sí actualiza los spans
alert("✅ Meta guardada: ₡" + meta.toLocaleString("es-CR"));
}



function renderizarHistorial() {

    const tabla = document.getElementById("tabla-historial");
    tabla.innerHTML = "";

    historialGeneral.forEach((registro, index) => {

        const fila = `
            <tr>
                <td>${registro.fecha}</td>
                <td>${registro.tipo}</td>
                <td>${registro.descripcion}</td>
                <td>₡${registro.monto.toLocaleString("es-CR")}</td>
                <td>
                    <button onclick="eliminarRegistro(${index})">Eliminar</button>
                </td>
            </tr>
        `;

        tabla.innerHTML += fila;
    });
}

function renderizarTablaAhorros() {

    const tabla = document.getElementById("tabla-ahorros");
    tabla.innerHTML = "";

    historialAhorro.forEach((movimiento) => {

        const fila = `
            <tr>
                <td>${movimiento.fecha}</td>
                <td>${movimiento.tipo}</td>
                <td>₡${movimiento.monto.toLocaleString("es-CR")}</td>
                <td>${movimiento.descripcion}</td>
            </tr>
        `;

        tabla.innerHTML += fila;
    });
}

// ================= MENU MOVIL SIMPLE =================


// ===============================
// MENU HAMBURGUESA SEGURO
// ===============================
function activarMenu() {

    const menuToggle = document.getElementById("menu-toggle");
    const nav = document.querySelector("nav");

    if (menuToggle && nav) {
        menuToggle.addEventListener("click", function() {
            nav.classList.toggle("activo");
        });
    }
}
function iniciarReloj() {

    function actualizarFechaHora() {

        const ahora = new Date();

        const opcionesFecha = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric"
        };

        const fecha = ahora.toLocaleDateString("es-CR", opcionesFecha);

        const horas = ahora.getHours().toString().padStart(2, "0");
        const minutos = ahora.getMinutes().toString().padStart(2, "0");
        const segundos = ahora.getSeconds().toString().padStart(2, "0");

        const hora = `${horas}:${minutos}:${segundos}`;

        const reloj = document.getElementById("reloj");

        if (reloj) {
            reloj.innerHTML = `
                <div class="fecha">${fecha}</div>
                <div class="hora">${hora}</div>
            `;
        }
    }

    actualizarFechaHora();
    setInterval(actualizarFechaHora, 1000);
}



// GUARDAR SALARIO
// ===============================
// ===============================
// GUARDAR SALARIO (VERSIÓN CORREGIDA)
// ===============================
const formSalario = document.getElementById("form-salario");

formSalario.addEventListener("submit", function(e) {
    e.preventDefault();

    // 1. Capturamos los montos
    const salarioNeto = parseFloat(document.getElementById("salario-neto").value) || 0;
    const salarioBruto = parseFloat(document.getElementById("salario-bruto").value) || 0;
    const deduccionEscolar = parseFloat(document.getElementById("deduccion-escolar").value) || 0;

    // 2. Capturamos Mes y Año de los SELECTORES (Asegúrate que los IDs coincidan con tu HTML)
    const mesElement = document.getElementById("mes-salario");
    const anioElement = document.getElementById("anio-salario");

    if (!mesElement || !anioElement) {
        console.error("Error: No se encontraron los selectores de mes o año en el HTML.");
        return;
    }

    const mes = mesElement.value;
    const anio = anioElement.value;

    if (salarioNeto <= 0) {
        alert("Ingrese un salario neto válido");
        return;
    }

    // 3. AGREGAR AL HISTORIAL
    historialGeneral.push({
        fecha: new Date().toISOString().split("T")[0],
        tipo: "salario",
        descripcion: "Salario " + mes + " " + anio + " | Bruto: ₡" + salarioBruto.toLocaleString("es-CR"),
        monto: salarioBruto
    });

    if (deduccionEscolar > 0) {
        historialGeneral.push({
            fecha: new Date().toISOString().split("T")[0],
            tipo: "escolar",
            descripcion: "Deducción salario escolar - " + mes + " " + anio,
            monto: deduccionEscolar
        });
    }

    // 4. GUARDAR EN LOCALSTORAGE
    localStorage.setItem("historialGeneral_" + usuarioActual, JSON.stringify(historialGeneral));

    // 5. LIMPIAR CAMPOS
    document.getElementById("salario-neto").value = "";
    document.getElementById("salario-bruto").value = "";
    document.getElementById("deduccion-escolar").value = "";
    document.getElementById("mes-salario").value = "Enero";
    document.getElementById("anio-salario").value = new Date().getFullYear();

    // 6. ACTUALIZAR INTERFAZ
    actualizarDashboard();
    renderizarHistorial();

    // 7. MENSAJE DE ÉXITO (Confirmación)
    alert("✅ Salario guardado correctamente");
});


const formAhorro = document.getElementById("form-ahorro");

formAhorro.addEventListener("submit", function(e) {

    e.preventDefault();

    const fecha = document.getElementById("fecha-ahorro").value;
    const tipo = document.getElementById("tipo-ahorro").value;
    const monto = parseFloat(document.getElementById("monto-ahorro").value) || 0;
    const descripcion = document.getElementById("descripcion-ahorro").value;

    if (!fecha || monto <= 0) {
        alert("Ingrese datos válidos");
        return;
    }

    let montoFinal = tipo === "retiro" ? -monto : monto;

    totalAhorro += montoFinal;

    const nuevoMovimiento = {
        fecha: fecha,
        tipo: tipo,
        monto: montoFinal,
        descripcion: descripcion
    };

    // Guardar en historial de ahorros
    historialAhorro.push(nuevoMovimiento);

    localStorage.setItem(
        "ahorros_" + usuarioActual,
        JSON.stringify(historialAhorro)
    );

    // Guardar también en historial general
    historialGeneral.push({
        fecha: fecha,
        tipo: "ahorro",
        descripcion: descripcion,
        monto: montoFinal
    });

    localStorage.setItem("historialGeneral_" + usuarioActual,JSON.stringify(historialGeneral)
    );

    actualizarDashboard();
    renderizarTablaAhorros();
    renderizarHistorial();

    alert("Movimiento guardado correctamente");

    formAhorro.reset();
});

// ===============================
const formMeta = document.getElementById("form-meta");

formMeta.addEventListener("submit", function(e) {
    e.preventDefault(); // ❌ Evita que se recargue la página
    establecerMeta();   // Llama a tu función que guarda la meta
});


function actualizarProgresoMeta() {
    // Asegurarnos de que haya spans
    const montoActualElem = document.getElementById("monto-actual-meta");
    const porcentajeMetaElem = document.getElementById("porcentaje-meta");
    const porcentajeTiempoElem = document.getElementById("porcentaje-tiempo");

    if (!montoActualElem || !porcentajeMetaElem || !porcentajeTiempoElem) return;

    // Monto actual = total de ahorros
    montoActualElem.innerText = totalAhorro.toLocaleString("es-CR");

    // Porcentaje logrado
    let porcentajeLogrado = (totalAhorro / meta) * 100;
    if (porcentajeLogrado > 100) porcentajeLogrado = 100;
    porcentajeMetaElem.innerText = Math.round(porcentajeLogrado) + "%";

    // Porcentaje de tiempo transcurrido
    // Para esto necesitamos la fecha de inicio de la meta
    const fechaInicioInput = document.getElementById("fecha-inicio-meta");
    if (fechaInicioInput && fechaInicioInput.value) {
        const inicio = new Date(fechaInicioInput.value);
        const ahora = new Date();
        const mesesPlazo = parseInt(document.getElementById("plazo-meses").value) || 1;

        const fin = new Date(inicio);
        fin.setMonth(fin.getMonth() + mesesPlazo);

        let porcentajeTiempo = ((ahora - inicio) / (fin - inicio)) * 100;
        if (porcentajeTiempo > 100) porcentajeTiempo = 100;
        if (porcentajeTiempo < 0) porcentajeTiempo = 0;

        porcentajeTiempoElem.innerText = Math.round(porcentajeTiempo) + "%";
    } else {
        porcentajeTiempoElem.innerText = "0%";
    }
}


function cargarMetaGuardada() {
    if (!usuarioActual) return;

    const datos = JSON.parse(localStorage.getItem("datos_" + usuarioActual));
    if (datos) {
        meta = datos.meta || 1000000;
        totalAhorro = datos.totalAhorro || 0;

        // Si quieres que los inputs muestren la meta guardada:
        const inputMonto = document.getElementById("monto-objetivo");
        if (inputMonto) inputMonto.value = meta;

        // Llamar a la función que actualiza los spans
        actualizarProgresoMeta();
    }
}


document.getElementById("btn-exportar-pdf").addEventListener("click", function() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Configuración de título
    doc.setFontSize(18);
    doc.text("Reporte Financiero Personal", 14, 20);
    
    doc.setFontSize(11);
    doc.text(`Usuario: ${usuarioActual}`, 14, 30);
    doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 37);

    // Obtener los datos de la tabla de historial
    // Usamos historialGeneral que es tu variable global
    const filas = historialGeneral.map(item => [
        item.fecha,
        item.tipo.toUpperCase(),
        item.descripcion,
        `+${item.monto || 0}` // Ajusta según cómo guardes los montos
    ]);

    // Generar la tabla en el PDF
    doc.autoTable({
        startY: 45,
        head: [['Fecha', 'Tipo', 'Descripción', 'Monto']],
        body: filas,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] }, // Un azul profesional
    });

    // Guardar el archivo
    doc.save(`Reporte_Financiero_${usuarioActual}.pdf`);
});



function generarAnios() {
    const selector = document.getElementById("anio-salario");
    const anioActual = new Date().getFullYear(); // Esto detecta que estamos en 2025

    // Vamos a crear el año actual, 2 años al futuro y 5 al pasado
    for (let i = anioActual + 2; i >= anioActual - 5; i--) {
        let opcion = document.createElement("option");
        opcion.value = i;
        opcion.text = i;
        
        // Que aparezca seleccionado el año en el que estamos hoy
        if (i === anioActual) {
            opcion.selected = true;
        }
        
        selector.appendChild(opcion);
    }
}

// IMPORTANTE: Tienes que llamar a la función para que se ejecute.
// Busca en tu app.js la función que se ejecuta al iniciar sesión y pega esto:
generarAnios();