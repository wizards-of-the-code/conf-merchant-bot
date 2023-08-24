const parseActionParam = (actionString: string): string => (
  actionString.slice(actionString.lastIndexOf('_') + 1)
);

export default parseActionParam;
