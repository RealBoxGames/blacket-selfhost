import { Transforms } from "slate";

export const insertCommand = (editor: any, commandName: string) => {
    const text = { text: `/${commandName} ` };

    Transforms.insertNodes(editor, text);
};
