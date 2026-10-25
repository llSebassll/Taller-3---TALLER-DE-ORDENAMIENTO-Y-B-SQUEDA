const fs = require("node:fs");
const { Chart, registerables } = require('chart.js');
Chart.register(...registerables);
const { createCanvas } = require('canvas');

const TAMANOS = [1_000, 10_000, 100_000, 1_000_000];
const REPETICIONES = 5;
const CARPETA_DATOS = "datos";
const CARPETA_RESULTADOS = "resultados";
fs.mkdirSync(CARPETA_DATOS, { recursive: true });
fs.mkdirSync(CARPETA_RESULTADOS, { recursive: true });

const ALGORITMOS = [
    {
        "nombre": "LINEAL",
        "ejecutar": require("./BusquedaLineal").probar
    },
    {
        "nombre": "BINARIA",
        "ejecutar": require("./BusquedaBinaria").probar
    },
    {
        "nombre": "TERNARIA",
        "ejecutar": require("./BusquedaTernaria").probar
    },
    {
        "nombre": "SALTOS",
        "ejecutar": require("./BusquedaSaltos").probar
    },
    {
        "nombre": "INTERPOLACION",
        "ejecutar": require("./BusquedaInterpolacion").probar
    },
    {
        "nombre": "EXPONENCIAL",
        "ejecutar": require("./BusquedaExponencial").probar
    }
];

const COLORES = ["#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4", "#42d4f4"];

// Resultados en memoria para graficar
const RESULTADOS = [];

function crearResultado(algoritmo, n, promedioPorBusqueda) {
    return {
        algoritmo,
        n,
        promedioPorBusqueda: Math.max(0.001, promedioPorBusqueda) // Evitar 0 exacto para la escala logarítmica
    };
}

console.log("Cargando arreglos ordenados...");
const arreglosAscendentes = [];

// 1. Cargar arreglos ascendentes generados por ordenamiento-main.js
for (let n of TAMANOS) {
    const archivo = CARPETA_DATOS + "/" + n + "-ascendente.txt";
    if (!fs.existsSync(archivo)) {
        console.log("ERROR: No se encontró " + archivo + ". Ejecuta ordenamiento-main.js primero.");
        process.exit(1);
    }
    const arreglo = String(fs.readFileSync(archivo))
        .split("\n")
        .filter(t => t.trim().length > 0)
        .slice(0, n)
        .map(t => parseInt(t));
    arreglosAscendentes.push(arreglo);
}

// 2. Generar o cargar 1000 claves (500 presentes, 500 ausentes)
const archivoClaves = CARPETA_DATOS + "/claves-busqueda.txt";
let claves = [];
if (!fs.existsSync(archivoClaves)) {
    console.log("Generando archivo de 1000 claves...");
    const arrBase = arreglosAscendentes[3]; // Usamos el arreglo de 1.000.000
    for (let i = 0; i < 500; i++) claves.push(arrBase[Math.floor(Math.random() * arrBase.length)]);
    for (let i = 0; i < 500; i++) claves.push(Math.floor(Math.random() * 9_000_000) + 1_000_000); // 7 dígitos
    mezclar(claves);
    fs.writeFileSync(archivoClaves, claves.join("\n") + "\n");
} else {
    claves = String(fs.readFileSync(archivoClaves))
        .split("\n")
        .filter(t => t.trim().length > 0)
        .map(t => parseInt(t));
}

// 3. Evaluar rendimiento general (Conjunto de 1000 claves)
const csv = ["Algoritmo,Lenguaje,N,T1(ns),T2(ns),T3(ns),T4(ns),T5(ns),PromedioTotal(ns),PromedioPorBusqueda(ns),Desviacion(ns)"];

console.log("\n--- EVALUACIÓN GENERAL DE BÚSQUEDA ---");
for (let algoritmo of ALGORITMOS) {
    for (let i = 0; i < TAMANOS.length; i++) {
        const n = TAMANOS[i];
        const arr = arreglosAscendentes[i];
        const tiempos = new Array(REPETICIONES);

        // Calentamiento
        ejecutarLote(algoritmo, arr, claves);

        for (let rep = 0; rep < REPETICIONES; rep++) {
            limpiarMemoria();
            const inicio = process.hrtime.bigint();
            ejecutarLote(algoritmo, arr, claves);
            const fin = process.hrtime.bigint();
            tiempos[rep] = Number(fin - inicio);
        }

        let promedioTotal = 0;
        for (let t of tiempos) promedioTotal += t;
        promedioTotal /= REPETICIONES;

        let varianza = 0;
        for (let t of tiempos) varianza += Math.pow(t - promedioTotal, 2);
        const desviacion = Math.sqrt(varianza / REPETICIONES);
        const promedioPorBusqueda = promedioTotal / claves.length;

        RESULTADOS.push(crearResultado(algoritmo.nombre, n, promedioPorBusqueda));

        csv.push([algoritmo.nombre, "JavaScript", n, ...tiempos, promedioTotal.toFixed(2), promedioPorBusqueda.toFixed(2), desviacion.toFixed(2)].join(","));
        console.log(algoritmo.nombre + " (N=" + n + ") -> " + promedioPorBusqueda.toFixed(2) + " ns/busqueda");
    }
}
fs.writeFileSync(CARPETA_RESULTADOS + "/resultados_busqueda.csv", csv.join("\n") + "\n");

