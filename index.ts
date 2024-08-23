import {
	HttpRouter,
	RoutableMethod,
	PublicHttpAction,
	httpActionGeneric,
	ROUTABLE_HTTP_METHODS,
	GenericActionCtx,
	RouteSpec,
} from "convex/server";
import {
	Elysia as ElysiaBase,
	DefinitionBase,
	ElysiaConfig,
	EphemeralType,
	RouteBase,
	SingletonBase,
} from "elysia";
import { InternalRoute, MetadataBase } from "elysia/types";

export class RouteMatcher {
	private routes: Array<{
		route: Pick<InternalRoute, "method" | "path" | "handler">;
		regex: RegExp;
		isWildcard: boolean;
	}> = [];

	/**
	 * Adds a route to the `RouteMatcher` instance.
	 * @param route The route to add.
	 */
	add(route: Pick<InternalRoute, "method" | "path" | "handler">) {
		const isWildcard = route.path.includes("*");
		const regexStr =
			"^" +
			route.path
				.replace(/\*/g, ".*") // Replace '*' with '.*' for wildcard matching
				.replace(/:(\w+)/g, "([^/]+)") // Replace ':param' with a capturing group '([^/]+)')
				.replace(/\/$/, "") + // Ensure trailing slash is optional
			"/?$";
		this.routes.push({
			route,
			regex: new RegExp(regexStr),
			isWildcard,
		});
	}

	/**
	 * Finds a matching route for a given method and URL path.
	 * Prioritizes exact matches over wildcard matches.
	 * @param method The HTTP method to match.
	 * @param url The URL path to match.
	 * @returns The path of the matching route, or null if no match is found.
	 */
	find(method: string, url: string): string | null {
		// Check for an exact match first (non-wildcard routes)
		for (const {
			route: { method: m, path },
			regex,
			isWildcard,
		} of this.routes) {
			if (!isWildcard && m === method && regex.test(url)) {
				return path;
			}
		}

		// If no exact match is found, check for a wildcard match
		for (const {
			route: { method: m, path },
			regex,
			isWildcard,
		} of this.routes) {
			if (isWildcard && m === method && regex.test(url)) {
				return path;
			}
		}

		return null;
	}

	/**
	 * Converts a list of routes to a format compatible with Convex's `HttpRouter`.
	 * @returns An array of route tuples in the format expected by Convex's `HttpRouter`.
	 */
	toConvexRoutes() {
		const routes: [string, RoutableMethod, (...args: any) => any][] =
			this.routes.map(({ route }) => {
				const path = route.path;
				const method = route.method as RoutableMethod;
				return [
					path,
					method,
					typeof route.handler === "function"
						? route.handler
						: (...args: any) => {},
				] as const;
			});
		return routes;
	}
}

export class Elysia<
	BasePath extends string = "",
	Scoped extends boolean = false,
	Singleton extends SingletonBase = {
		decorator: {};
		store: {};
		derive: {};
		resolve: {};
	},
	Definitions extends DefinitionBase = {
		type: {};
		error: {};
	},
	Metadata extends MetadataBase = {
		schema: {};
		macro: {};
		macroFn: {};
	},
	Routes extends RouteBase = {},
	Ephemeral extends EphemeralType = {
		derive: {};
		resolve: {};
		schema: {};
	},
	Volatile extends EphemeralType = {
		derive: {};
		resolve: {};
		schema: {};
	},
> extends ElysiaBase<
	BasePath,
	Scoped,
	Singleton,
	Definitions,
	Metadata,
	Routes,
	Ephemeral,
	Volatile
