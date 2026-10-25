package busqueda;
//Traida de = https://www-geeksforgeeks-org.translate.goog/dsa/linear-search/?_x_tr_sl=en&_x_tr_tl=es&_x_tr_hl=es&_x_tr_pto=tc&_x_tr_hist=true
public class BusquedaLineal {

    // Function to search for an element in the array
    static int search(int[] arr, int x) {

        // Iterate over the array to find x
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == x) {
                return i;
            }
        }

        return -1;
    }

    public static void main(String[] args) {
        int[] arr = {2, 3, 4, 10, 40};
        int x = 10;

        int result = search(arr, x);

        if (result == -1) {
            System.out.println("Element is not present in array");
        } else {
            System.out.println("Element is present at index " + result);
        }
    }

    public static void probar(int[] arreglo, int clave) {
    }
}