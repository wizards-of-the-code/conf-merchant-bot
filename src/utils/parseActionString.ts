import { ObjectId } from 'mongodb';

type ActionStringParams = {
  [key: string]: string | ObjectId;
};

const parseActionString = (actionString: string): ActionStringParams => {
  const paramsArr = actionString.slice(actionString.lastIndexOf('_') + 1).split('@');

  const actionParams: ActionStringParams = {
    eventId: new ObjectId(paramsArr[1]),
    type: paramsArr[0],
  };

  return actionParams;
};

export default parseActionString;
