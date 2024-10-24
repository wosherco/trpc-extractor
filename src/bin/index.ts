import { Command } from "commander";
import * as path from "path";
import { extractRouter } from "../extractor";
import fs from "fs/promises";
import chokidar from "chokidar";
import { createJiti } from "jiti";
import { LIB_VERSION } from "../version";

const program = new Command();
const jiti = createJiti(import.meta.url, {
  fsCache: false,
  moduleCache: false,
});

program
  .version(LIB_VERSION)
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
  )
  .option(
    "-w, --watch [directory]",
    "watch for changes on a directory and updates the output. Leave empty to watch the input file"
  );

program.parse(process.argv);

const options = program.opts<{
  output?: string;
  input: string;
  router: string;
  watch?: string | boolean;
}>();

async function processRouter() {
  const importedFile: any = await jiti.import(path.resolve(options.input));

  const router = importedFile[options.router];

  const extractedRouter = extractRouter(router);

  const stringifiedRouter = JSON.stringify(extractedRouter, null, 2);

  if (options.output === undefined) {
    console.log(stringifiedRouter);
  } else {
    await fs.writeFile(options.output, stringifiedRouter);
    console.log(`Extracted routes saved to ${options.output}`);
  }
}

async function main() {
  await processRouter();

  if (options.watch !== undefined) {
    const watchPath =
      typeof options.watch === "string"
        ? path.resolve(options.watch)
        : path.resolve(options.input);

    const watcher = chokidar.watch(watchPath, {
      persistent: true,
      ignoreInitial: false,
      usePolling: true,
      interval: 100,
      awaitWriteFinish: true,
    });

    watcher.on("change", async (path) => {
      console.log(`File ${path} has been changed. Processing...`);
      const startTime = Date.now();
      await processRouter();
      const endTime = Date.now();
      const timeTaken = endTime - startTime;
      console.log(`Update completed in ${timeTaken} ms.`);
      console.log(
        `Watching for changes in ${watchPath} and its dependencies...`
      );
    });

    watcher.on("error", (error) => {
      console.error(`Watcher error: ${error}`);
    });

    console.log(`Watching for changes in ${watchPath} and its dependencies...`);
  }
}

main();
