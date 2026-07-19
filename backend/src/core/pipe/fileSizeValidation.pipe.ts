import { PipeTransform, Injectable, BadRequestException } from "@nestjs/common";

@Injectable()
export class FileSizeValidationPipe implements PipeTransform {
    constructor(private readonly maxFileSize: number) { }

    transform(file: Express.File) {
        if (!file) throw new BadRequestException();

        if (file.size > this.maxFileSize) throw new BadRequestException("File is too large");

        return file;
    }
}
