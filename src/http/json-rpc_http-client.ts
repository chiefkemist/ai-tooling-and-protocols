// json-rpc_http-client.ts

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

async function jsonRPCRequest(
  method: string,
  params: unknown,
  id: number | string = 1,
): Promise<unknown> {
  const payload = {
    jsonrpc: "2.0",
    method,
    params,
    id,
  };

  const response = await fetch("http://localhost:8000", {
    method: "POST",
    body: JSON.stringify(payload),
    headers: { "Content-Type": "application/json" },
  });

  const json: JSONRPCResponse = await response.json();
  if (json.error) {
    throw new Error(
      `Error ${json.error.code}: ${json.error.message}: ${json.error.data}`,
    );
  }
  return json.result;
}

// Example usage
const echoResult = await jsonRPCRequest("echo", { text: "Hello, JSON-RPC!!" });
console.log("Echo result:", echoResult);

const addResult = await jsonRPCRequest("add", [18, 6]);
console.log("Add result:", addResult);
