// Traida de: https://www.geeksforgeeks.org/dsa/ternary-search/

function ternarySearch(arr, x) {
    let l = 0;
    let r = arr.length - 1;

    while (l <= r) {

        // Split array portion into 3 parts
        const mid1 = l + Math.floor((r - l) / 3);
        const mid2 = r - Math.floor((r - l) / 3);

        if (arr[mid1] === x || arr[mid2] === x) {
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

function probar(arreglo, clave) {
    return ternarySearch(arreglo, clave);
}

module.exports = {
    probar
};
