package orden;

import org.jfree.chart.ChartFactory;
import org.jfree.chart.ChartUtils;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.axis.LogarithmicAxis;
import org.jfree.chart.labels.StandardCategoryItemLabelGenerator;
import org.jfree.chart.plot.CategoryPlot;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.chart.plot.XYPlot;
import org.jfree.chart.renderer.category.BarRenderer;
import org.jfree.data.category.DefaultCategoryDataset;
import org.jfree.data.xy.XYSeries;
import org.jfree.data.xy.XYSeriesCollection;

import java.io.*;
import java.nio.file.Files;
import java.text.NumberFormat;
import java.util.*;

public class OrdenamientoMain {

    private static final int[] TAMANOS = {1_000, 10_000, 100_000, 1_000_000};
    private static final int REPETICIONES = 5;
    private static final String CARPETA_DATOS = "datos";
    private static final String CARPETA_RESULTADOS = "resultados";
    private static final String[] ALGORITMOS = {
            "InsertionSort", "DualPivotQuicksort", "MergeSort", "HeapSort", "RadixSort", "BucketSort"
    };

    // Clase interna para almacenar los resultados en memoria y poder graficarlos
    static class Resultado {
        String algoritmo;
        String variante;
        int n;
        double promedio;
        boolean estimado;

        public Resultado(String algoritmo, String variante, int n, double promedio, boolean estimado) {
            this.algoritmo = algoritmo;
            this.variante = variante;
            this.n = n;
            this.promedio = Math.max(1, promedio); // Evitar 0 para la escala logarítmica
            this.estimado = estimado;
        }
    }

    private static List<Resultado> listaResultados = new ArrayList<>();

    public static void main(String[] args) throws IOException {
        new File(CARPETA_DATOS).mkdirs();
        new File(CARPETA_RESULTADOS).mkdirs();

        BufferedWriter csvWriter = new BufferedWriter(new FileWriter(new File(CARPETA_RESULTADOS, "resultados_ordenamiento.csv")));
        csvWriter.write("Algoritmo,Lenguaje,Variante,N,T1(ns),T2(ns),T3(ns),T4(ns),T5(ns),Promedio(ns),DesviacionEstandar(ns),Estado\n");

        for (int n : TAMANOS) {
            System.out.println("\n=== PROCESANDO TAMAÑO: " + n + " ===");

            String nombreArchivo = n + "-numeros.txt";
            File archivoOriginal = new File(CARPETA_DATOS, nombreArchivo);

            if (!archivoOriginal.exists()) {
                System.out.println("Generando archivo faltante: " + nombreArchivo);
                generarArchivoAleatorio(archivoOriginal, n);
            }

            int[] arrAleatorio = cargarArreglo(nombreArchivo, n);

            int[] arrAscendente = arrAleatorio.clone();
            Arrays.sort(arrAscendente);
            guardarArreglo(n + "-ascendente.txt", arrAscendente);

            int[] arrDescendente = new int[n];
            for (int i = 0; i < n; i++) {
                arrDescendente[i] = arrAscendente[n - 1 - i];
            }
            guardarArreglo(n + "-descendente.txt", arrDescendente);

            for (String algoritmo : ALGORITMOS) {
                if (algoritmo.equals("InsertionSort") && n >= 100_000) {
                    registrarEstimado(csvWriter, algoritmo, n);
                    continue;
                }

                System.out.println("Evaluando: " + algoritmo);
                evaluar(csvWriter, algoritmo, arrAleatorio, "Aleatorio", n);
                evaluar(csvWriter, algoritmo, arrAscendente, "Ascendente", n);
                evaluar(csvWriter, algoritmo, arrDescendente, "Descendente", n);
            }

        }
        csvWriter.close();
        System.out.println("\nGenerando gráficas PNG...");
        generarGraficas();
        System.out.println("¡Pruebas y gráficas finalizadas con éxito!");
    }

