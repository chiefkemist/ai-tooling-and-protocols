// stream_file_with_content_length.ts

// Current script's directory
const currentDir = new URL(".", import.meta.url).pathname;
// Download big.txt from https://norvig.com/big.txt
// Open the file for reading.
const file = await Deno.open(`${currentDir}/big.txt`, { read: true });
// Retrieve file information to determine the size.
const fileInfo = await Deno.stat(`${currentDir}/big.txt`);
const contentLength = fileInfo.size.toString();

// Start the HTTP server.
Deno.serve({ port: 8000 }, (req) => {
  const url = new URL(req.url);
  if (url.pathname === "/file") {
    // Since we know the file size, we include the Content-Length header.
    return new Response(file.readable, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Length": contentLength,
      },
    });
  }
  const infoText = "Visit /file to stream the file content with a Content-Length header.";
  return new Response(infoText, {
    headers: {
      "Content-Type": "text/plain",
      "Content-Length": infoText.length.toString(),
    },
  });
});

console.log("File streaming server running on http://localhost:8000");
