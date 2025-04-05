// json-rpc_stdio-server.ts

// Text encoder/decoder to work with Uint8Array
const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Helper: Async line reader from a Deno.Reader.
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

// JSON‑RPC types
interface JSONRPCRequest {
  jsonrpc: "2.0";
  id?: number | string | null;
  method: string;
  params?: unknown;
}

interface JSONRPCError {
  code: number;
  message: string;
  data?: unknown;
}

interface JSONRPCResponse {
  jsonrpc: "2.0";
  id?: number | string | null;
  result?: unknown;
  error?: JSONRPCError;
}

// Define available methods
const methods: Record<string, (params: any) => unknown | Promise<unknown>> = {
  // Echo method: returns the text provided in params.
  echo: (params: { text: string }) => params.text,
  // Add method: expects an array of two numbers.
  add: (params: [number, number]) => params[0] + params[1],
};

// Process one JSON‑RPC message (assumed to be one complete line)
async function processMessage(line: string): Promise<string> {
  try {
    const request = JSON.parse(line) as JSONRPCRequest;
    if (request.jsonrpc !== "2.0" || !request.method) {
      throw new Error("Invalid Request");
    }
    const methodFunc = methods[request.method];
    if (!methodFunc) {
      const response: JSONRPCResponse = {
        jsonrpc: "2.0",
        id: request.id ?? null,
        error: { code: -32601, message: "Method not found" },
      };
      return JSON.stringify(response);
    }
    let result: unknown;
    try {
      result = await methodFunc(request.params);
    } catch (err) {
      const response: JSONRPCResponse = {
        jsonrpc: "2.0",
        id: request.id ?? null,
        error: {
          code: -32000,
          message: err instanceof Error ? err.message : String(err),
        },
      };
      return JSON.stringify(response);
    }
    const response: JSONRPCResponse = {
      jsonrpc: "2.0",
      id: request.id ?? null,
      result,
    };
    return JSON.stringify(response);
  } catch (_err) {
    const response: JSONRPCResponse = {
      jsonrpc: "2.0",
      id: null,
      error: { code: -32700, message: "Parse error" },
    };
    return JSON.stringify(response);
  }
}

// Main loop: read from stdin, process each line, and write the response to stdout.
for await (const line of readLines(Deno.stdin)) {
  // Process each complete JSON‑RPC message (line)
  const response = await processMessage(line);
  await Deno.stdout.write(encoder.encode(response + "\n"));
}
