// Traida de: https://www.geeksforgeeks.org/dsa/exponential-search/

// Búsqueda binaria en arr[l..r] (ambos inclusive)
function binarySearch(arr, l, r, x) {
    while (l <= r) {
        const mid = l + Math.floor((r - l) / 2);
        if (arr[mid] === x)
            return mid;
        if (arr[mid] < x)
            l = mid + 1;
        else
            r = mid - 1;
    }
    return -1;
}

// Returns position of
// first occurrence of
// x in array
function exponentialSearch(arr, n, x) {
    if (n === 0)
        return -1;

    // If x is present at first location itself
    if (arr[0] === x)
        return 0;

    // Find range for binary search by
    // repeated doubling
    let i = 1;
    while (i < n && arr[i] <= x)
        i = i * 2;

    // Call binary search for the found range.
    return binarySearch(arr, Math.floor(i / 2), Math.min(i, n - 1), x);
}

function probar(arreglo, clave) {
    return exponentialSearch(arreglo, arreglo.length, clave);
}

module.exports = {
    probar
};
