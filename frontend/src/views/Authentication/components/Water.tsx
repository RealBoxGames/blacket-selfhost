import { useRef, useEffect } from "react";
import styles from "../authentication.module.scss";

function calculateWater() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const aspectRatio = width / height;

    const baseAspectRatio = 1.875;
    const baseTranslateY = -67;
    const baseRotateX = 80;
    const baseHeight = 100;

    let translateY = baseTranslateY;
    let adjustedHeight = baseHeight;

    if (aspectRatio > baseAspectRatio) {
        const widthFactor = (aspectRatio - baseAspectRatio) / baseAspectRatio;

        translateY = baseTranslateY - (widthFactor * 33);
        adjustedHeight = baseHeight + (widthFactor * 800);
    }

    let rotateX = baseRotateX;

    if (height < 768) {
        const heightFactor = (768 - height) / 768;
        rotateX = baseRotateX - (heightFactor * 5);
        adjustedHeight = adjustedHeight + (heightFactor * 25);
    }

    if (height > 1080) {
        const tallFactor = (height - 1080) / 1080;
        adjustedHeight = adjustedHeight + (tallFactor * 20);
    }

    translateY = Math.max(-120, Math.min(-50, translateY));
    rotateX = Math.max(70, Math.min(85, rotateX));

    const cssHeight = Math.max(0, (adjustedHeight - 100) / 5);

    return {
        transform: `translate(-50%, ${translateY}%) perspective(50vh) rotateX(${rotateX}deg)`,
        height: `${100 + cssHeight}%`
    };
}

export default function Water() {
    const waterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleResize = () => {
            if (!waterRef.current) return;

            const calc = calculateWater();

            waterRef.current.style.transform = calc.transform;
            waterRef.current.style.height = calc.height;
        };

        window.addEventListener("resize", handleResize);

        handleResize();

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return <div
        ref={waterRef}
        className={styles.water}
        style={{
            backgroundImage: `url('${window.constructCDNUrl("/content/trading-plaza/water.gif")}')`
        }}
    />;
}
