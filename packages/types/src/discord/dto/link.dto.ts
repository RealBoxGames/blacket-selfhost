import { IsNotEmpty, IsString, Validate } from "class-validator";

export class DiscordLinkDto {
    @IsNotEmpty()
    @Validate((value: string) => value.length > 0)
    readonly code: string;

    @IsNotEmpty()
    @IsString()
    @Validate((value: string) => value.length > 0)
    readonly state: string;
}

export default DiscordLinkDto;
