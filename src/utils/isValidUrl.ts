/**
 * A function that checks incoming url for validity.
 * @param {string} url - Checked url
 * @returns {boolean}
 */
const isValidUrl = async (url: string): Promise<boolean> => {
  // For some reason fetch("") returns 200
  if (url === '') return false;

  try {
    const response = await fetch(url);
    if (response.status === 200) {
      return true;
    }
  } catch (err) {
    // Handler maybe? But why?
  }

  return false;
};

const moreFunctionToBeArrived = () => false;

export { isValidUrl, moreFunctionToBeArrived };
