// sse-server.tsx

/** @jsxImportSource preact */
import { h } from "npm:preact";
import { render } from "npm:preact-render-to-string";

const App = () => (
  <html>
    <head>
      <title>SSE with TSX</title>
    </head>
    <body>
      <h1>Server-Sent Events Demo</h1>
      <div id="events"></div>
      <script type="text/javascript" src="/client.js"></script>
    </body>
  </html>
);

// Create an SSE stream that sends an event every second.
const encoder = new TextEncoder();
const sseStream = new ReadableStream({
  start(controller) {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      const event = `data: Event ${count}\n\n`;
      controller.enqueue(encoder.encode(event));
      if (count >= 10) {
        clearInterval(interval);
        controller.close();
      }
    }, 1000);
  },
});

Deno.serve({ port: 8000 }, async (req) => {
  const url = new URL(req.url);
  if (url.pathname === "/") {
    // Render the HTML using Preact's render-to-string.
    const html = render(<App />);
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } else if (url.pathname === "/client.js") {
    return new Response(
      `const evtSource = new EventSource("/sse");
          evtSource.onmessage = function(event) {
            const eventsDiv = document.getElementById("events");
            const p = document.createElement("p");
            p.textContent = event.data;
            eventsDiv.appendChild(p);
          };`,
      {
        headers: {
          "Content-Type": "text/javascript",
        }
      },
    );
  } else if (url.pathname === "/sse") {
    // SSE endpoint.
    return new Response(sseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  }
  return new Response("Not Found", { status: 404 });
});

console.log("Server running on http://localhost:8000");
