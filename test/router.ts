import { initTRPC } from "@trpc/server";
import { z } from "zod";
import superjson from "superjson";

// Initialize a context for the server
function createContext() {
  return {};
}

// Get the context type
type Context = Awaited<ReturnType<typeof createContext>>;

// Initialize tRPC
const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

const appRouter = t.router({
  // Greeting procedure
  greeting: t.procedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .input(z.object({ password: z.string() }))
    .output(
      z.object({
        message: z.string(),
      })
    )
    .query(({ input }) => ({
      message: `Hello, ${input.name}, ${input.password}!`,
    })),
  deep: t.router({
    test: t.procedure.mutation(() => "Hello, nested!"),
    nested: t.router({
      test: t.procedure
        .input(z.object({ name: z.string() }))
        .output(z.object({ message: z.string() }))
        .query(({ input }) => ({ message: `Hello, ${input.name}!` })),
    }),
  }),
});

export default appRouter;
export const test = appRouter;
