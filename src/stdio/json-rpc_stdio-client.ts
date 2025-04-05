// json-rpc_stdio-client.ts

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// JSON‑RPC types (same as in the server)
interface JSONRPCRequest {
  jsonrpc: "2.0";
  id?: number | string | null;
  method: string;
  params?: unknown;
}

interface JSONRPCResponse {
  jsonrpc: "2.0";
  id?: number | string | null;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

// Helper: read lines from a Deno.Reader
async function* readLines(reader: Deno.Reader): AsyncIterableIterator<string> {
  let buf = "";
  const buffer = new Uint8Array(1024);
  while (true) {
    const n = await reader.read(buffer);
    if (n === null) break;
    buf += decoder.decode(buffer.subarray(0, n));
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      yield line;
    }
  }
  if (buf) yield buf;
}

async function main() {
  // Current script's directory
  const currentDir = new URL(".", import.meta.url).pathname;
  // Spawn the server process (assuming stdio_server.ts is in the same directory)
  const serverProcess = Deno.run({
    cmd: ["deno", "run", `${currentDir}/json-rpc_stdio-server.ts`],
    stdout: "piped",
    stdin: "piped",
  });

  // Helper function to send a JSON‑RPC request and wait for one response line.
  async function sendRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    const message = JSON.stringify(request) + "\n";
    await serverProcess.stdin.write(encoder.encode(message));
    // Read one line from the server's stdout.
    for await (const line of readLines(serverProcess.stdout)) {
      const response = JSON.parse(line) as JSONRPCResponse;
      return response;
    }
    throw new Error("No response received");
  }

  // Example 1: Call "echo"
  const echoRequest: JSONRPCRequest = {
    jsonrpc: "2.0",
    id: 1,
    method: "echo",
    params: { text: "Hello, STDIO RPC!" },
  };

  const echoResponse = await sendRequest(echoRequest);
  console.log("Echo Response:", echoResponse);

  // Example 2: Call "add"
  const addRequest: JSONRPCRequest = {
    jsonrpc: "2.0",
    id: 2,
    method: "add",
    params: [10, 15],
  };

  const addResponse = await sendRequest(addRequest);
  console.log("Add Response:", addResponse);

  // Close the server process's stdin (to signal end-of-input)
  serverProcess.stdin.close();
  // Wait for the process to finish
  await serverProcess.status();
  serverProcess.close();
}

await main();
