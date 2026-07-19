import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";
import { TypeAnimation } from "react-type-animation";
import { useUser } from "@stores/UserStore/index";
import { lerp } from "@functions/core/mathematics";
import styles from "./home.module.scss";
import { Button } from "@components/index";

const EYE_MOVEMENT_SPEED = 0.04;
const EYE_MOVEMENT_INTENSITY = 5;

export default function Home() {
    const { user } = useUser();
    if (user) return <Navigate to="/dashboard" replace />;

    const eyesRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const eyePos = { x: 0, y: 0 };
        let targetEyePos = { x: 0, y: 0 };
        let animationFrameId: number;

        const handleMouseMove = (e: MouseEvent) => {
            const eyeRect = eyesRef.current?.getBoundingClientRect();

            if (eyeRect) {
                const eyeCenterX = eyeRect.left + eyeRect.width / 2;
                const eyeCenterY = eyeRect.top + eyeRect.height / 2;
                const angle = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);

                targetEyePos = {
                    x: Math.cos(angle) * EYE_MOVEMENT_INTENSITY,
                    y: Math.sin(angle) * EYE_MOVEMENT_INTENSITY
                };
            }
        };

        const animate = () => {
            eyePos.x = lerp(eyePos.x, targetEyePos.x, EYE_MOVEMENT_SPEED);
            eyePos.y = lerp(eyePos.y, targetEyePos.y, EYE_MOVEMENT_SPEED);

            if (eyesRef.current) {
                eyesRef.current.style.transform = `translate(${eyePos.x}px, ${eyePos.y}px)`;
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        document.addEventListener("mousemove", handleMouseMove);
        animationFrameId = requestAnimationFrame(animate);

        return () => {
            document.removeEventListener("mousemove", handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <>
            <div className={styles.heroSection}>
                <div className={styles.heroContainer}>
                    <div className={styles.heroLeft}>
                        <div className={styles.heroTitle}>
                            {import.meta.env.VITE_INFORMATION_NAME.toUpperCase()}
                        </div>

                        <div className={styles.heroText}>
                            The #1 community driven{" "}
                            <TypeAnimation
                                sequence={[
                                    "trading",
                                    2000,
                                    "collecting",
                                    2000,
                                    "multiplayer",
                                    2000,
                                    "RNG",
                                    2000
                                ]}
                                wrapper="span"
                                speed={50}
                                repeat={Infinity}
                            />

                            <br />

                            web-game for everyone!
                        </div>

                        <div className={styles.heroButtons}>
                            <Button.ClearButton
                                to="/register"
                                className={styles.heroButton}
                            >Register</Button.ClearButton>
                            <Button.ClearButton
                                to="/register"
                                className={styles.heroButton}
                            >Discord</Button.ClearButton>
                        </div>
                    </div>

                    <div className={styles.heroRight}>
                        <div className={styles.zoeyPlatform}>
                            <div className={styles.zoeyImage}>
                                <img
                                    src={"/home/zoey-body.png"}
                                    className={styles.body}
                                    draggable={false}
                                />

                                <img
                                    ref={eyesRef}
                                    src={"/home/zoey-eyes.png"}
                                    className={styles.eyes}
                                    draggable={false}
                                />

                                <img
                                    src={"/home/zoey-sclera.png"}
                                    className={styles.sclera}
                                    draggable={false}
                                />
                            </div>

                            <div className={styles.platform}>
                                <div className={styles.platformTop} />
                                <div className={styles.platformBottom} />
                            </div>
                        </div>
                    </div>

                    <div className={styles.mobileHero}>
                        <div className={styles.mobileZoeyImage}>
                            <img className={styles.mobileHead} src={"/home/zoey-mobile-head.png"} draggable={false} />
                            <img className={styles.mobilePaws} src={"/home/zoey-mobile-paws.png"} draggable={false} />
                        </div>
                    </div>
                </div>

                <div className={styles.heroArrowContainer}>
                    <i className="fa-solid fa-arrow-down" />
                </div>
            </div>
        </>
    );
}