// 4. Evaluar Posición de la Clave (N = 1.000.000)
console.log("\n--- ANÁLISIS DE POSICIÓN DE LA CLAVE (N = 1.000.000) ---");
const arrMillon = arreglosAscendentes[3];
const claveInicio = arrMillon[0];
const claveCentro = arrMillon[Math.floor(arrMillon.length / 2)];
const claveFinal = arrMillon[arrMillon.length - 1];

console.log(["Algoritmo", "Inicio (ns)", "Centro (ns)", "Final (ns)"].map(t => t.padEnd(15)).join(" | "));
console.log("-----------------------------------------------------------------------");
for (let algoritmo of ALGORITMOS) {
    const tInicio = medirPosicion(algoritmo, arrMillon, claveInicio);
    const tCentro = medirPosicion(algoritmo, arrMillon, claveCentro);
    const tFinal = medirPosicion(algoritmo, arrMillon, claveFinal);
    console.log([algoritmo.nombre, tInicio.toFixed(2), tCentro.toFixed(2), tFinal.toFixed(2)].map(t => t.padEnd(15)).join(" | "));
}

// 5. Generar Gráfica de Crecimiento
console.log("\nGenerando gráfica de crecimiento...");
generarGraficaCrecimiento();

function ejecutarLote(algoritmo, arr, claves) {
    for (let c of claves) algoritmo.ejecutar(arr, c);
}

function medirPosicion(algoritmo, arr, clave) {
    for (let i = 0; i < 100; i++) algoritmo.ejecutar(arr, clave); // Calentamiento
    limpiarMemoria();
    const inicio = process.hrtime.bigint();
    for (let i = 0; i < 1000; i++) algoritmo.ejecutar(arr, clave);
    const fin = process.hrtime.bigint();
    return Number(fin - inicio) / 1000; // Promedio por búsqueda
}

function generarGraficaCrecimiento() {
    try {
        const series = ALGORITMOS.map((algoritmo, i) => ({
            label: algoritmo.nombre,
            data: RESULTADOS
                .filter(r => r.algoritmo === algoritmo.nombre)
                .map(r => ({ x: r.n, y: r.promedioPorBusqueda })),
            borderColor: COLORES[i % COLORES.length],
            backgroundColor: COLORES[i % COLORES.length]
        }));

        const width = 1000;
        const height = 700;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');
        const backgroundPlugin = {
            id: 'customCanvasBackgroundColor',
            beforeDraw: (chart) => {
                const ctx = chart.ctx;
                ctx.save();
                ctx.globalCompositeOperation = 'destination-over';
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, chart.width, chart.height);
                ctx.restore();
            }
        };

        const chart = new Chart(ctx, {
            type: 'line',
            data: { datasets: series },
            options: {
                responsive: false,
                animation: false,
                plugins: {
                    title: { display: true, text: 'Crecimiento Búsqueda (JavaScript)' }
                },
                scales: {
                    x: { type: 'logarithmic', title: { display: true, text: 'Tamaño del Arreglo (N) - Log' } },
                    y: { type: 'logarithmic', title: { display: true, text: 'Tiempo Promedio (ns) - Log' } }
                }
            },
            plugins: [backgroundPlugin]
        });

        fs.writeFileSync(CARPETA_RESULTADOS + "/grafica_3_busqueda_crecimiento.png", canvas.toBuffer('image/png'));
        chart.destroy();
        console.log("Gráfico generado: " + CARPETA_RESULTADOS + "/grafica_3_busqueda_crecimiento.png");
    } catch (e) {
        console.error("Error generando gráfica: " + e.message);
    }
}

// Fisher-Yates, equivalente a Collections.shuffle
function mezclar(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

// Solo funciona si node se ejecuta con --expose-gc
function limpiarMemoria() {
    if (typeof global.gc === "function") {
        global.gc();
    }
}
