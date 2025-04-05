// json-rpc_http-server.ts

// Define Types for JSON-RPC
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
  // Example: echoes back the text parameter
  echo: (params: { text: string }) => params.text,
  // Example: adds two numbers; expects an array of two numbers
  add: (params: [number, number]) => params[0] + params[1],
};

async function handler(req: Request): Promise<Response> {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const bodyText = await req.text();
    const rpcReq = JSON.parse(bodyText) as JSONRPCRequest;

    // Basic check: verify the JSON-RPC version and method field
    if (rpcReq.jsonrpc !== "2.0" || !rpcReq.method) {
      throw new Error("Invalid Request: missing jsonrpc or method");
    }

    const methodFunc = methods[rpcReq.method];
    if (!methodFunc) {
      // Method not found
      const response: JSONRPCResponse = {
        jsonrpc: "2.0",
        id: rpcReq.id,
        error: {
          code: -32601,
          message: `Method not found: ${rpcReq.method}`,
        },
      };
      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Execute the method (works with sync or async functions)
    let result: unknown;
    try {
      result = await methodFunc(rpcReq.params);
    } catch (err) {
      // If method execution throws, return an error response
      const response: JSONRPCResponse = {
        jsonrpc: "2.0",
        id: rpcReq.id ?? null,
        error: {
          code: -32000,
          message: err instanceof Error ? err.message : String(err),
        },
      };
      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Successful response
    const response: JSONRPCResponse = {
      jsonrpc: "2.0",
      id: rpcReq.id ?? null,
      result,
    };
    return new Response(JSON.stringify(response), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // Return a Parse error if JSON parsing fails or other unexpected issues occur
    const response: JSONRPCResponse = {
      jsonrpc: "2.0",
      id: null,
      error: {
        code: -32700,
        message: "Parse error",
      },
    };
    return new Response(JSON.stringify(response), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}

// Start the server using the built-in Deno HTTP server
console.log("Starting JSON-RPC server on http://localhost:8000");
Deno.serve(handler, { port: 8000 });
