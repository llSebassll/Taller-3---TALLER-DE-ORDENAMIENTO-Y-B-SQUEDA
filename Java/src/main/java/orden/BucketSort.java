package orden;
import java.util.ArrayList;
import java.util.List;
import java.util.Collections;

// Traido de: https://www.geeksforgeeks.org/dsa/bucket-sort-2/

public class BucketSort {

    public static void probar(int[] arr) {
        bucketSort(arr);
    }

    public static void bucketSort(int[] arr) {
        int n = arr.length;
        if (n <= 0) return;

        // 1. Crear 10 cubetas (índices 0 al 9)
        List<Integer>[] buckets = new ArrayList[10];
        for (int i = 0; i < 10; i++) {
            buckets[i] = new ArrayList<>();
        }

        // 2. Asignar cada valor a su cubeta
        for (int i = 0; i < n; i++) {
            // Como los números son de 8 dígitos (10_000_000 a 99_999_999),
            // al dividir por 10_000_000 obtenemos el primer dígito (1 al 9).
            int bucketIndex = arr[i] / 10_000_000;

            // Seguridad por si un número alcanza los 100M
            if (bucketIndex > 9) bucketIndex = 9;

            buckets[bucketIndex].add(arr[i]);
        }

        // 3. Ordenar las cubetas individuales (usamos la API de Java que por debajo usa TimSort/InsertionSort)
        for (int i = 0; i < 10; i++) {
            Collections.sort(buckets[i]);
        }

        // 4. Concatenar todas las cubetas de vuelta al arreglo
        int index = 0;
        for (int i = 0; i < 10; i++) {
            for (int num : buckets[i]) {
                arr[index++] = num;
            }
        }
    }
}