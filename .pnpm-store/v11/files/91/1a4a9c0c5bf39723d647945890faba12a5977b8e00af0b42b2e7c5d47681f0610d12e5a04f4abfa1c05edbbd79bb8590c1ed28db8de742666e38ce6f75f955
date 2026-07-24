import { isAllowedOrigin } from "./rpc/transports/ws-server.mjs";
import { t as buildMcpServerFromContext } from "./build-server-0jWgMrz-.mjs";
import { randomUUID } from "node:crypto";
import { defineHandler } from "h3";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
//#region src/adapters/mcp/http.ts
/**
* Mount an MCP Streamable-HTTP endpoint on an h3 app at `path`.
*
* Each MCP session gets its own {@link WebStandardStreamableHTTPServerTransport}
* and MCP server (built from the shared, live `ctx` via
* `buildMcpServerFromContext`), correlated by the `Mcp-Session-Id` header:
* an `initialize` POST spins up a session; later requests route to it; a
* `DELETE` (or client disconnect) tears it down.
*
* The transport is web-standard — its `handleRequest` takes the h3 event's
* web `Request` and returns a web `Response` (an SSE `ReadableStream` body
* for the server→client stream). We copy that response onto `event.res` and
* return its body rather than returning the `Response` object directly, so a
* legitimate MCP 404 (unknown session) isn't swallowed by h3's
* "Response-with-404 falls through to the next handler" rule (which would
* otherwise hand the request to the SPA static catch-all).
*
* @experimental
*/
function mountMcpHttp(app, ctx, path, options) {
	const sessions = /* @__PURE__ */ new Map();
	const allowedOrigins = options.allowedOrigins;
	function drop(sessionId) {
		const session = sessions.get(sessionId);
		if (!session) return;
		sessions.delete(sessionId);
		session.dispose();
	}
	async function createSession() {
		let session;
		const transport = new WebStandardStreamableHTTPServerTransport({
			sessionIdGenerator: () => randomUUID(),
			onsessioninitialized: (id) => {
				sessions.set(id, session);
			},
			onsessionclosed: (id) => {
				drop(id);
			}
		});
		const { server, dispose } = buildMcpServerFromContext(ctx, {
			serverName: options.serverName,
			serverVersion: options.serverVersion,
			exposeSharedState: options.exposeSharedState
		});
		session = {
			transport,
			dispose: async () => {
				dispose();
				await server.close();
			}
		};
		transport.onclose = () => {
			if (transport.sessionId) drop(transport.sessionId);
		};
		await server.connect(transport);
		return session;
	}
	app.use(path, defineHandler(async (event) => {
		const req = event.req;
		const origin = req.headers.get("origin") ?? void 0;
		if (allowedOrigins !== false && !isAllowedOrigin(origin, allowedOrigins ?? [])) {
			event.res.status = 403;
			return "Forbidden: origin not allowed";
		}
		const sessionId = req.headers.get("mcp-session-id") ?? void 0;
		let session = sessionId ? sessions.get(sessionId) : void 0;
		if (!session && req.method === "POST") {
			let body;
			try {
				body = await req.json();
			} catch {
				body = void 0;
			}
			if (!sessionId && isInitializeRequest(body)) session = await createSession();
			else {
				event.res.status = sessionId ? 404 : 400;
				return sessionId ? "Not Found: unknown MCP session" : "Bad Request: no valid session ID and not an initialize request";
			}
			return respond(event, await session.transport.handleRequest(req, { parsedBody: body }));
		}
		if (!session) {
			event.res.status = sessionId ? 404 : 400;
			return sessionId ? "Not Found: unknown MCP session" : "Bad Request: missing MCP session ID";
		}
		return respond(event, await session.transport.handleRequest(req));
	}));
	return { dispose: async () => {
		const live = [...sessions.values()];
		sessions.clear();
		await Promise.all(live.map((session) => session.dispose()));
	} };
}
/**
* Copy a web `Response` from the MCP transport onto the h3 event's response
* and return its body. Returning the body (a `ReadableStream` or `null`)
* rather than the `Response` object avoids h3's 404-fall-through behavior.
*/
function respond(event, response) {
	event.res.status = response.status;
	event.res.statusText = response.statusText;
	response.headers.forEach((value, key) => {
		event.res.headers.set(key, value);
	});
	return response.body ?? "";
}
//#endregion
export { mountMcpHttp };