> {
	constructor(config?: Omit<ElysiaConfig<BasePath, Scoped>, "aot">) {
		super({ aot: false, ...config });
	}
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
export function convex<ActionCtx extends GenericActionCtx<any>>() {
	return new ElysiaBase({ aot: false }).decorate(
		"ctx",
		undefined as unknown as ActionCtx
	);
}

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
export class HttpRouterWithElysia extends HttpRouter {
	private _handler: PublicHttpAction;
	private _routeMatcher: RouteMatcher;

	/**
	 * Constructs an `HttpRouterWithElysia` instance.
	 * @param _app An instance of `ElysiaConvex` used to handle requests.
	 */
	constructor(
		private _app:
			| Elysia<any, any, any, any, any, any, any, any>
			| ElysiaBase<any, any, any, any, any, any, any, any>
	) {
		super();
		this._routeMatcher = new RouteMatcher();
		this._handler = httpActionGeneric(async (ctx, request: Request) => {
			_app.decorator.ctx = ctx;
			try {
				return await _app.handle(request);
			} catch (e) {
				console.log(e);
				return new Response("Internal Server Error", { status: 500 });
			}
		});
	}

	route = (spec: RouteSpec) => {
		this.getRoutes();
		if (!spec.handler) throw new Error(`route requires handler`);
		if (!spec.method) throw new Error(`route requires method`);
		if (!ROUTABLE_HTTP_METHODS.includes(spec.method)) {
			throw new Error(
				`'${spec.method}' is not an allowed HTTP method (like GET, POST, PUT etc.)`,
			);
		}


		if ("path" in spec) {
			if ("pathPrefix" in spec) {
				throw new Error(
					`Invalid httpRouter route: cannot contain both 'path' and 'pathPrefix'`,
				);
			}
			if (!spec.path.startsWith("/")) {
				throw new Error(`path '${spec.path}' does not start with a /`);
			  }
			const route = this._routeMatcher.find(spec.method, spec.path);
			if(route){
				throw new Error(
					`Path '${spec.path}' for method ${spec.method} already in use`,
				  );
			}

			this._app.route(spec.method, spec.path, spec.handler);

		} else if ("pathPrefix" in spec) {
			if (!spec.pathPrefix.startsWith("/")) {
				throw new Error(
					`pathPrefix '${spec.pathPrefix}' does not start with a /`,
				);
			}
			if (!spec.pathPrefix.endsWith("/")) {
				throw new Error(`pathPrefix ${spec.pathPrefix} must end with a /`);
			}
			const route = this._routeMatcher.find(spec.method, spec.pathPrefix);
			if(route && route !== spec.pathPrefix){
				throw new Error(
					`Path '${spec.pathPrefix}' for method ${spec.method} already in use, found ${route}`,
				  );
			}
			this._app.route(spec.method, spec.pathPrefix+'*' , spec.handler);
		}

		return this;
	}

	/**
	 * Retrieves and maps routes from the `ElysiaConvex` instance to be used with Convex's `HttpRouter`.
	 * @returns An array of tuples representing Convex routes.
	 */
	getRoutes = () => {

		ROUTABLE_HTTP_METHODS.forEach((method) => {
			this._app.routes.forEach((route) => {
				if (route.method === method || route.method === "ALL") {
					this._routeMatcher.add({ ...route, method });
				}
			});
		});
		return this._routeMatcher.toConvexRoutes();
	};

	/**
	 * Looks up a route by path and method, returning the corresponding handler and normalized method.
	 * @param path The path of the route.
	 * @param method The HTTP method of the route.
	 * @returns A tuple containing the handler function, normalized HTTP method, and resolved route/path.
	 */
	lookup = (path: string, method: RoutableMethod | "HEAD") => {
		this.getRoutes();
		const route = this._routeMatcher.find(method, path);
		return [this._handler, normalizeMethod(method), route ?? path] as const;
	};
}

/**
 * Normalizes HTTP method 'HEAD' to 'GET' for consistency.
 * @param method The HTTP method to normalize.
 * @returns The normalized HTTP method.
 */
function normalizeMethod(method: RoutableMethod | "HEAD"): RoutableMethod {
	if (method === "HEAD") return "GET";
	return method;
}