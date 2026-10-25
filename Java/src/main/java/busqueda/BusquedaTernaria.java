package busqueda;
//Traida de = https://www.geeksforgeeks.org/dsa/ternary-search/

public class BusquedaTernaria {
    static boolean ternarySearch(int[] arr, int x) {
        int l = 0;
        int r = arr.length - 1;

        while (l <= r) {

            // Split array portion into 3 parts
            int mid1 = l + (r - l) / 3;
            int mid2 = r - (r - l) / 3;

            if (arr[mid1] == x || arr[mid2] == x) {
                return true;
            }

            if (x < arr[mid1]) {
                r = mid1 - 1;
            } else if (x > arr[mid2]) {
                l = mid2 + 1;
            } else {
                l = mid1 + 1;
                r = mid2 - 1;
            }
        }

        return false;
    }

    public static void main(String[] args) {
        int[] arr = {1, 2, 3, 4, 6};
        int x = 6;
        System.out.println(ternarySearch(arr, x));

        arr = new int[] {1, 3, 4, 5, 6};
        x = 2;
        System.out.println(ternarySearch(arr, x));
    }

    public static void probar(int[] arreglo, int clave) {
    }
}