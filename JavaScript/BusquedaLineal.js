// Traida de: https://www.geeksforgeeks.org/dsa/linear-search/

// Function to search for an element in the array
function search(arr, x) {

    // Iterate over the array to find x
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === x) {
            return i;
        }
    }

    return -1;
}

function probar(arreglo, clave) {
    return search(arreglo, clave);
}

module.exports = {
    probar
};
