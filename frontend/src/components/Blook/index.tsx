import { useEffect, useState } from "react";
import { useUser } from "@stores/UserStore/index";
import styles from "./blook.module.scss";

import { BlookProps } from "./blook.d";

const ERROR_IMAGE = window.constructCDNUrl("/content/icons/error.png");
const _cache = new Map<string, string>();

export default function Blook({ custom = false, shiny = false, big = false, src, alt, draggable, className, objectFit, ...props }: BlookProps) {
    const [image, setImage] = useState<string | null>(null);
    const { isLowPerformance } = useUser();

    useEffect(() => {
        if (_cache.has(src)) {
            setImage(_cache.get(src) || null);
        } else {
            fetch(src)
                .then((res) => {
                    if (!res.ok) throw new Error();
                    return res.arrayBuffer();
                })
                .then((buffer) => {
                    const objectURL = URL.createObjectURL(new Blob([buffer]));

                    _cache.set(src, objectURL);

                    setImage(objectURL);
                })
                .catch(() => {
                    _cache.set(src, ERROR_IMAGE);

                    setImage(ERROR_IMAGE);
                });
        }
    }, [src]);

    return (
        <>
            <div
                className={`${className ? `${className} ` : ""}${styles.blook}`}
                style={{
                    filter: shiny ? `
                        ${!isLowPerformance()
                            ? "drop-shadow(0px 0px 4px #fff)"
                            : "drop-shadow(2px 0px 0 white) drop-shadow(0px 2px 0 white) drop-shadow(-2px -0px 0 white) drop-shadow(-0px -2px 0 white)"
                        }
                        hue-rotate(90deg)
                    ` : undefined,
                    transform: big ? "scale(1.5)" : undefined,
                    marginLeft: big ? "15px" : undefined,
                    marginRight: big ? "15px" : undefined,
                    ...props.style
                }}
                {...props}
            >
                {custom && <div className={styles.customIndicatorContainer}>
                    <div className={styles.customIndicator}>
                        <span>C</span>
                    </div>
                </div>}

                {image && <>
                    {!isLowPerformance() && shiny && <>
                        <div
                            style={{ maskImage: `url('${image.replaceAll("'", "\\'")}` }}
                            className={styles.overlay}
                        />

                        <div
                            style={{ maskImage: `url('${image.replaceAll("'", "\\'")}` }}
                            className={styles.shimmerOverlay}
                        />
                    </>}

                    <img
                        className={styles.image}
                        style={objectFit ? {
                            objectFit: objectFit,
                            borderRadius: objectFit === "cover" ? "10%" : undefined
                        } : {}}
                        src={image}
                        alt={alt}
                        draggable={draggable}
                    />
                </>}
            </div>
        </>
    );
}
