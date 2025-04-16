// resolves if values are different
// handles all different field types

const getMixedState = (values: any[]): { value: any; isMixed: boolean } => {
  if (!values.length) return { value: null, isMixed: false };

  // Check if all values are the same
  const allSame = values.every((v) => {
    if (Array.isArray(v) && Array.isArray(values[0])) {
      return (
        v.length === values[0].length &&
        v.every((val, index) => val === values[0][index])
      );
    }
    return v === values[0];
  });
  if (allSame) return { value: values[0], isMixed: false };

  // Handle arrays
  if (Array.isArray(values[0])) {
    const uniqueValues = [...new Set(values.flat())];
    return { value: uniqueValues, isMixed: true };
  }

  // Handle date strings
  if (values[0] && !isNaN(new Date(values[0] as string).getTime())) {
    const latestDate = values.reduce(
      (latest, currentValue) => {
        const currentDate = new Date(currentValue as string);
        if (isNaN(currentDate.getTime())) {
          return latest; // Skip invalid dates
        }
        if (!latest) {
          return currentDate;
        }
        return currentDate > latest ? currentDate : latest;
      },
      null as Date | null
    );

    if (latestDate) {
      return { value: latestDate.toISOString(), isMixed: true };
    }
  }

  // Default case for strings
  return { value: "Mixed", isMixed: true };
};

export default getMixedState;
