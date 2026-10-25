// Traida de: https://www.geeksforgeeks.org/binary-search/

function binarySearch(arr, x) {
    let low = 0, high = arr.length - 1;
    while (low <= high) {
        const mid = low + Math.floor((high - low) / 2);

        // Check if x is present at mid
        if (arr[mid] === x)
            return mid;

        // If x greater, ignore left half
        if (arr[mid] < x)
            low = mid + 1;

        // If x is smaller, ignore right half
        else
            high = mid - 1;
    }

    // If we reach here, then element was
    // not present
    return -1;
}

function probar(arreglo, clave) {
    return binarySearch(arreglo, clave);
}

module.exports = {
    probar
};
