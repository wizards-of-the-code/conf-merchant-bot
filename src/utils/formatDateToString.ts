const formatDateToString = (date: string | Date): string => new Date(date).toLocaleDateString('ru-RU');

export default formatDateToString;
