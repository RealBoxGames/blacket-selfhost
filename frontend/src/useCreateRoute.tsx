import { Helmet } from "react-helmet-async";
import { Background, Header, HeaderBody, Sidebar, TopRight, SidebarBody, PageHeader } from "@components/index";

export default function useCreateRoute(route: BlacketRoute) {
    if (!route.background) route.background = true;

    const routeElement = <>
        <Helmet>
            {route.title && <title>{route.title}</title>}
            {route.description && <meta name="description" content={route.description} />}
        </Helmet>

        {route.background && <Background />}

        {route.header && <Header {...route.header} />}
        {route.sidebar && <Sidebar />}

        {route.topRight && <TopRight content={route.topRight} desktopOnly={route.topRightDesktopOnly} />}

        {route.header ? !route.dontUseBody ? <HeaderBody>
            {route.component}
        </HeaderBody> : route.component : route.sidebar ? !route.dontUseBody ? <SidebarBody pushOnMobile={!route.topRightDesktopOnly && (route.topRight && route.topRight.length > 0)}>
            {route.pageHeader && <PageHeader>{route.pageHeader}</PageHeader>}

            {route.component}
        </SidebarBody> : route.component : route.component}
    </>;

    const routes = [
        {
            id: route.path,
            path: route.path,
            element: routeElement
        }
    ];

    if (route.aliases && route.aliases.length > 0) {
        for (let index = 0; index < route.aliases.length; index++) {
            const alias = route.aliases[index];

            routes.push({
                id: `${route.path}-alias-${index}`,
                path: alias,
                element: routeElement
            });
        }
    }

    return routes;
}
