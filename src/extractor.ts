import type { AnyProcedure, AnyRouter, ProcedureRecord } from "@trpc/server";
import { zodToJsonSchema } from "zod-to-json-schema";
import { z } from "zod";

// RouteInfo defines the structure of each route's data.
interface RouteInfo {
  path: string;
  input?: z.ZodTypeAny;
  output?: z.ZodTypeAny;
}

// ExtractedRouter contains the route map for easy lookup.
interface ExtractedRouter {
  routeMap: Record<string, RouteInfo>;
  definitions: Record<string, any>;
}

// Function to extract routes from a TRPC router.
export function extractRouter<TRouter extends AnyRouter>(
  router: TRouter
): ExtractedRouter {
  const routeMap: Record<string, RouteInfo> = {}; // The route map to be returned.
  const definitions: Record<string, any> = {};

  // Extracting definitions from the router.
  function getSchemaDefinition(zodType: z.ZodTypeAny, name: string): any {
    if (definitions[name]) {
      return { $ref: `#/definitions/${name}` }; // Reference existing definition
    }
    const schema = zodToJsonSchema(zodType); // Convert Zod type to JSON schema
    definitions[name] = schema; // Store the definition
    return schema;
  }

  // Recursive helper function to traverse routers and extract route information.
  function extractRoutes(currentRouter: AnyRouter, prefix: string = "") {
    const procedures = currentRouter._def.procedures as ProcedureRecord; // Extracting procedures.
    const record = currentRouter._def.record as Record<
      string,
      AnyRouter | AnyProcedure
    >; // Nested routers/procedures.

    // Loop over each procedure in the current router.
    for (const [key, procedure] of Object.entries(procedures)) {
      const path = `${prefix}${key}`; // Create the full route path.
      const input = (procedure._def.inputs?.[0] as z.ZodTypeAny) || null; // Input schema or null.
      const output = (procedure._def.output as z.ZodTypeAny) || null; // Output schema or null.

      // Use descriptive names for schemas
      const inputSchemaName = `${key}InputSchema`;
      const outputSchemaName = `${key}OutputSchema`;

      // Add the route to the map.
      routeMap[path] = { path, input, output };

      if (input) {
        routeMap[path].input = getSchemaDefinition(input, inputSchemaName);
      }
      if (output) {
        routeMap[path].output = getSchemaDefinition(output, outputSchemaName);
      }
    }

    // Recursively handle any nested routers.
    for (const [key, nestedRouter] of Object.entries(record)) {
      if ("router" in nestedRouter) {
        extractRoutes(nestedRouter as AnyRouter, `${prefix}${key}.`); // Traverse into nested routers.
      }
    }
  }

  // Start the extraction from the root router.
  extractRoutes(router);

  return { routeMap, definitions };
}
