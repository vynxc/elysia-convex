import { HttpRouter, RoutableMethod, PublicHttpAction, GenericActionCtx } from "convex/server";
import { Elysia as ElysiaBase, DefinitionBase, ElysiaConfig, EphemeralType, RouteBase, SingletonBase } from "elysia";
import { InternalRoute, MetadataBase } from "elysia/types";
export declare class RouteMatcher {
    private routes;
    /**
     * Adds a route to the `RouteMatcher` instance.
     * @param route The route to add.
     */
    add(route: Pick<InternalRoute, "method" | "path" | "handler">): void;
    /**
     * Finds a matching route for a given method and URL path.
     * @param method The HTTP method to match.
     * @param url The URL path to match.
     * @returns The path of the matching route, or null if no match is found.
     */
    find(method: string, url: string): string | null;
    /**
     * Converts a list of routes to a format compatible with Convex's `HttpRouter`.
     * @returns An array of route tuples in the format expected by Convex's `HttpRouter`.
     */
    toConvexRoutes(): [string, "DELETE" | "GET" | "OPTIONS" | "PATCH" | "POST" | "PUT", (...args: any) => any][];
}
export declare class Elysia<BasePath extends string = "", Scoped extends boolean = false, Singleton extends SingletonBase = {
    decorator: {};
    store: {};
    derive: {};
    resolve: {};
}, Definitions extends DefinitionBase = {
    type: {};
    error: {};
}, Metadata extends MetadataBase = {
    schema: {};
    macro: {};
}, Routes extends RouteBase = {}, Ephemeral extends EphemeralType = {
    derive: {};
    resolve: {};
    schema: {};
}, Volatile extends EphemeralType = {
    derive: {};
    resolve: {};
    schema: {};
}> extends ElysiaBase<BasePath, Scoped, Singleton, Definitions, Metadata, Routes, Ephemeral, Volatile> {
    constructor(config?: Omit<ElysiaConfig<BasePath, Scoped>, "aot">);
}
/**
 * Adds decorators to the `Elysia` instance.
 * Example usage:
 *
 * ```typescript
 * const app = new Elysia().use(convex<ActionCtx>());
 *
 * // Add routes to `app`
 *
 * export default new HttpRouterWithElysia(app);
 * ```
 */
export declare function convex<ActionCtx extends GenericActionCtx<any>>(): ElysiaBase<"", false, {
    decorator: {
        ctx: ActionCtx;
    };
    store: {};
    derive: {};
    resolve: {};
}, {
    type: {};
    error: {};
}, {
    schema: {};
    macro: {};
}, {}, {
    derive: {};
    resolve: {};
    schema: {};
}, {
    derive: {};
    resolve: {};
    schema: {};
}>;
/**
 * An extension of `HttpRouter` that integrates with ElysiaConvex, allowing seamless routing
 * and request handling within a Convex application.
 *
 * This class overrides `getRoutes` and `lookup` methods to work specifically with the routes
 * defined in the provided ElysiaConvex instance.
 *
 * Example usage:
 *
 * ```typescript
 * const app = new Elysia().use(convex<ActionCtx>());
 *
 * // Add routes to `app`
 *
 * export default new HttpRouterWithElysia(app);
 * ```
 */
export declare class HttpRouterWithElysia extends HttpRouter {
    private _app;
    private _handler;
    private _routeMatcher;
    /**
     * Constructs an `HttpRouterWithElysia` instance.
     * @param _app An instance of `ElysiaConvex` used to handle requests.
     */
    constructor(_app: Elysia<any, any, any, any, any, any, any, any> | ElysiaBase<any, any, any, any, any, any, any, any>);
    /**
     * Retrieves and maps routes from the `ElysiaConvex` instance to be used with Convex's `HttpRouter`.
     * @returns An array of tuples representing Convex routes.
     */
    getRoutes: () => [string, "DELETE" | "GET" | "OPTIONS" | "PATCH" | "POST" | "PUT", (...args: any) => any][];
    /**
     * Looks up a route by path and method, returning the corresponding handler and normalized method.
     * @param path The path of the route.
     * @param method The HTTP method of the route.
     * @returns A tuple containing the handler function, normalized HTTP method, and resolved route/path.
     */
    lookup: (path: string, method: RoutableMethod | "HEAD") => readonly [PublicHttpAction, "DELETE" | "GET" | "OPTIONS" | "PATCH" | "POST" | "PUT", string];
}
