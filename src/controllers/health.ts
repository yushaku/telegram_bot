import { Elysia } from "elysia";

export const checkHealth = new Elysia().get("/", () => "Hi Elysia");
