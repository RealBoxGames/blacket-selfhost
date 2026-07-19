import Canvas from "@napi-rs/canvas";

export async function generateShipImage(dominant: any, submissive: any, ship: number) {
    const imageSize = 1024;
    const imageSplit = imageSize / 3;

    const canvas = Canvas.createCanvas(imageSize, imageSize * 2 + imageSplit);
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#990000';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    const dominantAvatar = await Canvas.loadImage(dominant.displayAvatarURL({ format: 'png', size: imageSize * 2 }));
    const submissiveAvatar = await Canvas.loadImage(submissive.displayAvatarURL({ format: 'png', size: imageSize * 2 }));

    ctx.drawImage(dominantAvatar, 0, 0, imageSize, imageSize);
    ctx.drawImage(submissiveAvatar, 0, imageSize + imageSplit, imageSize, imageSize);

    // heart if over 51%, broken heart if under 50%
    const heart = await Canvas.loadImage(ship > 50 ? './assets/heart.svg' : './assets/broken_heart.svg');
    const heartSize = imageSize * 0.60;
    ctx.drawImage(heart, (canvas.width / 2) - (heartSize / 2), (canvas.height / 2) - (heartSize / 2), heartSize, heartSize);

    return canvas.toBuffer("image/png");
}
