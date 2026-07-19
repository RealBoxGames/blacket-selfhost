import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { BlacketLoggerService } from "./logger/logger.service";
import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";
import axios from "axios";

import { Upload } from "@blacket/core";

@Injectable()
export class CoreService {
    constructor(private readonly configService: ConfigService,
        private readonly logger: BlacketLoggerService,) {}

    safelyParseJSON(json: string): any {
        let parsed: any;

        try {
            parsed = JSON.parse(json);
        } catch (e) {
            if (this.configService.get("SERVER_TYPE") !== "PROD") this.logger.error("Failed to parse JSON", String(e));
        }

        return parsed;
    }

    serializeBigInt(obj: any): any {
        if (typeof obj === "bigint") return obj.toString();
        else if (Array.isArray(obj)) return obj.map((item) => this.serializeBigInt(item));
        else if (typeof obj === "object" && obj !== null) return Object.fromEntries(Object.entries(obj).map(([key, value]) => [
                    key,
                    this.serializeBigInt(value)
                ]),);

        return obj;
    }

    async getUserUploadPath(upload: Upload): Promise<string> {
        return `${this.configService.get("VITE_CDN_URL")}/users/${upload.userId}/${upload.uploadId}/${upload.filename}`;
    }

    async verifyTurnstile(token: string, ip?: string): Promise<boolean> {
        const secret = this.configService.get("SERVER_TURNSTILE_SECRET_KEY");

        const body = new URLSearchParams();

        body.append("secret", secret);
        body.append("response", token);
        if (ip) body.append("remoteip", ip);

        const res = await axios.post("https://challenges.cloudflare.com/turnstile/v0/siteverify", body.toString(), {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            },);

        return res.data.success === true;
    }

    async blookifyImage(imageBuffer: Buffer): Promise<Buffer> {
        const BLOOK_MASK_IMAGE_PATH = path.resolve(__dirname, "./assets/blook-mask.png",);
        const BLOOK_OVERLAY_IMAGE_PATH = path.resolve(__dirname, "./assets/blook-overlay.png",);

        const BLOOK_MASK_IMAGE = await fs.promises.readFile(BLOOK_MASK_IMAGE_PATH,);
        const BLOOK_OVERLAY_IMAGE = await fs.promises.readFile(BLOOK_OVERLAY_IMAGE_PATH,);

        const mask = await sharp(BLOOK_MASK_IMAGE).png().toBuffer();

        const overlay = await sharp(BLOOK_OVERLAY_IMAGE).png().toBuffer();

        const image = await sharp(imageBuffer)
            .ensureAlpha()
            .flatten({ background: { r: 255, g: 255, b: 255 } })
            .resize(300, 300, { fit: "fill" })
            .png()
            .toBuffer();

        const compositeImage = await sharp({
            create: {
                width: 300,
                height: 345,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            }
        })
            .composite([{ input: image, top: 45, left: 0 }])
            .png()
            .toBuffer();

        const maskedImage = await sharp(compositeImage)
            .composite([{ input: mask, blend: "dest-out" }])
            .png()
            .toBuffer();

        return await sharp(maskedImage)
            .composite([{ input: overlay, blend: "multiply" }])
            .webp({ quality: 90 })
            .toBuffer();
    }

    async bannerifyImage(imageBuffer: Buffer): Promise<Buffer> {
        const BANNER_MASK_IMAGE_PATH = path.resolve(__dirname, "./assets/banner-mask.png",);
        const BANNER_OVERLAY_IMAGE_PATH = path.resolve(__dirname, "./assets/banner-overlay.png",);

        const BANNER_MASK_IMAGE = await fs.promises.readFile(BANNER_MASK_IMAGE_PATH,);
        const BANNER_OVERLAY_IMAGE = await fs.promises.readFile(BANNER_OVERLAY_IMAGE_PATH,);

        const mask = await sharp(BANNER_MASK_IMAGE).png().toBuffer();

        const overlay = await sharp(BANNER_OVERLAY_IMAGE).png().toBuffer();

        const image = await sharp(imageBuffer)
            .ensureAlpha()
            .flatten({ background: { r: 255, g: 255, b: 255 } })
            .resize(700, 155, { fit: "fill" })
            .png()
            .toBuffer();

        const maskedImage = await sharp(image)
            .composite([{ input: mask, blend: "dest-out" }])
            .png()
            .toBuffer();

        return await sharp(maskedImage)
            .composite([{ input: overlay, blend: "multiply" }])
            .webp({ quality: 90 })
            .toBuffer();
    }
}
