import React, { useState } from "react";
import { HAREntry } from "../types";
import { X, Copy, Check, Terminal, Globe, Server, Clock, HardDrive, FileJson, Layers } from "lucide-react";
import { convertEntryToPostmanItem } from "../utils/postman";

interface RequestDetailViewerProps {
  entry: HAREntry | null;
  onClose: () => void;
}

export default function RequestDetailViewer({ entry, onClose }: RequestDetailViewerProps) {
  const [activeTab, setActiveTab] = useState<"headers" | "payload" | "response" | "postman">("headers");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!entry) return null;

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(label);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const getCleanStatusClass = (status: number) => {
    if (status >= 200 && status < 300) return "bg-emerald-950/50 text-emerald-400 border border-emerald-900";
    if (status >= 300 && status < 400) return "bg-amber-950/50 text-amber-400 border border-amber-900";
    if (status >= 400) return "bg-rose-950/50 text-rose-400 border border-rose-900";
    return "bg-slate-900 text-slate-400 border border-slate-800";
  };

  // Safe JSON formatting
  const formatJSON = (text?: string): string => {
    if (!text) return "";
    try {
      const parsed = JSON.parse(text);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return text;
    }
  };

  const requestBodyRaw = entry.request.postData?.text || "";
  const requestBodyFormatted = formatJSON(requestBodyRaw);
  
  const responseBodyRaw = entry.response.content?.text || "";
  const responseBodyFormatted = formatJSON(responseBodyRaw);

  const postmanItemFormatted = JSON.stringify(convertEntryToPostmanItem(entry, 0), null, 2);

  return (
    <div
      id="request-detail-drawer"
      className="bg-[#111111] border border-[#1e293b] rounded-xl flex flex-col h-full w-full shadow-2xl overflow-hidden"
    >
      {/* Header Info */}
      <div className="flex items-start justify-between p-3.5 bg-[#0d0d0d] border-b border-[#1e293b]">
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold tracking-wider ${
              entry.request.method === "POST" ? "bg-amber-950/40 text-amber-500 border border-amber-900/45" :
              entry.request.method === "PUT" ? "bg-blue-950/40 text-blue-400 border border-blue-900/45" :
              entry.request.method === "DELETE" ? "bg-rose-950/40 text-rose-500 border border-rose-900/45" :
              "bg-emerald-950/40 text-emerald-400 border border-emerald-900/45"
            }`}>
              {entry.request.method}
            </span>
            <span className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold ${getCleanStatusClass(entry.response.status)}`}>
              {entry.response.status || "ERR"} {entry.response.statusText}
            </span>
            <span className="text-[10px] text-[#64748b] font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" /> {entry.time} ms
            </span>
          </div>
          <div className="text-xs font-mono text-[#e2e8f0] break-all select-all select-text font-semibold leading-relaxed">
            {entry.request.url}
          </div>
        </div>
        <button
          id="close-drawer-btn"
          type="button"
          onClick={onClose}
          className="text-[#64748b] hover:text-white hover:bg-[#1e293b] p-1.5 rounded cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Selector Tabs Row */}
      <div className="flex bg-[#0d0d0d] border-b border-[#1e293b] px-2 pt-1 gap-1">
        {[
          { id: "headers", label: "Headers" },
          { id: "payload", label: "Payload / Query" },
          { id: "response", label: "Response" },
          { id: "postman", label: "Postman Config" }
        ].map((tab) => (
          <button
            key={tab.id}
            id={`tab-btn-${tab.id}`}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-3 py-2 text-xs font-mono font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === tab.id
                ? "border-[#ef5b25] text-[#ef5b25]"
                : "border-transparent text-[#64748b] hover:text-[#e2e8f0] hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Container Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar text-xs">
        
        {/* TAB 1: Headers */}
        {activeTab === "headers" && (
          <div className="space-y-5">
            {/* General Block */}
            <div className="bg-[#0a0a0a] border border-[#1e293b] rounded-lg p-3 space-y-2">
              <h4 className="font-mono text-[10px] font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Globe className="w-3.5 h-3.5" /> General Details
              </h4>
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                <div className="text-[#64748b]">Request URL:</div>
                <div className="col-span-2 text-[#e2e8f0] break-all select-all">{entry.request.url}</div>
                
                <div className="text-[#64748b]">Request Method:</div>
                <div className="col-span-2 text-white font-bold">{entry.request.method}</div>
                
                <div className="text-[#64748b]">Status Code:</div>
                <div className="col-span-2 text-[#e2e8f0]">
                  {entry.response.status} {entry.response.statusText}
                </div>
                
                <div className="text-[#64748b] font-sans">Started:</div>
                <div className="col-span-2 text-[#e2e8f0]">
                  {new Date(entry.startedDateTime).toLocaleTimeString()}
                </div>
              </div>
            </div>

            {/* Request Headers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-mono text-[10px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5" /> Request Headers ({entry.request.headers.length})
                </h4>
                <button
                  type="button"
                  onClick={() => handleCopyText(JSON.stringify(entry.request.headers, null, 2), "reqHeaders")}
                  className="text-[#64748b] hover:text-[#ef5b25] flex items-center gap-1 text-[11px]"
                >
                  {copiedSection === "reqHeaders" ? (
                    <span className="text-emerald-500 flex items-center gap-0.5"><Check className="w-3 h-3" /> Copied!</span>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy JSON</>
                  )}
                </button>
              </div>

              {entry.request.headers.length === 0 ? (
                <div className="text-[#64748b] italic p-2 bg-[#0a0a0a] border border-[#1e293b] rounded font-mono text-center">No headers found</div>
              ) : (
                <div className="bg-[#0a0a0a]/50 border border-[#1e293b] rounded-lg divide-y divide-[#1e293b]/50 overflow-hidden font-mono text-[11px]">
                  {entry.request.headers.map((h, i) => (
                    <div key={i} className="p-2 flex gap-4 hover:bg-[#0a0a0a]/80">
                      <div className="w-1/3 text-indigo-400 font-semibold break-all select-all">{h.name}</div>
                      <div className="w-2/3 text-[#94a3b8] break-all select-all">{h.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Response Headers */}
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-mono text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5" /> Response Headers ({entry.response.headers?.length || 0})
                </h4>
                <button
                  type="button"
                  onClick={() => handleCopyText(JSON.stringify(entry.response.headers || [], null, 2), "resHeaders")}
                  className="text-[#64748b] hover:text-[#ef5b25] flex items-center gap-1 text-[11px]"
                >
                  {copiedSection === "resHeaders" ? (
                    <span className="text-emerald-400 flex items-center gap-0.5"><Check className="w-3 h-3" /> Copied!</span>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy JSON</>
                  )}
                </button>
              </div>

              {!entry.response.headers || entry.response.headers.length === 0 ? (
                <div className="text-[#64748b] italic p-2 bg-[#0a0a0a] border border-[#1e293b] rounded font-mono text-center">No response headers found</div>
              ) : (
                <div className="bg-[#0a0a0a]/50 border border-[#1e293b] rounded-lg divide-y divide-[#1e293b]/50 overflow-hidden font-mono text-[11px]">
                  {entry.response.headers.map((h, i) => (
                    <div key={i} className="p-2 flex gap-4 hover:bg-[#0a0a0a]/80">
                      <div className="w-1/3 text-emerald-500 font-semibold break-all select-all">{h.name}</div>
                      <div className="w-2/3 text-[#94a3b8] break-all select-all">{h.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Payload / Query String */}
        {activeTab === "payload" && (
          <div className="space-y-5 font-mono text-[11px]">
            {/* Query String Params */}
            <div className="space-y-2">
              <h4 className="font-mono text-[10px] font-semibold text-sky-400 uppercase tracking-wider mb-1">
                Query String Parameters ({entry.request.queryString.length})
              </h4>
              {entry.request.queryString.length === 0 ? (
                <div className="text-[#64748b] italic p-3 bg-[#0a0a0a] border border-[#1e293b] rounded text-center">No query parameters found</div>
              ) : (
                <div className="bg-[#0a0a0a]/50 border border-[#1e293b] rounded-lg divide-y divide-[#1e293b]/55 overflow-hidden">
                  {entry.request.queryString.map((q, i) => (
                    <div key={i} className="p-2.5 flex gap-4 hover:bg-[#0a0a0a]/80">
                      <div className="w-1/3 text-indigo-400 font-semibold break-all select-all">{q.name}</div>
                      <div className="w-2/3 text-[#94a3b8] break-all select-all">{q.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Request Payload / Body */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-mono text-[10px] font-semibold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                  Request Payload Body
                </h4>
                {requestBodyRaw && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(requestBodyFormatted, "reqBody")}
                    className="text-[#64748b] hover:text-[#ef5b25] flex items-center gap-1"
                  >
                    {copiedSection === "reqBody" ? (
                      <span className="text-emerald-400 flex items-center gap-0.5"><Check className="w-3 h-3" /> Copied!</span>
                    ) : (
                      <><Copy className="w-3 h-3" /> Copy Body</>
                    )}
                  </button>
                )}
              </div>

              {!requestBodyRaw ? (
                <div className="text-[#64748b] italic p-3 bg-[#0a0a0a] border border-[#1e293b] rounded text-center">
                  No request body payload sent with this request (Standard GET/DELETE)
                </div>
              ) : (
                <div className="bg-[#0a0a0a] rounded border border-[#1e293b] p-3 max-h-56 overflow-auto custom-scrollbar">
                  <div className="text-[10px] text-[#64748b] mb-1">Content-Type: {entry.request.postData?.mimeType}</div>
                  <pre className="text-emerald-400 whitespace-pre font-mono leading-relaxed select-all select-text selection:bg-[#ef5b25]/20">
                    {requestBodyFormatted}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Response content */}
        {activeTab === "response" && (
          <div className="space-y-3 font-mono text-[11px]">
            <div className="flex items-center justify-between">
              <h4 className="font-mono text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5" /> Response Content Payload
              </h4>
              {responseBodyRaw && (
                <button
                  type="button"
                  onClick={() => handleCopyText(responseBodyFormatted, "resBody")}
                  className="text-[#64748b] hover:text-[#ef5b25] flex items-center gap-1"
                >
                  {copiedSection === "resBody" ? (
                    <span className="text-emerald-400 flex items-center gap-0.5"><Check className="w-3 h-3" /> Copied!</span>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy Output</>
                  )}
                </button>
              )}
            </div>

            {!responseBodyRaw ? (
              <div className="text-[#64748b] italic p-3 bg-[#0a0a0a] border border-[#1e293b] rounded text-center">
                Response returned no content payload body
              </div>
            ) : (
              <div className="bg-[#0a0a0a] rounded border border-[#1e293b] p-3.5 max-h-80 overflow-auto custom-scrollbar">
                <div className="text-[10px] text-[#64748b] mb-2">
                  Body MIME/Type: <span className="text-indigo-400">{entry.response.content?.mimeType || "unknown"}</span>
                </div>
                <pre className="text-[#94a3b8] whitespace-pre font-mono leading-relaxed select-all select-text selection:bg-[#ef5b25]/20">
                  {responseBodyFormatted}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Postman format preview */}
        {activeTab === "postman" && (
          <div className="space-y-3 font-mono text-[11px]">
            <div className="flex items-center justify-between">
              <h4 className="font-mono text-[10px] font-semibold text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-pink-400" /> Postman Schema Node
              </h4>
              <button
                type="button"
                onClick={() => handleCopyText(postmanItemFormatted, "postmanNode")}
                className="text-[#64748b] hover:text-[#ef5b25] flex items-center gap-1 font-bold text-xs"
              >
                {copiedSection === "postmanNode" ? (
                  <span className="text-emerald-400 flex items-center gap-0.5"><Check className="w-3 h-3" /> Copied!</span>
                ) : (
                  <><Copy className="w-3 h-3" /> Copy Node JSON</>
                )}
              </button>
            </div>

            <p className="text-[11px] text-[#64748b] leading-normal mb-2">
              This is the literal live structure that will be bundled into the Postman Collection JSON under the Collection item list. It converts URL components, formats parameters, and standardizes payload headers.
            </p>

            <div className="bg-[#0a0a0a] rounded border border-[#1e293b] p-3.5 max-h-80 overflow-auto custom-scrollbar">
              <pre className="text-pink-400 whitespace-pre font-mono leading-relaxed select-all select-text selection:bg-[#ef5b25]/20 text-[10px]">
                {postmanItemFormatted}
              </pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
