import type { AnyProcedure, AnyRouter } from "@trpc/server";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";

// RouteInfo defines the structure of each route's data.
interface RouteInfo {
  path: string;
  routeType: "query" | "mutation";
  // json schema or null
  input: any;
  // json schema or null
  output: any;
}

// ExtractedRouter contains the route map for easy lookup.
type ExtractedRouter = {
  routes: Record<string, RouteInfo>;
  transformer?: { input: string; output: string };
};

// Function to extract routes from a TRPC router.
export function extractRouter<TRouter extends AnyRouter>(
  router: TRouter
): ExtractedRouter {
  const extractedRouter: Record<string, RouteInfo> = {}; // The route map to be returned.
  let transformer: { input: any; output: any } | undefined;

  // if (!router._def._config.transformer._default) {
  //   // TODO: Add transformer
  //   const inputSerializer = new router._def._config.transformer.input();
  //   const outputSerializer = new router._def._config.transformer.output();
  //   transformer = {
  //     input: inputSerializer.serialize("{{SLOT}}"),
  //     output: outputSerializer.serialize("{{SLOT}}"),
  //   };
  // }

  // Recursive helper function to traverse routers and extract route information.
  function extractRoutes(currentRouter: AnyRouter, prefix: string = "") {
    const procedures = currentRouter._def.procedures; // Extracting procedures.
    const record = currentRouter._def.record as Record<
      string,
      AnyRouter | AnyProcedure
    >; // Nested routers/procedures.

    // Loop over each procedure in the current router.
    for (const [key, procedure] of Object.entries(procedures) as [
      string,
      any
    ][]) {
      const path = `${prefix}${key}`;

      // Getting input schemas
      const rawInputs = procedure._def.inputs as z.ZodTypeAny[];

      let input = rawInputs.length === 0 ? null : rawInputs[0]!;

      for (let i = 1; i < rawInputs.length; i++) {
        input = input!.and(rawInputs[i]!);
      }

      // Getting output schema
      const output =
        (procedure._def.output as z.ZodTypeAny | undefined) ?? null; // Output schema or null.

      // Use descriptive names for schemas
      // This doesn't work for TRPC 11
      // const routeType = procedure._def.query ? "query" : "mutation";
      const routeType = procedure._def.type;

      // Add the route to the map.
      extractedRouter[key] = {
        path: path,
        routeType,
        input: input === null ? null : zodToJsonSchema(input),
        output: output === null ? null : zodToJsonSchema(output),
      };

      // Recursively handle any nested routers.
      for (const [key, nestedRouter] of Object.entries(record)) {
        if ("router" in nestedRouter) {
          extractRoutes(nestedRouter as AnyRouter, `${prefix}${key}.`); // Traverse into nested routers.
        }
      }
    }
  }

  // Start the extraction from the root router.
  extractRoutes(router);

  return { routes: extractedRouter, transformer };
}
