# TRPC Extractor

Extract routes of a TRPC router in a JSON format.

## Usage

You don't need to install this package, just run the following command:

On npm:

```bash
(npx | pnpx | bunx) trpc-extractor -i <path-to-router>
```

Help command:

```
Options:
  -V, --version        output the version number
  -o, --output <path>  output of the TRPC routes json. If empty will print to stdout
  -i, --input <path>   input of the file containing the TRPC router
  -r, --router [name]  name of the exported router variable. Leave empty for default export (default: "default")
  -w, --watch [directory]  watch for changes on a directory and updates the output. Leave empty to watch the input file
  -h, --help           display help for command
```

## Export

This is the export format:

```ts
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
type ExtractedRouter = Record<string, RouteInfo>;
```

```json
{
  "some.route": {
    "path": "some.route",
    "routeType": "query or mutation",
    "input": "json schema or null",
    "output": "json schema or null"
  }
}
```
