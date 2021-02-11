export function sortBy(arr, key, asc, ignoreCase) {
  return arr.sort((a, b) => {
    var valA = a[key];
    var valB = b[key];
    if (valA && ignoreCase) {
      valA = valA.toLowerCase();
    }
    if (valB && ignoreCase) {
      valB = valB.toLowerCase();
    }

    if (valA < valB) {
      return asc ? -1 : 1;
    }
    if (valA > valB) {
      return asc ? 1 : -1;
    }
    return 0;
  });
}
