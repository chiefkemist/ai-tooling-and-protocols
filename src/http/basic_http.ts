// basic_http.ts

Deno.serve((_req) => {
  return new Response("Hello World");
});
