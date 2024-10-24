import type { AnyProcedure, AnyRouter, ProcedureRecord } from "@trpc/server";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";

// RouteInfo defines the structure of each route's data.
interface RouteInfo {
  path: string;
  routeType: "query" | "mutation";
  input: any;
  output: any;
}

// ExtractedRouter contains the route map for easy lookup.
type ExtractedRouter = Record<string, RouteInfo>;

// Function to extract routes from a TRPC router.
export function extractRouter<TRouter extends AnyRouter>(
  router: TRouter
): ExtractedRouter {
  const extractedRouter: Record<string, RouteInfo> = {}; // The route map to be returned.

  // Recursive helper function to traverse routers and extract route information.
  function extractRoutes(currentRouter: AnyRouter, prefix: string = "") {
    const procedures = currentRouter._def.procedures as ProcedureRecord; // Extracting procedures.
    const record = currentRouter._def.record as Record<
      string,
      AnyRouter | AnyProcedure
    >; // Nested routers/procedures.

    // Loop over each procedure in the current router.
    for (const [key, procedure] of Object.entries(procedures)) {
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
      const routeType = procedure._def.query ? "query" : "mutation";

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

  return extractedRouter;
}
