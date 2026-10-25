package busqueda;

import org.jfree.chart.ChartFactory;
import org.jfree.chart.ChartUtils;
import org.jfree.chart.JFreeChart;
import org.jfree.chart.axis.LogarithmicAxis;
import org.jfree.chart.plot.PlotOrientation;
import org.jfree.chart.plot.XYPlot;
import org.jfree.data.xy.XYSeries;
import org.jfree.data.xy.XYSeriesCollection;

import java.io.*;
import java.nio.file.Files;
import java.util.*;

public class BusquedaMain {

    private static final int[] TAMANOS = {1_000, 10_000, 100_000, 1_000_000};
    private static final int REPETICIONES = 5;
    private static final String CARPETA_DATOS = "datos";
    private static final String CARPETA_RESULTADOS = "resultados";

    // Clase interna para guardar resultados y graficar
    static class ResultadoBusqueda {
        BusquedaTipo algoritmo;
        int n;
        double promedioPorBusqueda;

        public ResultadoBusqueda(BusquedaTipo algoritmo, int n, double promedioPorBusqueda) {
            this.algoritmo = algoritmo;
            this.n = n;
            this.promedioPorBusqueda = Math.max(0.001, promedioPorBusqueda); // Evitar 0 exacto para LogAxis
        }
    }

    private static List<ResultadoBusqueda> resultadosGlobales = new ArrayList<>();

    public static void main(String[] args) throws IOException {
        new File(CARPETA_DATOS).mkdirs();
        new File(CARPETA_RESULTADOS).mkdirs();

        System.out.println("Cargando arreglos ordenados...");
        List<int[]> arreglosAscendentes = new ArrayList<>();
        Random aleatorio = new Random();

        // 1. Cargar arreglos ascendentes generados en el Punto 1
        for (int n : TAMANOS) {
            File archivo = new File(CARPETA_DATOS, n + "-ascendente.txt");
            if (!archivo.exists()) {
                System.out.println("ERROR: No se encontró " + archivo.getName() + ". Ejecuta el OrdenamientoMain primero.");
                return;
            }
            List<String> lineas = Files.readAllLines(archivo.toPath());
            int[] arreglo = new int[n];
            for (int i = 0; i < n; ++i) {
                arreglo[i] = Integer.parseInt(lineas.get(i));
            }
            arreglosAscendentes.add(arreglo);
        }

        // 2. Generar o cargar 1000 claves (500 presentes, 500 ausentes)
        File archivoClaves = new File(CARPETA_DATOS, "claves-busqueda.txt");
        List<Integer> claves = new ArrayList<>();
        if (!archivoClaves.exists()) {
            System.out.println("Generando archivo de 1000 claves...");
            int[] arrBase = arreglosAscendentes.get(3); // Usamos el arreglo de 1.000.000
            for (int i = 0; i < 500; i++) claves.add(arrBase[aleatorio.nextInt(arrBase.length)]);
            for (int i = 0; i < 500; i++) claves.add(aleatorio.nextInt(9_000_000) + 1_000_000); // 7 dígitos
            Collections.shuffle(claves);
            try (BufferedWriter writer = new BufferedWriter(new FileWriter(archivoClaves))) {
                for (int c : claves) { writer.write(String.valueOf(c)); writer.newLine(); }
            }
        } else {
            List<String> lineasClaves = Files.readAllLines(archivoClaves.toPath());
            for (String linea : lineasClaves) claves.add(Integer.parseInt(linea));
        }

        // 3. Evaluar rendimiento general (Conjunto de 1000 claves)
        BufferedWriter csvWriter = new BufferedWriter(new FileWriter(new File(CARPETA_RESULTADOS, "resultados_busqueda.csv")));
        csvWriter.write("Algoritmo,Lenguaje,N,T1(ns),T2(ns),T3(ns),T4(ns),T5(ns),PromedioTotal(ns),PromedioPorBusqueda(ns),Desviacion(ns)\n");

        System.out.println("\n--- EVALUACIÓN GENERAL DE BÚSQUEDA ---");
        for (BusquedaTipo tipo : BusquedaTipo.values()) {
            for (int i = 0; i < TAMANOS.length; i++) {
                int n = TAMANOS[i];
                int[] arr = arreglosAscendentes.get(i);
                long[] tiempos = new long[REPETICIONES];

                // Calentamiento
                ejecutarLote(tipo, arr, claves);

                for (int rep = 0; rep < REPETICIONES; rep++) {
                    System.gc();
                    long inicio = System.nanoTime();
                    ejecutarLote(tipo, arr, claves);
                    long fin = System.nanoTime();
                    tiempos[rep] = fin - inicio;
                }

                double promedioTotal = 0;
                for (long t : tiempos) promedioTotal += t;
                promedioTotal /= REPETICIONES;

                double varianza = 0;
                for (long t : tiempos) varianza += Math.pow(t - promedioTotal, 2);
                double desviacion = Math.sqrt(varianza / REPETICIONES);
                double promedioPorBusqueda = promedioTotal / claves.size();

                resultadosGlobales.add(new ResultadoBusqueda(tipo, n, promedioPorBusqueda));

                String linea = String.format(Locale.US, "%s,Java,%d,%d,%d,%d,%d,%d,%.2f,%.2f,%.2f\n",
                        tipo.name(), n, tiempos[0], tiempos[1], tiempos[2], tiempos[3], tiempos[4], promedioTotal, promedioPorBusqueda, desviacion);
                csvWriter.write(linea);
                System.out.printf("%s (N=%d) -> %.2f ns/busqueda\n", tipo.name(), n, promedioPorBusqueda);
            }
        }
        csvWriter.close();

        // 4. Evaluar Posición de la Clave (N = 1.000.000)
        System.out.println("\n--- ANÁLISIS DE POSICIÓN DE LA CLAVE (N = 1.000.000) ---");
        int[] arrMillon = arreglosAscendentes.get(3);
        int claveInicio = arrMillon[0];
        int claveCentro = arrMillon[arrMillon.length / 2];
        int claveFinal = arrMillon[arrMillon.length - 1];

        System.out.printf("%-15s | %-15s | %-15s | %-15s\n", "Algoritmo", "Inicio (ns)", "Centro (ns)", "Final (ns)");
        System.out.println("-----------------------------------------------------------------------");
        for (BusquedaTipo tipo : BusquedaTipo.values()) {
            double tInicio = medirPosicion(tipo, arrMillon, claveInicio);
            double tCentro = medirPosicion(tipo, arrMillon, claveCentro);
            double tFinal = medirPosicion(tipo, arrMillon, claveFinal);
            System.out.printf("%-15s | %-15.2f | %-15.2f | %-15.2f\n", tipo.name(), tInicio, tCentro, tFinal);
        }

        // 5. Generar Gráfica de Crecimiento
        System.out.println("\nGenerando gráfica de crecimiento...");
        generarGraficaCrecimiento();
    }

