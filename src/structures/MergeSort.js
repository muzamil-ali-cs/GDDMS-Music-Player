class MergeSort {
  static sort(array, compareFn) {
    if (array.length <= 1) {
      return array;
    }

    const middle = Math.floor(array.length / 2);

    const left = array.slice(0, middle);
    const right = array.slice(middle);

    const sortedLeft = MergeSort.sort(left, compareFn);
    const sortedRight = MergeSort.sort(right, compareFn);

    return MergeSort.merge(
      sortedLeft,
      sortedRight,
      compareFn
    );
  }

  static merge(left, right, compareFn) {
    const result = [];

    let i = 0;
    let j = 0;

    while (i < left.length && j < right.length) {
      if (compareFn(left[i], right[j]) <= 0) {
        result.push(left[i]);
        i++;
      } else {
        result.push(right[j]);
        j++;
      }
    }

    while (i < left.length) {
      result.push(left[i]);
      i++;
    }

    while (j < right.length) {
      result.push(right[j]);
      j++;
    }

    return result;
  }
}

export default MergeSort;