    private static void evaluar(BufferedWriter csvWriter, String algoritmo, int[] original, String variante, int n) throws IOException {
        long[] tiempos = new long[REPETICIONES];

        try {
            int[] calentamiento = original.clone();
            ejecutarAlgoritmo(algoritmo, calentamiento);

            for (int i = 0; i < REPETICIONES; i++) {
                int[] copia = original.clone();
                System.gc();

                long inicio = System.nanoTime();
                ejecutarAlgoritmo(algoritmo, copia);
                long fin = System.nanoTime();

                tiempos[i] = fin - inicio;

                if (!verificarOrden(copia)) {
                    System.out.println("ERROR FATAL: " + algoritmo + " no ordenó correctamente.");
                }
            }

            double promedio = 0;
            for (long t : tiempos) promedio += t;
            promedio /= REPETICIONES;

            double varianza = 0;
            for (long t : tiempos) varianza += Math.pow(t - promedio, 2);
            double desviacion = Math.sqrt(varianza / REPETICIONES);

            String linea = String.format(Locale.US, "%s,Java,%s,%d,%d,%d,%d,%d,%d,%.2f,%.2f,Medido\n",
                    algoritmo, variante, n, tiempos[0], tiempos[1], tiempos[2], tiempos[3], tiempos[4], promedio, desviacion);
            csvWriter.write(linea);

            // Guardar en memoria para las gráficas
            listaResultados.add(new Resultado(algoritmo, variante, n, promedio, false));

        } catch (StackOverflowError e) {
            System.out.println("¡Desbordamiento de pila (StackOverflowError) detectado en " + algoritmo + " con variante " + variante + "!");
            String linea = String.format(Locale.US, "%s,Java,%s,%d,0,0,0,0,0,0.0,0.0,Fallo_StackOverflow\n", algoritmo, variante, n);
            csvWriter.write(linea);
            System.gc();
        }
    }

    private static void registrarEstimado(BufferedWriter csvWriter, String algoritmo, int n) throws IOException {
        // Para graficar el estimado, multiplicamos el último tiempo conocido por 100
        double tiempoEstimado = 1000000000.0; // Valor base por defecto
        for (Resultado r : listaResultados) {
            if (r.algoritmo.equals(algoritmo) && r.n == (n / 10)) {
                tiempoEstimado = r.promedio * 100; // O(n^2) aumenta x100 cuando N aumenta x10
            }
        }

        String linea = String.format(Locale.US, "%s,Java,Aleatorio,%d,0,0,0,0,0,%.2f,0.0,Estimado\n", algoritmo, n, tiempoEstimado);
        csvWriter.write(linea);
        listaResultados.add(new Resultado(algoritmo, "Aleatorio", n, tiempoEstimado, true));
        System.out.println("Omitiendo " + algoritmo + " para N=" + n + " (Se requiere estimación teórica)");
    }

