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
  -h, --help           display help for command
```
