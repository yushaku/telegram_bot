import { Elysia } from "elysia";

export const authController = new Elysia().group("/auth", (app) => {
  return app
    .get("/", () => "Hi")
    .post("/sign-in", ({ body }) => body)
    .put("/sign-up", ({ body }) => body);
});