    private static void ejecutarLote(BusquedaTipo tipo, int[] arr, List<Integer> claves) {
        for (int c : claves) ejecutarUnica(tipo, arr, c);
    }

    private static double medirPosicion(BusquedaTipo tipo, int[] arr, int clave) {
        for (int i = 0; i < 100; i++) ejecutarUnica(tipo, arr, clave); // Calentamiento
        System.gc();
        long inicio = System.nanoTime();
        for (int i = 0; i < 1000; i++) ejecutarUnica(tipo, arr, clave);
        long fin = System.nanoTime();
        return (fin - inicio) / 1000.0; // Promedio por búsqueda
    }

    private static void ejecutarUnica(BusquedaTipo tipo, int[] arr, int clave) {
        switch (tipo) {
            case LINEAL: BusquedaLineal.probar(arr, clave); break;
            case BINARIA: BusquedaBinaria.probar(arr, clave); break;
            case TERNARIA: BusquedaTernaria.probar(arr, clave); break;
            case SALTOS: BusquedaSaltos.probar(arr, clave); break;
            case INTERPOLACION: BusquedaInterpolacion.probar(arr, clave); break;
            case EXPONENCIAL: BusquedaExponencial.probar(arr, clave); break;
        }
    }

    private static void generarGraficaCrecimiento() {
        try {
            XYSeriesCollection dataset = new XYSeriesCollection();
            for (BusquedaTipo tipo : BusquedaTipo.values()) {
                XYSeries serie = new XYSeries(tipo.name());
                for (ResultadoBusqueda r : resultadosGlobales) {
                    if (r.algoritmo == tipo) serie.add(r.n, r.promedioPorBusqueda);
                }
                dataset.addSeries(serie);
            }

            JFreeChart chart = ChartFactory.createXYLineChart(
                    "Crecimiento Búsqueda (Java)", "Tamaño del Arreglo (N)", "Tiempo Promedio (ns)",
                    dataset, PlotOrientation.VERTICAL, true, true, false);

            XYPlot plot = chart.getXYPlot();
            LogarithmicAxis xAxis = new LogarithmicAxis("Tamaño del Arreglo (N) - Log");
            xAxis.setStrictValuesFlag(false);
            plot.setDomainAxis(xAxis);

            LogarithmicAxis yAxis = new LogarithmicAxis("Tiempo Promedio (ns) - Log");
            yAxis.setStrictValuesFlag(false);
            plot.setRangeAxis(yAxis);

            ChartUtils.saveChartAsPNG(new File(CARPETA_RESULTADOS, "grafica_3_busqueda_crecimiento.png"), chart, 1000, 700);
        } catch (Exception e) {
            System.err.println("Error generando gráfica: " + e.getMessage());
        }
    }
}