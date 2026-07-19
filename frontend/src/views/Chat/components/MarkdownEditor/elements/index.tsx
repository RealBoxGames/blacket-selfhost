import { ElementProps, ElementType } from "../../../chat.d";
import { Mention } from "./Mention";

export default function Element({ attributes, children, element }: ElementProps) {
    switch (element.type) {
        case ElementType.MENTION:
            return <Mention {...{ attributes, children, element }} />;
        case 'paragraph':
            return <p {...attributes} style={{ margin: 0, padding: 0 }}>{children}</p>;
        default:
            return <span {...attributes}>{children}</span>;
    }
}
