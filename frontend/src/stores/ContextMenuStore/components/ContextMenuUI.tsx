import { memo, useLayoutEffect, useRef } from "react";
import { useContextMenu } from "../index";
import { Container, Divider, Item } from "./index";

import styles from "../contextMenu.module.scss";

export default memo(function ContextMenuUI() {
    const { contextMenu, closeContextMenu } = useContextMenu();
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!contextMenu || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.min(contextMenu.x, window.innerWidth - rect.width);
        const y = Math.min(contextMenu.y, window.innerHeight - rect.height);

        containerRef.current.style.left = `${x}px`;
        containerRef.current.style.top = `${y}px`;
    }, [contextMenu]);

    if (!contextMenu) return null;

    return (
        <Container
            ref={containerRef}
            top={contextMenu.y}
            left={contextMenu.x}
        >
            {contextMenu.items.map((item, index) =>
                item?.divider ? (
                    <Divider key={`divider-${index}`} />
                ) : (
                    item && (
                        <Item
                            key={`item-${index}-${item.label}`}
                            icon={item.icon}
                            image={item.image}
                            color={item.color}
                            onClick={() => {
                                item.onClick?.();
                                closeContextMenu();
                            }}
                        >
                            {item.label}
                        </Item>
                    )
                )
            )}
        </Container>
    );
});
