// Traida de: https://www.geeksforgeeks.org/dsa/bucket-sort-2/

function bucketSort(arr) {
    const n = arr.length;
    if (n <= 0) return;

    // 1. Crear 10 cubetas (índices 0 al 9)
    const buckets = [];
    for (let i = 0; i < 10; i++) {
        buckets.push([]);
    }

    // 2. Asignar cada valor a su cubeta
    for (let i = 0; i < n; i++) {
        // Como los números son de 8 dígitos (10_000_000 a 99_999_999),
        // al dividir por 10_000_000 obtenemos el primer dígito (1 al 9).
        let bucketIndex = Math.floor(arr[i] / 10_000_000);

        // Seguridad por si un número alcanza los 100M
        if (bucketIndex > 9) bucketIndex = 9;

        buckets[bucketIndex].push(arr[i]);
    }

    // 3. Ordenar las cubetas individuales (comparador numérico, sort de JS usa TimSort)
    for (let i = 0; i < 10; i++) {
        buckets[i].sort((a, b) => a - b);
    }

    // 4. Concatenar todas las cubetas de vuelta al arreglo
    let index = 0;
    for (let i = 0; i < 10; i++) {
        for (const num of buckets[i]) {
            arr[index++] = num;
        }
    }
}

function probar(arreglo) {
    bucketSort(arreglo);
}

module.exports = {
    probar
};
