export class ChatCommandEntity {
    name: string;
    description: string;
    usage: string;

    constructor(partial: Partial<ChatCommandEntity>) {
        Object.assign(this, partial);
    }
}

export default ChatCommandEntity;
