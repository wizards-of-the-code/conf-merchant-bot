import { MessageButton } from '../data/types';

const isValidUrl = async (links: MessageButton[]): Promise<boolean[]> => Promise.all(
  links.map(async (link) => {
    if (link.url === '') return false;
    try {
      const response = await fetch(link.url, { method: 'HEAD' });
      return response.ok;
    } catch (err) {
      return false;
    }
  }),
);

const moreFunctionToBeArrived = () => false;

export { moreFunctionToBeArrived, isValidUrl };
