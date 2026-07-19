import { DrawRectProps, getLayerCtx, camera } from "@brender/index";

export const drawRect = (rect: DrawRectProps) => {
    const rectCtx = getLayerCtx(rect.z);

    rectCtx.save();

    rectCtx.fillStyle = rect.color;


    if (rect.useCamera) {
        rectCtx.fillRect(
            (rect.x - camera.x) * camera.scale,
            (rect.y - camera.y) * camera.scale,
            rect.width * camera.scale,
            rect.height * camera.scale
        );
    } else {
        rectCtx.fillRect(
            (rect.x),
            (rect.y),
            rect.width,
            rect.height
        );
    }

    rectCtx.restore();
};

export const clearRect = (z: number) => {
    const rectCtx = getLayerCtx(z);
    rectCtx.clearRect(0, 0, rectCtx.canvas.width, rectCtx.canvas.height);
};

export const drawRoundedRect = (rect: DrawRectProps, radius: number) => {
    const rectCtx = getLayerCtx(rect.z);

    rectCtx.save();

    rectCtx.fillStyle = rect.color;

    const x = rect.useCamera ? (rect.x - camera.x) * camera.scale : rect.x;
    const y = rect.useCamera ? (rect.y - camera.y) * camera.scale : rect.y;
    const width = rect.useCamera ? rect.width * camera.scale : rect.width;
    const height = rect.useCamera ? rect.height * camera.scale : rect.height;

    rectCtx.beginPath();
    rectCtx.moveTo(x + radius, y);
    rectCtx.lineTo(x + width - radius, y);
    rectCtx.quadraticCurveTo(x + width, y, x + width, y + radius);
    rectCtx.lineTo(x + width, y + height - radius);
    rectCtx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    rectCtx.lineTo(x + radius, y + height);
    rectCtx.quadraticCurveTo(x, y + height, x, y + height - radius);
    rectCtx.lineTo(x, y + radius);
    rectCtx.quadraticCurveTo(x, y, x + radius, y);
    rectCtx.closePath();
    rectCtx.fill();

    rectCtx.restore();
};
