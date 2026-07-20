import { IsOptional, IsString } from "class-validator";

export class ChatExecuteCommandDto {
    @IsOptional()
    @IsString()
    readonly args?: string;
}

export default ChatExecuteCommandDto;
