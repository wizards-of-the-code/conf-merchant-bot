/**
 * Function to format time to "hh:mm" in UTC timezone.
 * @param {string | Date} isoDateString Datetime object to be parsed.
 * @returns {string} Time formatted to "hh:mm" in UTC timezone.
 */
const formatTimeToHhMmUTC = (isoDateString: string | Date): string => {
  const date = new Date(isoDateString);
  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = (date.getUTCMinutes()).toString().padStart(2, '0');

  return `${hours}:${minutes}`;
};

export default formatTimeToHhMmUTC;