    private static void generarGraficas() {
        try {
            // 1. Gráfica de Crecimiento (Aleatorio, Escala Logarítmica en ambos ejes)
            XYSeriesCollection datasetCrecimiento = new XYSeriesCollection();
            for (String alg : ALGORITMOS) {
                XYSeries serie = new XYSeries(alg);
                for (Resultado r : listaResultados) {
                    if (r.algoritmo.equals(alg) && r.variante.equals("Aleatorio")) {
                        serie.add(r.n, r.promedio);
                    }
                }
                if (!serie.isEmpty()) datasetCrecimiento.addSeries(serie);
            }

            JFreeChart lineChart = ChartFactory.createXYLineChart(
                    "Crecimiento - Arreglo Aleatorio (Java)",
                    "Tamaño del Arreglo (N)", "Tiempo (ns)",
                    datasetCrecimiento, PlotOrientation.VERTICAL, true, true, false);

            XYPlot xyPlot = lineChart.getXYPlot();

            // Configuración segura para ejes logarítmicos
            LogarithmicAxis xAxis = new LogarithmicAxis("Tamaño del Arreglo (N) - Log");
            xAxis.setStrictValuesFlag(false);
            xyPlot.setDomainAxis(xAxis);

            LogarithmicAxis yAxisLine = new LogarithmicAxis("Tiempo (ns) - Log");
            yAxisLine.setStrictValuesFlag(false);
            xyPlot.setRangeAxis(yAxisLine);

            ChartUtils.saveChartAsPNG(new File(CARPETA_RESULTADOS, "grafica_1_crecimiento_java.png"), lineChart, 1000, 700);

            // 2. Gráficas de Barras por Tamaño (Efecto del orden de entrada)
            int[] tamanosBarras = {1000, 10000, 100000};
            for (int size : tamanosBarras) {
                DefaultCategoryDataset datasetBarras = new DefaultCategoryDataset();
                for (Resultado r : listaResultados) {
                    if (r.n == size) {
                        datasetBarras.addValue(r.promedio, r.variante, r.algoritmo);
                    }
                }

                JFreeChart barChart = ChartFactory.createBarChart(
                        "Efecto del Orden de Entrada - N=" + size + " (Java)",
                        "Algoritmo", "Tiempo (ns)", datasetBarras);

                CategoryPlot categoryPlot = barChart.getCategoryPlot();

                // SOLUCIÓN AL ERROR DEL LOGARITMO EN GRÁFICOS DE BARRAS
                LogarithmicAxis logAxis = new LogarithmicAxis("Tiempo (ns) - Log");
                logAxis.setStrictValuesFlag(false); // Permite procesar sin romper por valores nulos o 0
                categoryPlot.setRangeAxis(logAxis);

                BarRenderer renderer = (BarRenderer) categoryPlot.getRenderer();
                renderer.setIncludeBaseInRange(false); // Evita que la barra intente dibujarse desde 0 absoluto
                renderer.setDefaultItemLabelGenerator(new StandardCategoryItemLabelGenerator("{2}", NumberFormat.getIntegerInstance()));
                renderer.setDefaultItemLabelsVisible(true);

                ChartUtils.saveChartAsPNG(new File(CARPETA_RESULTADOS, "grafica_2_orden_" + size + ".png"), barChart, 1200, 700);
            }
        } catch (Exception e) {
            System.err.println("Error guardando las gráficas: " + e.getMessage());
            e.printStackTrace();
        }
    }

    private static void ejecutarAlgoritmo(String nombre, int[] arr) {
        switch (nombre) {
            case "InsertionSort": InsertionSort.probar(arr); break;
            case "DualPivotQuicksort": DualPivotQuicksort.probar(arr); break;
            case "MergeSort": MergeSort.probar(arr); break;
            case "HeapSort": HeapSort.probar(arr); break;
            case "RadixSort": RadixSort.probar(arr); break;
            case "BucketSort": BucketSort.probar(arr); break;
        }
    }

    private static boolean verificarOrden(int[] arr) {
        for (int i = 0; i < arr.length - 1; i++) {
            if (arr[i] > arr[i + 1]) return false;
        }
        return true;
    }

    private static int[] cargarArreglo(String nombreArchivo, int n) throws IOException {
        List<String> lineas = Files.readAllLines(new File(CARPETA_DATOS, nombreArchivo).toPath());
        int[] arr = new int[n];
        for (int i = 0; i < n; i++) arr[i] = Integer.parseInt(lineas.get(i));
        return arr;
    }

    private static void guardarArreglo(String nombreArchivo, int[] arr) throws IOException {
        File file = new File(CARPETA_DATOS, nombreArchivo);
        if (!file.exists()) {
            try (BufferedWriter writer = new BufferedWriter(new FileWriter(file))) {
                for (int num : arr) {
                    writer.write(String.valueOf(num));
                    writer.newLine();
                }
            }
        }
    }

    private static void generarArchivoAleatorio(File archivo, int n) throws IOException {
        Random aleatorio = new Random();
        try (BufferedWriter writer = new BufferedWriter(new FileWriter(archivo))) {
            for (int i = 0; i < n; i++) {
                int numero = aleatorio.nextInt(90_000_000) + 10_000_000;
                writer.write(String.valueOf(numero));
                writer.newLine();
            }
        }
    }
}