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
        "nombre": "InsertionSort",
        "ejecutar": require("./InsertionSort").probar
    },
    {
        "nombre": "DualPivotQuicksort",
        "ejecutar": require("./DualPivotQuickSort").probar
    },
    {
        "nombre": "MergeSort",
        "ejecutar": require("./MergeSort").probar
    },
    {
        "nombre": "HeapSort",
        "ejecutar": require("./HeapSort").probar
    },
    {
        "nombre": "RadixSort",
        "ejecutar": require("./RadixSort").probar
    },
    {
        "nombre": "BucketSort",
        "ejecutar": require("./BucketSort").probar
    }
];

const COLORES = ["#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4", "#42d4f4"];

const fondoBlancoPlugin = {
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

// Dibuja el valor (entero) encima de cada barra
const etiquetasBarrasPlugin = {
    id: 'etiquetasBarras',
    afterDatasetsDraw: (chart) => {
        const ctx = chart.ctx;
        ctx.save();
        ctx.fillStyle = 'black';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        chart.data.datasets.forEach((dataset, i) => {
            chart.getDatasetMeta(i).data.forEach((barra, j) => {
                const valor = dataset.data[j];
                if (typeof valor === "number") {
                    ctx.fillText(Math.round(valor).toLocaleString("es"), barra.x, barra.y - 4);
                }
            });
        });
        ctx.restore();
    }
};

// Resultados en memoria para poder graficarlos
const RESULTADOS = [];

function crearResultado(algoritmo, variante, n, promedio, estimado) {
    return {
        algoritmo,
        variante,
        n,
        promedio: Math.max(1, promedio), // Evitar 0 para la escala logarítmica
        estimado
    };
}

const csv = ["Algoritmo,Lenguaje,Variante,N,T1(ns),T2(ns),T3(ns),T4(ns),T5(ns),Promedio(ns),DesviacionEstandar(ns),Estado"];

for (let n of TAMANOS) {
    console.log("\n=== PROCESANDO TAMAÑO: " + n + " ===");

    const nombreArchivo = CARPETA_DATOS + "/" + n + "-numeros.txt";
    if (!fs.existsSync(nombreArchivo)) {
        console.log("Generando archivo faltante: " + nombreArchivo);
        generarArchivoAleatorio(nombreArchivo, n);
    }

    const arrAleatorio = cargarArreglo(nombreArchivo, n);

    const arrAscendente = [...arrAleatorio].sort((a, b) => a - b);
    guardarArreglo(CARPETA_DATOS + "/" + n + "-ascendente.txt", arrAscendente);

    const arrDescendente = [...arrAscendente].reverse();
    guardarArreglo(CARPETA_DATOS + "/" + n + "-descendente.txt", arrDescendente);

    for (let algoritmo of ALGORITMOS) {
        if (algoritmo.nombre === "InsertionSort" && n >= 100_000) {
            registrarEstimado(algoritmo.nombre, n);
            continue;
        }

        console.log("Evaluando: " + algoritmo.nombre);
        evaluar(algoritmo, arrAleatorio, "Aleatorio", n);
        evaluar(algoritmo, arrAscendente, "Ascendente", n);
        evaluar(algoritmo, arrDescendente, "Descendente", n);
    }
}

fs.writeFileSync(CARPETA_RESULTADOS + "/resultados_ordenamiento.csv", csv.join("\n") + "\n");
console.log("\nGenerando gráficas PNG...");
generarGraficas();
console.log("¡Pruebas y gráficas finalizadas con éxito!");

function evaluar(algoritmo, original, variante, n) {
    const tiempos = new Array(REPETICIONES);

    try {
        // Calentamiento
        algoritmo.ejecutar([...original]);

        for (let i = 0; i < REPETICIONES; i++) {
            const copia = [...original];
            limpiarMemoria();

            const inicio = process.hrtime.bigint();
            algoritmo.ejecutar(copia);
            const fin = process.hrtime.bigint();

            tiempos[i] = Number(fin - inicio);

            if (!verificarOrden(copia)) {
                console.log("ERROR FATAL: " + algoritmo.nombre + " no ordenó correctamente.");
            }
        }

        let promedio = 0;
        for (let t of tiempos) promedio += t;
        promedio /= REPETICIONES;

        let varianza = 0;
        for (let t of tiempos) varianza += Math.pow(t - promedio, 2);
        const desviacion = Math.sqrt(varianza / REPETICIONES);

        csv.push([algoritmo.nombre, "JavaScript", variante, n, ...tiempos, promedio.toFixed(2), desviacion.toFixed(2), "Medido"].join(","));

        // Guardar en memoria para las gráficas
        RESULTADOS.push(crearResultado(algoritmo.nombre, variante, n, promedio, false));

    } catch (e) {
        if (!(e instanceof RangeError)) {
            throw e;
        }
        console.log("¡Desbordamiento de pila (RangeError) detectado en " + algoritmo.nombre + " con variante " + variante + "!");
        csv.push([algoritmo.nombre, "JavaScript", variante, n, 0, 0, 0, 0, 0, "0.0", "0.0", "Fallo_StackOverflow"].join(","));
        limpiarMemoria();
    }
}

function registrarEstimado(algoritmo, n) {
    // Para graficar el estimado, multiplicamos el último tiempo conocido por 100
    let tiempoEstimado = 1000000000.0; // Valor base por defecto
    for (let r of RESULTADOS) {
        if (r.algoritmo === algoritmo && r.n === n / 10) {
            tiempoEstimado = r.promedio * 100; // O(n^2) aumenta x100 cuando N aumenta x10
        }
    }

    csv.push([algoritmo, "JavaScript", "Aleatorio", n, 0, 0, 0, 0, 0, tiempoEstimado.toFixed(2), "0.0", "Estimado"].join(","));
    RESULTADOS.push(crearResultado(algoritmo, "Aleatorio", n, tiempoEstimado, true));
    console.log("Omitiendo " + algoritmo + " para N=" + n + " (Se requiere estimación teórica)");
}

function generarGraficas() {
    try {
        // 1. Gráfica de Crecimiento (Aleatorio, Escala Logarítmica en ambos ejes)
        const series = ALGORITMOS
            .map((algoritmo, i) => ({
                label: algoritmo.nombre,
                data: RESULTADOS
                    .filter(r => r.algoritmo === algoritmo.nombre && r.variante === "Aleatorio")
                    .map(r => ({ x: r.n, y: r.promedio })),
                borderColor: COLORES[i % COLORES.length],
                backgroundColor: COLORES[i % COLORES.length]
            }))
            .filter(serie => serie.data.length > 0);

        guardarGrafica(CARPETA_RESULTADOS + "/grafica_1_crecimiento_js.png", 1000, 700, {
            type: 'line',
            data: { datasets: series },
            options: {
                plugins: {
                    title: { display: true, text: 'Crecimiento - Arreglo Aleatorio (JavaScript)' }
                },
                scales: {
                    x: { type: 'logarithmic', title: { display: true, text: 'Tamaño del Arreglo (N) - Log' } },
                    y: { type: 'logarithmic', title: { display: true, text: 'Tiempo (ns) - Log' } }
                }
            }
        });

        // 2. Gráficas de Barras por Tamaño (Efecto del orden de entrada)
        const tamanosBarras = [1000, 10000, 100000];
        const variantes = ["Aleatorio", "Ascendente", "Descendente"];
        for (let size of tamanosBarras) {
            const nombres = ALGORITMOS
                .map(algoritmo => algoritmo.nombre)
                .filter(nombre => RESULTADOS.some(r => r.n === size && r.algoritmo === nombre));

            const datasets = variantes.map((variante, i) => ({
                label: variante,
                data: nombres.map(nombre => {
                    const r = RESULTADOS.find(r => r.n === size && r.algoritmo === nombre && r.variante === variante);
                    return r ? r.promedio : null;
                }),
                backgroundColor: COLORES[i % COLORES.length]
            }));

            guardarGrafica(CARPETA_RESULTADOS + "/grafica_2_orden_" + size + ".png", 1200, 700, {
                type: 'bar',
                data: { labels: nombres, datasets },
                options: {
                    plugins: {
                        title: { display: true, text: 'Efecto del Orden de Entrada - N=' + size + ' (JavaScript)' }
                    },
                    scales: {
                        x: { title: { display: true, text: 'Algoritmo' } },
                        y: { type: 'logarithmic', title: { display: true, text: 'Tiempo (ns) - Log' } }
                    }
                }
            }, [etiquetasBarrasPlugin]);
        }
    } catch (e) {
        console.error("Error guardando las gráficas: " + e.message);
        console.error(e);
    }
}

function guardarGrafica(graficaNombre, width, height, configuracion, plugins = []) {
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    configuracion.options.responsive = false;
    configuracion.options.animation = false;
    configuracion.plugins = [fondoBlancoPlugin, ...plugins];

    const chart = new Chart(ctx, configuracion);

    // Guardar como imagen
    fs.writeFileSync(graficaNombre, canvas.toBuffer('image/png'));
    chart.destroy();

    console.log('Gráfico generado: ' + graficaNombre);
}

function verificarOrden(arr) {
    for (let i = 0; i < arr.length - 1; i++) {
        if (arr[i] > arr[i + 1]) return false;
    }
    return true;
}

// Solo funciona si node se ejecuta con --expose-gc
function limpiarMemoria() {
    if (typeof global.gc === "function") {
        global.gc();
    }
}

function cargarArreglo(nombreArchivo, n) {
    return String(fs.readFileSync(nombreArchivo))
        .split("\n")
        .filter(t => t.trim().length > 0)
        .slice(0, n)
        .map(t => parseInt(t));
}

function guardarArreglo(nombreArchivo, arr) {
    if (!fs.existsSync(nombreArchivo)) {
        fs.writeFileSync(nombreArchivo, arr.join("\n") + "\n");
    }
}

function generarArchivoAleatorio(nombreArchivo, n) {
    const lineas = [];
    for (let i = 0; i < n; i++) {
        lineas.push(Math.floor(Math.random() * 90_000_000) + 10_000_000);
    }
    fs.writeFileSync(nombreArchivo, lineas.join("\n") + "\n");
}
