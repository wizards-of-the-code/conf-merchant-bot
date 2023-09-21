/**
 * Takes error and returns error message
 * @param err
 * @return {string} Error message
 * */
const getErrorMsg = (err: unknown | Error): string => {
  if (err instanceof Error) {
    return err.message;
  }
  return JSON.stringify(err);
};

export default getErrorMsg;
