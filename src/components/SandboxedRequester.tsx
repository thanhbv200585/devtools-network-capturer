import React, { useState } from "react";
import { HAREntry } from "../types";
import { Send, Globe, Play, Trash, Info } from "lucide-react";

interface SandboxedRequesterProps {
  onCaptureRequest: (entry: HAREntry) => void;
}

export default function SandboxedRequester({ onCaptureRequest }: SandboxedRequesterProps) {
  const [method, setMethod] = useState<string>("GET");
  const [url, setUrl] = useState<string>("https://jsonplaceholder.typicode.com/todos/1");
  const [requestBody, setRequestBody] = useState<string>('{\n  "title": "Postman Exporter Test",\n  "body": "Built with Google AI Studio",\n  "userId": 1\n}');
  const [headers, setHeaders] = useState<Array<{ name: string; value: string }>>([
    { name: "Content-Type", value: "application/json" },
    { name: "Accept", value: "application/json" }
  ]);
  const [newHeaderName, setNewHeaderName] = useState<string>("");
  const [newHeaderValue, setNewHeaderValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error" | "info"; text: string } | null>({
    type: "info",
    text: "Dispatched requests are logged instantly in the DevTools console."
  });

  const apiPresets = [
    {
      label: "Fetch Todo (JSONPlaceholder)",
      method: "GET",
      url: "https://jsonplaceholder.typicode.com/todos/1",
      headers: [{ name: "Accept", value: "application/json" }],
      body: ""
    },
    {
      label: "Create Post (JSONPlaceholder)",
      method: "POST",
      url: "https://jsonplaceholder.typicode.com/posts",
      headers: [
        { name: "Content-Type", value: "application/json" },
        { name: "Accept", value: "application/json" }
      ],
      body: '{\n  "title": "Postman Exporter Test",\n  "body": "Built with Google AI Studio",\n  "userId": 1\n}'
    },
    {
      label: "Echo Headers (HTTPBin)",
      method: "GET",
      url: "https://httpbin.org/headers",
      headers: [
        { name: "Content-Type", value: "application/json" },
        { name: "X-Developer-ID", value: "agent-power" }
      ],
      body: ""
    },
    {
      label: "Trigger 404 Error",
      method: "GET",
      url: "https://jsonplaceholder.typicode.com/invalid-route-error",
      headers: [],
      body: ""
    }
  ];

  const applyPreset = (preset: typeof apiPresets[0]) => {
    setMethod(preset.method);
    setUrl(preset.url);
    if (preset.body) {
      setRequestBody(preset.body);
    }
    setHeaders(preset.headers);
    setStatusMsg({ type: "info", text: `Loaded preset: ${preset.method} url.` });
  };

  const handleAddHeader = () => {
    if (!newHeaderName) return;
    setHeaders([...headers, { name: newHeaderName, value: newHeaderValue }]);
    setNewHeaderName("");
    setNewHeaderValue("");
  };

  const handleRemoveHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusMsg({ type: "info", text: `Sending ${method} request to ${url}...` });

    const startTime = Date.now();
    const headersObj: Record<string, string> = {};
    headers.forEach(h => {
      if (h.name) headersObj[h.name] = h.value;
    });

    const init: RequestInit = {
      method: method,
      headers: headersObj,
    };

    if (["POST", "PUT", "PATCH"].includes(method) && requestBody) {
      init.body = requestBody;
    }

    try {
      const response = await fetch(url, init);
      const duration = Date.now() - startTime;
      let resText = "";
      try {
        resText = await response.text();
      } catch (e) {
        resText = "[Unable to extract response body]";
      }

      // Read response content-type
      const resContentType = response.headers.get("content-type") || "text/plain";

      // Formulate a beautiful HAR entry
      const harEntry: HAREntry = {
        _id: `sandbox-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        startedDateTime: new Date(startTime).toISOString(),
        time: duration,
        request: {
          method: method,
          url: url,
          headers: headers,
          queryString: Array.from(new URL(url).searchParams.entries()).map(([k, v]) => ({ name: k, value: v })),
          postData: ["POST", "PUT", "PATCH"].includes(method) && requestBody ? { mimeType: headersObj["Content-Type"] || "application/json", text: requestBody } : undefined
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: Array.from(response.headers.entries()).map(([k, v]) => ({ name: k, value: v })),
          content: {
            mimeType: resContentType,
            text: resText
          }
        }
      };

      onCaptureRequest(harEntry);
      setStatusMsg({
        type: response.ok ? "success" : "error",
        text: `Completed: ${response.status} ${response.statusText} in ${duration}ms!`
      });
    } catch (err: any) {
      const duration = Date.now() - startTime;
      const failedEntry: HAREntry = {
        _id: `sandbox-${Date.now()}-err`,
        startedDateTime: new Date(startTime).toISOString(),
        time: duration,
        request: {
          method: method,
          url: url,
          headers: headers,
          queryString: [],
          postData: ["POST", "PUT", "PATCH"].includes(method) ? { mimeType: headersObj["Content-Type"] || "", text: requestBody } : undefined
        },
        response: {
          status: 0,
          statusText: "Error/CORS Blocked",
          headers: [],
          content: {
            mimeType: "text/plain",
            text: err.message || "Failed to fetch. This may be due to CORS restrictions from the destination server."
          }
        }
      };

      onCaptureRequest(failedEntry);
      setStatusMsg({
        type: "error",
        text: `Fetch Failed: ${err.message || "Possible Network or CORS block"}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="sandbox-container" className="bg-[#111111] border border-[#1e293b] rounded-xl p-5 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-mono text-sm font-semibold tracking-wider text-emerald-400 flex items-center gap-2 font-bold">
          <Globe className="w-4 h-4 text-emerald-400 animate-pulse" />
          INTERNAL REQUEST SANDBOX
        </h3>
        <span className="text-[10px] bg-emerald-950/40 text-emerald-400 px-2.5 py-0.5 rounded-md font-mono font-bold border border-emerald-900/50">
          CORS-READY
        </span>
      </div>

      <p className="text-xs text-[#94a3b8] mb-4 leading-relaxed font-sans">
        Test capturing right inside this tab! Trigger requests to live resources below. They will immediately stream into the devtools table.
      </p>

      {/* API Preset Tags */}
      <div className="mb-4">
        <label className="block text-[10px] font-mono text-[#64748b] uppercase tracking-wider mb-2">
          Pick a Quick Preset
        </label>
        <div className="flex flex-wrap gap-1.5">
          {apiPresets.map((preset, idx) => (
            <button
              key={idx}
              id={`preset-btn-${idx}`}
              type="button"
              onClick={() => applyPreset(preset)}
              className="text-[11px] font-semibold bg-[#1e293b] hover:bg-[#2c3d52] text-[#e2e8f0] border border-[#334155] px-2.5 py-1 rounded transition-colors duration-200 cursor-pointer text-left"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSendRequest} className="space-y-4">
        {/* Method & URL Row */}
        <div className="flex gap-2">
          <select
            id="sandbox-method-select"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="bg-[#0a0a0a] text-[#e2e8f0] text-xs font-mono font-bold px-3 py-2 border border-[#1e293b] rounded focus:border-emerald-500/60 focus:outline-none"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
          <input
            id="sandbox-url-input"
            type="url"
            required
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-[#0a0a0a] text-white text-xs font-mono px-3 py-2 border border-[#1e293b] rounded focus:border-emerald-500/60 focus:outline-none"
            placeholder="https://api.example.com/v1"
          />
        </div>

        {/* Custom headers editor */}
        <div className="bg-[#0a0a0a] rounded border border-[#1e293b] p-3">
          <span className="block text-[10px] font-mono text-[#64748b] uppercase tracking-wider mb-2">
            Request Headers ({headers.length})
          </span>
          {headers.length > 0 && (
            <div className="space-y-1.5 max-h-24 overflow-y-auto mb-2 pr-1 custom-scrollbar animate-none">
              {headers.map((h, idx) => (
                <div key={idx} className="flex items-center justify-between bg-[#111111] border border-[#1e293b] px-2 py-1 rounded text-[11px] font-mono">
                  <span className="text-indigo-400 font-semibold truncate max-w-[40%]">{h.name}:</span>
                  <span className="text-[#94a3b8] truncate max-w-[45%] text-right">{h.value}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveHeader(idx)}
                    className="text-[#64748b] hover:text-rose-400 p-0.5 ml-1 cursor-pointer transition-colors"
                    title="Remove Header"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add New Header Row */}
          <div className="flex gap-1.5">
            <input
              id="header-name-input"
              type="text"
              value={newHeaderName}
              onChange={(e) => setNewHeaderName(e.target.value)}
              placeholder="Header-Name"
              className="w-1/2 bg-[#0a0a0a] text-[#e2e8f0] text-[11px] font-mono px-2 py-1 border border-[#1e293b] rounded focus:border-[#334155] focus:outline-none"
            />
            <input
              id="header-value-input"
              type="text"
              value={newHeaderValue}
              onChange={(e) => setNewHeaderValue(e.target.value)}
              placeholder="Value"
              className="w-1/2 bg-[#0a0a0a] text-[#e2e8f0] text-[11px] font-mono px-2 py-1 border border-[#1e293b] rounded focus:border-[#334155] focus:outline-none"
            />
            <button
              id="add-header-btn"
              type="button"
              onClick={handleAddHeader}
              className="bg-[#1e293b] hover:bg-[#2c3d52] text-[#e2e8f0] text-xs px-2.5 rounded border border-[#334155] cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>

        {/* Request Body (Conditional) */}
        {["POST", "PUT", "PATCH"].includes(method) && (
          <div>
            <label className="block text-[10px] font-mono text-[#64748b] uppercase tracking-wider mb-1.5">
              Request Payload (JSON Body)
            </label>
            <textarea
              id="sandbox-body-textarea"
              rows={4}
              value={requestBody}
              onChange={(e) => setRequestBody(e.target.value)}
              className="w-full bg-[#0a0a0a] text-emerald-400 text-xs font-mono p-3 border border-[#1e293b] rounded focus:border-emerald-500/60 focus:outline-none resize-none"
              placeholder="{}"
            />
          </div>
        )}

        {/* Submit & Status Msg block */}
        <div className="flex flex-col gap-2 pt-1 font-mono">
          <button
            id="send-request-btn"
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded font-mono text-xs font-bold uppercase tracking-wider text-white bg-emerald-600 hover:bg-emerald-500 transition-colors duration-200 cursor-pointer disabled:bg-[#1e293b] disabled:text-[#475569]`}
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                DISPATCHING...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-white" />
                Dispatch Sandbox Request
              </>
            )}
          </button>

          {statusMsg && (
            <div className={`mt-2 flex items-start gap-2 p-2.5 rounded text-[11px] font-sans border ${
              statusMsg.type === "success"
                ? "bg-emerald-950/40 text-emerald-300 border-emerald-900/40"
                : statusMsg.type === "error"
                ? "bg-rose-950/40 text-rose-300 border-rose-900/40"
                : "bg-indigo-950/40 text-indigo-300 border-indigo-900/40"
            }`}>
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#3b82f6]" />
              <span className="leading-normal">{statusMsg.text}</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
