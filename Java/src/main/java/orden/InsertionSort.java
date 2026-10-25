package orden;

// Traido de: https://www.geeksforgeeks.org/dsa/insertion-sort-algorithm/

public class InsertionSort {

    public static void probar(int[] arr) {
        int n = arr.length;
        for (int i = 1; i < n; ++i) {
            int key = arr[i];
            int j = i - 1;

            // Mueve los elementos de arr[0..i-1] que son mayores que key
            while (j >= 0 && arr[j] > key) {
                arr[j + 1] = arr[j];
                j = j - 1;
            }
            arr[j + 1] = key;
        }
    }
}