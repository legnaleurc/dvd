import fetch, { Request, Response } from "node-fetch";

(globalThis.fetch as unknown) = fetch;
(globalThis.Request as unknown) = Request;
(globalThis.Response as unknown) = Response;
