/**
 * Returns a randomly shuffled shallow copy of the array.
 */
function shuffle(array) {
    const result = new Array(array.length);
    for (let i = 0; i < array.length; i++) {
        const j = Math.floor(Math.random() * (i + 1));
        if (j !== i)
            result[i] = result[j];
        result[j] = array[i];
    }
    return result;
}