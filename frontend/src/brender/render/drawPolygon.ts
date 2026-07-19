import { camera } from "@brender/camera";
import { getLayerCtx } from "@brender/utils";

export const drawPolygon = (polygon: DrawPolygonProps) => {
    const polygonCtx = getLayerCtx(polygon.z);

    polygonCtx.save();

    polygonCtx.fillStyle = polygon.color;

    if (polygon.points.length < 3) return;

    polygonCtx.beginPath();
    polygonCtx.moveTo(
        polygon.useCamera ? (polygon.points[0].x - camera.x) * camera.scale : polygon.points[0].x,
        polygon.useCamera ? (polygon.points[0].y - camera.y) * camera.scale : polygon.points[0].y
    );

    for (let i = 1; i < polygon.points.length; i++) {
        const point = polygon.points[i];
        polygonCtx.lineTo(
            polygon.useCamera ? (point.x - camera.x) * camera.scale : point.x,
            polygon.useCamera ? (point.y - camera.y) * camera.scale : point.y
        );
    }

    polygonCtx.closePath();
    polygonCtx.fill();

    polygonCtx.restore();
};

export const clearPolygon = (z: number) => {
    const polygonCtx = getLayerCtx(z);
    polygonCtx.clearRect(0, 0, polygonCtx.canvas.width, polygonCtx.canvas.height);
}

export interface DrawPolygonProps {
    points: { x: number, y: number }[],
    color: string,
    z: number,
    useCamera?: boolean
}