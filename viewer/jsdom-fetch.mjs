import fetch, { Request, Response } from "node-fetch";
import { TestEnvironment } from "jest-environment-jsdom";

export default class DomEnvironment extends TestEnvironment {
  async setup() {
    await super.setup();
    this.global.fetch = fetch;
    this.global.Request = Request;
    this.global.Response = Response;
  }
}

export { DomEnvironment as TestEnvironment };
