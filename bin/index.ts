import { Command } from "commander";
import * as path from "path";
import { extractRouter } from "../src/extractor";
import fs from "fs/promises";

const program = new Command();

program
  .version("0.0.1")
  .option(
    "-o, --output <path>",
    "output of the TRPC routes json. If empty will print to stdout"
  )
  .requiredOption(
    "-i, --input <path>",
    "input of the file containing the TRPC router"
  )
  .option(
    "-r, --router [name]",
    "name of the exported router variable. Leave empty for default export",
    "default"
  );

program.parse(process.argv);

const options = program.opts<{
  output?: string;
  input: string;
  router: string;
}>();

const importedFile = await import(path.resolve(options.input));

const router = importedFile[options.router];

const extractedRouter = extractRouter(router);

const stringifiedRouter = JSON.stringify(extractedRouter, null, 2);

if (options.output === undefined) {
  console.log(stringifiedRouter);
} else {
  await fs.writeFile(options.output, stringifiedRouter);
  console.log(`Extracted routes saved to ${options.output}`);
}
