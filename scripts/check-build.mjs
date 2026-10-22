import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// A second root server entry bypasses Vite's SSR service and emits a dev manifest.
// Verify the actual deployed handler, not only whether the bundler completed.
if (process.env.VERCEL) {
  const output = resolve(".vercel/output");
  const { default: handler } = await import(
    pathToFileURL(resolve(output, "functions/__server.func/index.mjs"))
  );
  for (const path of ["/", "/book", "/scan"]) {
    const response = await handler.fetch(new Request(`https://smartq.test${path}`));
    const html = await response.text();
    assert.equal(response.status, 200, `${path}: server response`);
    assert.ok(
      !html.includes("virtual:tanstack-start-dev-client-entry"),
      `${path}: development entry in production`,
    );
    const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]);
    assert.ok(
      scripts.some((src) => src.startsWith("/assets/")),
      `${path}: missing client entry`,
    );
    for (const src of scripts.filter((src) => src.startsWith("/assets/"))) {
      assert.ok(
        existsSync(resolve(output, "static", src.slice(1))),
        `${path}: missing asset ${src}`,
      );
    }
  }
  console.log("Production SSR and client assets verified.");
}
