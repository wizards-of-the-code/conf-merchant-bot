import { escapers } from '@telegraf/entity';

const parseRichText = (input: unknown[]): string => {
  let finalText = '';

  function parseLine(children: unknown[]): string {
    let line = '';

    children.forEach((child: any) => {
      let textElement;

      if (child.text) {
        textElement = escapers.HTML(child.text);

        if (child.bold) {
          textElement = `<b>${textElement}</b>`;
        }

        if (child.italic) {
          textElement = `<i>${textElement}</i>`;
        }

        if (child.underline) {
          textElement = `<u>${textElement}</u>`;
        }

        if (child.strikethrough) {
          textElement = `<s>${textElement}</s>`;
        }

        line += textElement;
      }

      if (child.type && child.type === 'link') {
        line += `<a href="${child.url}">${escapers.HTML(child.children[0].text)}</a>`;
      }
    });

    return line;
  }

  input.forEach((element: any) => {
    finalText += `${parseLine(element.children)}\n`;
  });

  return finalText.slice(0, -1);
};

export default parseRichText;
