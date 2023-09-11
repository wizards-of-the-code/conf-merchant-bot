import { escapers } from '@telegraf/entity';
import {
  fmt, bold, italic, underline,
} from 'telegraf/format';

const parseRichText = (input: any[]): string => {
  console.log('input', input);

  let finalText = '';

  const parseLine = (children: unknown[]): string => {
    let line = '';

    children.forEach((child: any) => {
      let textElement;

      if (child.text) {
        textElement = escapers.MarkdownV2(child.text);

        if (child.bold) {
          textElement = fmt`*${bold`${textElement}`}*`;
        }

        if (child.italic) {
          textElement = fmt`*${italic`${textElement}`}*`;
        }

        if (child.underline) {
          textElement = fmt`*${underline`${textElement}`}*`;
        }

        line += textElement;
      }

      if (child.type && child.type === 'link') {
        line += `[${child.children[0].text}](${child.url})`;
      }
    });

    console.log('line', line);
    return line;
  };

  input.forEach((element: any) => {
    finalText += `${parseLine(element.children)}\n`;
  });

  return finalText;
};

export default parseRichText;
