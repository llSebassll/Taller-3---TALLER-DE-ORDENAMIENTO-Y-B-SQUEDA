// Traida de: https://www.geeksforgeeks.org/dsa/insertion-sort-algorithm/

function insertionSort(arr) {
    const n = arr.length;
    for (let i = 1; i < n; ++i) {
        const key = arr[i];
        let j = i - 1;

        // Mueve los elementos de arr[0..i-1] que son mayores que key
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j = j - 1;
        }
        arr[j + 1] = key;
    }
}

function probar(arreglo) {
    insertionSort(arreglo);
}

module.exports = {
    probar
};
