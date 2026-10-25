// Traida de: https://www.geeksforgeeks.org/dsa/interpolation-search/

// If x is present in arr[lo..hi], then returns
// index of it, else returns -1.
function interpolationSearch(arr, lo, hi, x) {
    let pos;

    // Since array is sorted, an element
    // present in array must be in range
    // defined by corner
    if (lo <= hi && x >= arr[lo] && x <= arr[hi]) {

        // Evitar división entre cero cuando todo el rango tiene el mismo valor
        if (arr[hi] === arr[lo]) {
            return arr[lo] === x ? lo : -1;
        }

        // Probing the position with keeping
        // uniform distribution in mind.
        pos = lo + Math.floor(((hi - lo) / (arr[hi] - arr[lo])) * (x - arr[lo]));

        // Condition of target found
        if (arr[pos] === x)
            return pos;

        // If x is larger, x is in right sub array
        if (arr[pos] < x)
            return interpolationSearch(arr, pos + 1, hi, x);

        // If x is smaller, x is in left sub array
        if (arr[pos] > x)
            return interpolationSearch(arr, lo, pos - 1, x);
    }
    return -1;
}

function probar(arreglo, clave) {
    return interpolationSearch(arreglo, 0, arreglo.length - 1, clave);
}

module.exports = {
    probar
};
