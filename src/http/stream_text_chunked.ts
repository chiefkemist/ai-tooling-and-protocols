// stream_text_chunked.ts

const encoder = new TextEncoder();

// Create a ReadableStream that enqueues text chunks every second.
const stream = new ReadableStream({
  start(controller) {
    let count = 0;
    const interval = setInterval(() => {
      count++;
      // Enqueue a new chunk of text.
      controller.enqueue(encoder.encode(`Chunk ${count}\n`));
      if (count >= 5) {
        clearInterval(interval);
        controller.close();
      }
    }, 1000);
  },
});

// Start the HTTP server using Deno.serve.
Deno.serve({ port: 8000 }, (req) => {
  const url = new URL(req.url);
  if (url.pathname === "/stream") {
    // Since we don't know the total size, we use chunked encoding.
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain",
        // Explicitly set Transfer-Encoding for clarity.
        "Transfer-Encoding": "chunked",
      },
    });
  }
  // A static response with known length.
  const staticText = "Hello from Deno!";
  return new Response(staticText, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Length": staticText.length.toString(),
    },
  });
});

console.log("Server running on http://localhost:8000");
