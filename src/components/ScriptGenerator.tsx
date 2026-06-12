import React, { useState } from "react";
import { Copy, Check, Terminal, Play, ArrowRight, Zap, Info } from "lucide-react";

export default function ScriptGenerator() {
  const [copied, setCopied] = useState<boolean>(false);

  const injectionScript = `/**
 * Developer Console Network Interceptor
 * Paste this snippet in your browser DevTools Console to capture network requests,
 * then run 'copyLogs()' to copy the resulting logs and paste them in the Exporter.
 */
(function() {
  if (window.__aistudio_network_capturer_active__) {
    console.warn("⚠️ Network interceptor is already running in this tab!");
    return;
  }
  window.__aistudio_network_capturer_active__ = true;

  const originalFetch = window.fetch;
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  const originalXHRSetHeader = XMLHttpRequest.prototype.setRequestHeader;

  const logs = [];

  console.clear();
  console.log(
    "%c🔌 Browser Network Interceptor Mock-Extension Loaded!",
    "color: #10B981; font-weight: bold; font-family: monospace; font-size: 15px; padding: 8px; background: #064E3B; border-radius: 4px;"
  );
  console.log(
    "%cInstructions:\\n1. Trigger API/Fetch actions in this tab\\n2. Enter copyLogs() in the console to copy the collection payload to clipboards\\n3. Paste inside AI Studio exporter.",
    "color: #38BDF8; font-family: monospace; font-weight: bold;"
  );

  // Hook Fetch
  window.fetch = async function(resource, init) {
    const started = Date.now();
    let url = "";
    if (typeof resource === "string") {
      url = resource;
    } else if (resource instanceof Request) {
      url = resource.url;
    } else {
      url = String(resource);
    }

    const method = (init && init.method) || "GET";
    const reqHeaders = {};
    if (init && init.headers) {
      new Headers(init.headers).forEach((v, k) => {
        reqHeaders[k] = v;
      });
    }

    let requestBody = undefined;
    if (init && init.body) {
      if (typeof init.body === "string") {
        requestBody = init.body;
      } else {
        requestBody = "[Complex/Binary Body]";
      }
    }

    try {
      const response = await originalFetch(resource, init);
      const elapsed = Date.now() - started;
      const clone = response.clone();
      let resText = "";
      try {
        resText = await clone.text();
      } catch {
        resText = "[Unable to extract body]";
      }

      const resHeaders = [];
      clone.headers.forEach((value, name) => {
        resHeaders.push({ name, value });
      });

      const logEntry = {
        _id: "captured-" + Math.random().toString(36).substr(2, 9),
        startedDateTime: new Date(started).toISOString(),
        time: elapsed,
        request: {
          method: method.toUpperCase(),
          url: url,
          headers: Object.entries(reqHeaders).map(([k, v]) => ({ name: k, value: String(v) })),
          queryString: Array.from(new URL(url, window.location.origin).searchParams.entries()).map(([k, v]) => ({ name: k, value: v })),
          postData: requestBody ? { mimeType: reqHeaders["content-type"] || "application/json", text: requestBody } : undefined
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: resHeaders,
          content: {
            mimeType: response.headers.get("content-type") || "text/plain",
            text: resText
          }
        }
      };

      logs.push(logEntry);
      console.log(\`%cCaptured: \${method.toUpperCase()} \${url.split('?')[0].substr(0, 60)}... [\${response.status}]\`, "color: #10B981; font-family: monospace;");
      return response;
    } catch (err) {
      const elapsed = Date.now() - started;
      const logEntry = {
        _id: "captured-err-" + Math.random().toString(36).substr(2, 9),
        startedDateTime: new Date(started).toISOString(),
        time: elapsed,
        request: {
          method: method.toUpperCase(),
          url: url,
          headers: Object.entries(reqHeaders).map(([k, v]) => ({ name: k, value: String(v) })),
          queryString: [],
          postData: requestBody ? { mimeType: reqHeaders["content-type"] || "", text: requestBody } : undefined
        },
        response: {
          status: 0,
          statusText: "Failed/CORS Error",
          headers: [],
          content: { mimeType: "text/plain", text: err.message || "Network request failed" }
        }
      };
      logs.push(logEntry);
      console.error(\`%cBlocked/Failed: \${method.toUpperCase()} \${url.substr(0, 60)}...\`, "color: #F43F5E; font-weight: bold; font-family: monospace;");
      throw err;
    }
  };

  // Guard to capture raw XHR payload
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._capture = {
      method: method,
      url: url,
      headers: [],
      startTime: Date.now()
    };
    return originalXHROpen.apply(this, [method, url, ...args]);
  };

  XMLHttpRequest.prototype.setRequestHeader = function(header, value) {
    if (this._capture) {
      this._capture.headers.push({ name: header, value: value });
    }
    return originalXHRSetHeader.apply(this, [header, value]);
  };

  XMLHttpRequest.prototype.send = function(body) {
    const xhr = this;
    if (xhr._capture) {
      xhr._capture.startTime = Date.now();
      if (body) {
        xhr._capture.body = typeof body === "string" ? body : "[Payload body]";
      }
      
      const onReadyState = function() {
        if (xhr.readyState === 4) {
          const duration = Date.now() - xhr._capture.startTime;
          let responseText = "";
          try {
            responseText = xhr.responseText;
          } catch {
            responseText = "[Binary/Parsed response]";
          }

          // Extract response headers
          const rawHeaders = xhr.getAllResponseHeaders() || "";
          const parsedHeaders = rawHeaders.split("\\r\\n").filter(Boolean).map(line => {
            const index = line.indexOf(":");
            if (index > -1) {
              return {
                name: line.substring(0, index).trim(),
                value: line.substring(index + 1).trim()
              };
            }
            return null;
          }).filter(Boolean);

          const contentType = xhr.getResponseHeader("content-type") || "text/plain";

          // Parse queries
          let queries = [];
          try {
            queries = Array.from(new URL(xhr._capture.url, window.location.origin).searchParams.entries()).map(([k, v]) => ({ name: k, value: v }));
          } catch {}

          const logEntry = {
            _id: "captured-xhr-" + Math.random().toString(36).substr(2, 9),
            startedDateTime: new Date(xhr._capture.startTime).toISOString(),
            time: duration,
            request: {
              method: xhr._capture.method.toUpperCase(),
              url: xhr._capture.url,
              headers: xhr._capture.headers,
              queryString: queries,
              postData: xhr._capture.body ? { mimeType: xhr._capture.headers.find(h => h.name.toLowerCase() === "content-type")?.value || "application/json", text: xhr._capture.body } : undefined
            },
            response: {
              status: xhr.status,
              statusText: xhr.statusText,
              headers: parsedHeaders,
              content: {
                mimeType: contentType,
                text: responseText
              }
            }
          };

          logs.push(logEntry);
          console.log(\`%cCaptured [XHR]: \${xhr._capture.method.toUpperCase()} \${xhr._capture.url.split('?')[0].substr(0, 60)}... [\${xhr.status}]\`, "color: #10B981; font-family: monospace;");
        }
      };

      if (xhr.addEventListener) {
        xhr.addEventListener("readystatechange", onReadyState, false);
      } else {
        const prev = xhr.onreadystatechange;
        xhr.onreadystatechange = function(...args) {
          onReadyState();
          if (prev) prev.apply(xhr, args);
        };
      }
    }
    return originalXHRSend.apply(this, [body]);
  };

  // Expose copying function to DevTools Clipboard!
  window.copyLogs = function() {
    try {
      const dataStr = JSON.stringify({ log: { version: "1.2", entries: logs } }, null, 2);
      
      // Attempt using modern copy or fallback to input hack
      if (typeof copy === "function") {
        copy(dataStr);
        console.log(\`%c✓ Success! Coerced \${logs.length} logged entries directly into DevTools clipboard. Paste it in the Postman Generator.\`, "color: #10B981; font-weight: bold; font-family: monospace;");
      } else {
        const el = document.createElement("textarea");
        el.value = dataStr;
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
        console.log(\`%c✓ Intercepted \${logs.length} entries. Copied via legacy fallback. Paste it in the Postman Generator Now!\`, "color: #10B981; font-weight: bold; font-family: monospace;");
      }
    } catch (e) {
      console.error("Clipboard failure: ", e);
      console.log("Please copy the log data manually by running: console.log(JSON.stringify({ log: { entries: window.__aistudio_logs }}))");
    }
  };
})();`;

  const handleCopy = () => {
    navigator.clipboard.writeText(injectionScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="console-injector" className="bg-[#111111] border border-[#1e293b] rounded-xl p-5 shadow-2xl flex flex-col h-full">
      <div className="flex items-center gap-2 mb-3">
        <Terminal className="w-5 h-5 text-[#ef5b25]" />
        <h3 className="font-mono text-sm font-semibold tracking-wider text-white">
          DEVTOOLS CONSOLE INJECTOR
        </h3>
      </div>

      <p className="text-xs text-[#94a3b8] mb-5 leading-relaxed font-sans">
        If you are working on another tab or testing an outside staging/production app, you do not need browser extensions! Paste this safe hooks receiver directly in the Devtools console, trigger your APIs, and instantly dump them for Postman format conversion.
      </p>

      {/* Guide steps */}
      <div className="space-y-4 mb-6">
        <div className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-[#1e293b] text-[#e2e8f0] flex items-center justify-center font-mono text-xs font-bold shrink-0 border border-[#334155]">
            1
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-0.5">Copy Interceptor Engine</h4>
            <p className="text-[11px] text-[#94a3b8]">Click the copy button below to load the code in your clipboard.</p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-[#1e293b] text-[#e2e8f0] flex items-center justify-center font-mono text-xs font-bold shrink-0 border border-[#334155]">
            2
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-0.5">Inject inside Target Tab</h4>
            <p className="text-[11px] text-[#94a3b8]">
              Open your desired website under test, press <kbd className="bg-[#1e293b] border border-[#334155] px-1 py-0.5 rounded text-[10px] text-[#e2e8f0] font-mono">F12</kbd> (or right click → Inspect), select the <strong className="text-indigo-400">Console</strong> tab, paste the code and press Enter.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="w-6 h-6 rounded-full bg-[#1e293b] text-[#e2e8f0] flex items-center justify-center font-mono text-xs font-bold shrink-0 border border-[#334155]">
            3
          </div>
          <div>
            <h4 className="text-xs font-bold text-white mb-0.5">Trigger Actions & Export</h4>
            <p className="text-[11px] text-[#94a3b8]">
              Interact with the target website. To retrieve all captured logs, type <code className="bg-emerald-950/40 text-emerald-400 px-1 py-0.2 border border-emerald-900/50 rounded font-mono text-[10px]">copyLogs()</code> and hit Enter. The formatted logs are saved back to your clipboard automatically!
            </p>
          </div>
        </div>
      </div>

      {/* Code panel with copy button */}
      <div className="flex-grow flex flex-col bg-[#0a0a0a] rounded-lg border border-[#1e293b] overflow-hidden min-h-[140px]">
        <div className="flex items-center justify-between px-3 py-2 bg-[#0d0d0d] border-b border-[#1e293b] text-[#64748b] text-[10px] font-mono">
          <span>network-interceptor-snippet.js</span>
          <button
            id="copy-script-btn"
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-[#ef5b25] hover:text-[#d94e1c] font-bold px-2 py-0.5 hover:bg-[#1e293b]/50 rounded transition shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-[#ef5b25]" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
        <div className="flex-grow p-3 font-mono text-[10px] text-[#94a3b8] whitespace-pre overflow-auto max-h-[180px] custom-scrollbar selection:bg-[#ef5b25]/20 leading-normal">
          {copied ? "/* Code currently loaded in clipboard */\n\n" : ""}{injectionScript}
        </div>
      </div>

      <div className="mt-4 flex gap-2 bg-[#1e293b]/20 border border-[#1e293b]/50 rounded-lg p-3 text-[11px] text-[#94a3b8]">
        <Zap className="w-4 h-4 text-[#ef5b25] shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          The code overrides <strong>fetch</strong> and <strong>XMLHttpRequest</strong> without affecting normal browser functionality or sending data to external database nodes.
        </p>
      </div>
    </div>
  );
}
