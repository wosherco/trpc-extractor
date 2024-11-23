import { initTRPC, TRPCError } from "@trpc/server";
import { z } from "zod";
import superjson from "superjson";
import type { TRPCRouterRecord } from "@trpc/server";

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

const protectedProcedure = t.procedure.use(
  t.middleware(async ({ ctx, next }) => {
    return next({ ctx: { ...ctx } });
  })
);

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

  auth: {
    getUser: protectedProcedure
      .output(
        z.object({
          id: z.string(),
        })
      )
      .query(() => {
        return {
          id: "something",
        };
      }),
  } satisfies TRPCRouterRecord,
});

export default appRouter;
export const test = appRouter;
