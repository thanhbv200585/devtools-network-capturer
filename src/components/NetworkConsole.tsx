import React, { useState, useMemo } from "react";
import { HAREntry } from "../types";
import { buildPostmanCollection } from "../utils/postman";
import {
  Search,
  Download,
  Trash2,
  RefreshCw,
  FolderTree,
  UploadCloud,
  FileCheck,
  AlertTriangle,
  Flame,
  CheckSquare,
  Square,
  ShieldCheck,
  CheckCircle,
  Clock,
  Layers,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface NetworkConsoleProps {
  entries: HAREntry[];
  selectedEntry: HAREntry | null;
  onSelectEntry: (entry: HAREntry) => void;
  onClearLog: () => void;
  onResetSample: () => void;
  onAddEntries: (newEntries: HAREntry[]) => void;
}

type FileTypeFilter = "all" | "xhr" | "doc" | "images" | "others";

export default function NetworkConsole({
  entries,
  selectedEntry,
  onSelectEntry,
  onClearLog,
  onResetSample,
  onAddEntries
}: NetworkConsoleProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [fileType, setFileType] = useState<FileTypeFilter>("all");
  const [methodFilters, setMethodFilters] = useState<Record<string, boolean>>({
    GET: true,
    POST: true,
    PUT: true,
    DELETE: true,
    PATCH: true
  });
  
  // Checking list states for multi-selection export
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  
  // Exporter Config states
  const [collectionName, setCollectionName] = useState<string>("Captured API Collection");
  const [groupingMode, setGroupingMode] = useState<"flat" | "domain" | "path">("domain");
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [rawPasteText, setRawPasteText] = useState<string>("");
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when entries list is changed (auto-select all newly loaded ones)
  React.useEffect(() => {
    const initialChecked: Record<string, boolean> = {};
    entries.forEach((e) => {
      initialChecked[e._id || ""] = true;
    });
    setSelectedIds(initialChecked);
  }, [entries]);

  // Extract unique methods present in entries for filters (dynamic)
  const availableMethods = useMemo(() => {
    const methods = new Set<string>();
    entries.forEach((e) => {
      if (e.request.method) {
        methods.add(e.request.method.toUpperCase());
      }
    });
    return Array.from(methods);
  }, [entries]);

  // Filter evaluation logic
  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      // 1. Search Query
      const urlText = entry.request.url.toLowerCase();
      const resText = (entry.response.content?.text || "").toLowerCase();
      const matchSearch = urlText.includes(searchTerm.toLowerCase()) || resText.includes(searchTerm.toLowerCase());
      
      if (!matchSearch) return false;

      // 2. Request Method
      const method = entry.request.method.toUpperCase();
      if (methodFilters[method] === false) return false;

      // 3. File content types
      const mime = (entry.response.content?.mimeType || "").toLowerCase();
      const reqMime = (entry.request.headers.find(h => h.name.toLowerCase() === "content-type")?.value || "").toLowerCase();
      
      if (fileType === "xhr") {
        const isXhr = mime.includes("json") || mime.includes("xml") || reqMime.includes("json") || entry.request.postData?.mimeType?.includes("json");
        if (!isXhr) return false;
      } else if (fileType === "doc") {
        if (!mime.includes("html")) return false;
      } else if (fileType === "images") {
        const isImg = mime.includes("image") || mime.includes("png") || mime.includes("jpg") || mime.includes("webp") || mime.includes("svg") || mime.includes("gif");
        if (!isImg) return false;
      } else if (fileType === "others") {
        const standardTypes = mime.includes("json") || mime.includes("xml") || mime.includes("html") || mime.includes("image") || mime.includes("png") || mime.includes("jpg") || mime.includes("webp") || mime.includes("svg") || mime.includes("gif");
        if (standardTypes) return false;
      }

      return true;
    });
  }, [entries, searchTerm, fileType, methodFilters]);

  // Bulk actions
  const toggleSelectAll = () => {
    const allChecked = filteredEntries.every((e) => selectedIds[e._id || ""]);
    const nextState = { ...selectedIds };
    filteredEntries.forEach((e) => {
      nextState[e._id || ""] = !allChecked;
    });
    setSelectedIds(nextState);
  };

  const handleToggleId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent selected file detail switch
    setSelectedIds({
      ...selectedIds,
      [id]: !selectedIds[id]
    });
  };

  const selectedExportEntries = useMemo(() => {
    return entries.filter((e) => selectedIds[e._id || ""]);
  }, [entries, selectedIds]);

  // Drag and Drop HAR handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const processHARText = (text: string) => {
    try {
      const parsed = JSON.parse(text);
      if (parsed.log && Array.isArray(parsed.log.entries)) {
        const mapped: HAREntry[] = parsed.log.entries.map((item: any, i: number) => ({
          ...item,
          _id: item._id || `har-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 5)}`
        }));
        onAddEntries(mapped);
        setErrorMsg(null);
        return true;
      } else if (Array.isArray(parsed)) {
        // Fallback for custom entries array list
        const mapped: HAREntry[] = parsed.map((item: any, i: number) => ({
          ...item,
          _id: item._id || `log-${Date.now()}-${i}`
        }));
        onAddEntries(mapped);
        setErrorMsg(null);
        return true;
      } else {
        setErrorMsg("Unrecognized data schema. Please make sure food is wrapped under standard 'log.entries' array.");
        return false;
      }
    } catch (err: any) {
      setErrorMsg(`JSON Parse Error: ${err.message || "Invalid syntax configuration"}`);
      return false;
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const text = loadEvent.target?.result as string;
        processHARText(text);
      };
      reader.readAsText(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const text = loadEvent.target?.result as string;
        processHARText(text);
      };
      reader.readAsText(file);
    }
  };

  // Raw JSON Paste execution handler
  const handlePasteSubmit = () => {
    if (!rawPasteText) return;
    const ok = processHARText(rawPasteText);
    if (ok) {
      setRawPasteText("");
      setShowPasteModal(false);
    }
  };

  // Postman export action
  const handleExportPostman = () => {
    if (selectedExportEntries.length === 0) return;
    
    const collection = buildPostmanCollection(
      selectedExportEntries,
      collectionName,
      groupingMode
    );

    const safeFileName = (collectionName || "postman_collection")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/__+/g, "_");

    // Standard memory-safe Blob generation
    const blob = new Blob([JSON.stringify(collection, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFileName}.postman_collection.json`;
    document.body.appendChild(link);
    link.click();
    
    // Cleanup reference
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper colors for method badges
  const getMethodBadgeClass = (m: string) => {
    const raw = m.toUpperCase();
    if (raw === "GET") return "bg-emerald-950/40 text-emerald-400 border border-emerald-900/50";
    if (raw === "POST") return "bg-amber-950/40 text-amber-400 border border-amber-900/50";
    if (raw === "PUT") return "bg-blue-950/40 text-blue-400 border border-blue-900/50";
    if (raw === "DELETE") return "bg-rose-950/40 text-rose-400 border border-rose-900/50";
    return "bg-slate-950 text-slate-350 border border-slate-850";
  };

  // Helper colors for status badges
  const getStatusBadgeClass = (status: number) => {
    if (status >= 200 && status < 300) return "text-emerald-400 font-bold bg-emerald-950/30 px-1.5 py-0.5 rounded";
    if (status >= 300 && status < 400) return "text-amber-400 bg-amber-950/30 px-1.5 py-0.5 rounded";
    if (status >= 400) return "text-rose-400 font-bold bg-rose-950/30 px-1.5 py-0.5 rounded animate-pulse";
    return "text-slate-500 bg-slate-950/50 px-1.5 py-0.5 rounded";
  };

  // Summary Metrics calculation
  const metrics = useMemo(() => {
    const total = entries.length;
    const successes = entries.filter((e) => e.response.status >= 200 && e.response.status < 300).length;
    const errors = entries.filter((e) => e.response.status >= 400 || e.response.status === 0).length;
    
    const uniqueDomains = new Set<string>();
    entries.forEach((e) => {
      try {
        uniqueDomains.add(new URL(e.request.url).hostname);
      } catch {}
    });

    return { total, successes, errors, domains: uniqueDomains.size };
  }, [entries]);

  return (
    <div id="network-console-widget" className="bg-[#111111] border border-[#1e293b] rounded-xl flex flex-col h-full shadow-2xl overflow-hidden">
      
      {/* Top action block: Quick load, HAR drag, clear commands */}
      <div className="p-3.5 bg-[#0d0d0d] border-b border-[#1e293b] flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-500" />
          <div>
            <h2 className="font-mono text-xs font-bold text-white tracking-wider">
              VIRTUAL NETWORK CONSOLE MONITOR
            </h2>
            <p className="text-[10px] text-[#64748b] font-mono tracking-tight mt-0.5">
              Parsed from local HAR imports, injection snippet paste or mock triggers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="paste-raw-json-btn"
            type="button"
            onClick={() => {
              setErrorMsg(null);
              setShowPasteModal(true);
            }}
            className="text-xs font-mono font-semibold bg-[#1e293b] hover:bg-[#2c3d52] text-[#e2e8f0] border border-[#334155] px-3 py-1.5 rounded flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Paste HAR Logs
          </button>
          
          <button
            id="reset-sample-btn"
            type="button"
            onClick={onResetSample}
            className="text-xs font-mono font-medium hover:bg-[#1e293b] text-[#94a3b8] hover:text-[#e2e8f0] px-2.5 py-1.5 rounded flex items-center gap-1 cursor-pointer border border-[#1e293b] transition"
            title="Reset to initial curated examples"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Samples
          </button>

          <button
            id="clear-logs-btn"
            type="button"
            onClick={onClearLog}
            className="text-xs font-mono font-medium hover:bg-rose-950/20 text-[#64748b] hover:text-rose-400 px-2.5 py-1.5 rounded flex items-center gap-1 cursor-pointer border border-[#1e293b] hover:border-rose-900/30 transition shadow-xs"
            title="Wipe network console data"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* DRAG AND DROP TARGET ZONE OVERLAY */}
      <div
        id="har-drop-target"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative transition-all duration-350 ${
          dragOver ? "p-8 bg-amber-950/20 border-2 border-dashed border-[#ef5b25] m-4 rounded-lg" : "p-0"
        }`}
      >
        {dragOver && (
          <div className="flex flex-col items-center justify-center py-6 text-center text-[#ef5b25] font-mono">
            <UploadCloud className="w-12 h-12 text-[#ef5b25] animate-bounce mb-2" />
            <span className="text-sm font-semibold">Drop HAR file to convert!</span>
            <span className="text-xs text-[#ef5b25]/70 mt-1">Accepts standard .har log dumps from Chrome DevTools</span>
          </div>
        )}

        {!dragOver && entries.length === 0 && (
          <div className="m-4 border border-dashed border-[#1e293b] bg-[#0a0a0a] p-10 rounded-lg flex flex-col items-center justify-center text-center">
            <UploadCloud className="w-12 h-12 text-[#475569] mb-3" />
            <h3 className="font-mono text-xs text-[#94a3b8] font-bold tracking-wider mb-1">
              NO NETWORK REQUESTS LOGGED
            </h3>
            <p className="text-[11px] text-[#64748b] max-w-md mx-auto mb-4 leading-relaxed font-sans">
              Drag & drop a browser Network HAR export file right here, paste raw clip board arrays, or trigger the Mock Request Sandbox widgets!
            </p>
            <div className="flex gap-2">
              <label className="text-[11px] font-mono font-semibold bg-[#ef5b25] hover:bg-[#d94e1c] text-white px-4 py-2 rounded shadow-sm cursor-pointer transition-colors duration-200">
                <input
                  type="file"
                  accept=".har,application/json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                Browse HAR File
              </label>
              <button
                type="button"
                onClick={onResetSample}
                className="text-[11px] font-mono font-semibold bg-[#1e293b] hover:bg-[#2c3d52] text-[#e2e8f0] px-4 py-2 border border-[#334155] rounded cursor-pointer transition"
              >
                Load Examples
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Metrics mini banner */}
      {entries.length > 0 && (
        <div id="metrics-bar" className="grid grid-cols-4 border-b border-[#1e293b] bg-[#0d0d0d] text-center py-2 font-mono text-[10px]">
          <div className="border-r border-[#1e293b]">
            <span className="block text-[#64748b] uppercase tracking-wider text-[9px] mb-0.5">Total logs</span>
            <strong className="text-[#e2e8f0] text-xs">{metrics.total}</strong>
          </div>
          <div className="border-r border-[#1e293b]">
            <span className="block text-[#64748b] uppercase tracking-wider text-[9px] mb-0.5">Successful</span>
            <strong className="text-emerald-400 text-xs">{metrics.successes}</strong>
          </div>
          <div className="border-r border-[#1e293b]">
            <span className="block text-[#64748b] uppercase tracking-wider text-[9px] mb-0.5">Errors</span>
            <strong className="text-rose-400 text-xs">{metrics.errors}</strong>
          </div>
          <div>
            <span className="block text-[#64748b] uppercase tracking-wider text-[9px] mb-0.5">Domains</span>
            <strong className="text-amber-500 text-xs">{metrics.domains}</strong>
          </div>
        </div>
      )}

      {/* Filters Area */}
      {entries.length > 0 && (
        <div id="filter-wrapper" className="p-3 bg-[#111111] border-b border-[#1e293b] space-y-2.5">
          {/* Row 1: Search & Content Type Pills */}
          <div className="flex gap-2 flex-wrap items-center justify-between">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#64748b]" />
              <input
                id="search-log-input"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter URL path or body text..."
                className="w-full bg-[#0a0a0a] text-xs text-[#e2e8f0] font-mono pl-8 pr-3 py-1.5 border border-[#1e293b] rounded focus:border-[#ef5b25]/60 focus:outline-none"
              />
            </div>

            {/* Type tabs filter */}
            <div className="flex bg-[#0a0a0a] p-0.5 rounded border border-[#1e293b] gap-0.5 font-mono text-[10px]">
              {([
                { key: "all", label: "All" },
                { key: "xhr", label: "Fetch/XHR" },
                { key: "doc", label: "Doc" },
                { key: "images", label: "Images" },
                { key: "others", label: "Other" }
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  id={`filter-type-${tab.key}`}
                  type="button"
                  onClick={() => setFileType(tab.key)}
                  className={`px-2.5 py-1 rounded-sm text-[10px] font-medium transition cursor-pointer ${
                    fileType === tab.key
                      ? "bg-[#ef5b25] text-white font-semibold shadow-sm"
                      : "text-[#64748b] hover:text-[#e2e8f0]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Method Multi-select checks */}
          {availableMethods.length > 0 && (
            <div className="flex items-center gap-3 bg-[#0a0a0a] px-2 py-1.5 rounded border border-[#1e293b]">
              <span className="text-[10px] font-mono text-[#64748b] uppercase tracking-wider font-medium shrink-0">Methods:</span>
              <div className="flex flex-wrap gap-3 font-mono text-[11px]">
                {availableMethods.map((method) => (
                  <label key={method} className="flex items-center gap-1.5 text-[#94a3b8] hover:text-[#e2e8f0] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={methodFilters[method] !== false}
                      onChange={() => {
                        setMethodFilters({
                          ...methodFilters,
                          [method]: methodFilters[method] === false ? true : false
                        });
                      }}
                      className="accent-[#ef5b25] h-3 w-3 rounded text-[#ef5b25] focus:ring-0"
                    />
                    <span className="font-bold">{method}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* REQUESTS LIST GRID VIEW */}
      <div id="request-list-con" className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0a0a]/20">
        {entries.length > 0 && filteredEntries.length === 0 ? (
          <div className="p-12 text-center text-[#64748b] font-mono text-[11px]">
            <AlertTriangle className="w-8 h-8 text-amber-500/80 mx-auto mb-2" />
            No logged requests match your active search filters.
          </div>
        ) : entries.length > 0 ? (
          <div className="relative">
            {/* Header Labels row */}
            <div className="grid grid-cols-12 gap-1.5 px-3 py-1.5 bg-[#0d0d0d] border-b border-[#1e293b] text-[#64748b] text-[10px] font-mono font-medium uppercase tracking-wider sticky top-0 z-10">
              <div className="col-span-1 flex items-center justify-center">
                <button
                  id="bulk-toggle-select-all"
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[#64748b] hover:text-[#e2e8f0] cursor-pointer cursor-pointers"
                  title="Toggle all filtered entries selection"
                >
                  {filteredEntries.every((e) => selectedIds[e._id || ""]) ? (
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="col-span-1.5">Status</div>
              <div className="col-span-1.5">Method</div>
              <div className="col-span-6">Request URL Name</div>
              <div className="col-span-1 text-right">Time</div>
              <div className="col-span-1 text-right">Size</div>
            </div>

            {/* List Rows */}
            <div className="divide-y divide-[#1e293b]/50 font-mono text-[11px]">
              <AnimatePresence initial={false}>
                {filteredEntries.map((entry) => {
                  const isChecked = !!selectedIds[entry._id || ""];
                  const isSelected = selectedEntry?._id === entry._id;
                  
                  // Extract pretty domain vs path
                  let domain = "";
                  let pathname = entry.request.url;
                  try {
                    const u = new URL(entry.request.url);
                    domain = u.hostname;
                    pathname = u.pathname + u.search;
                  } catch {}

                  const totalBytesResponse = entry.response.content?.size || entry.response.content?.text?.length || 0;
                  const formatSize = (bytes: number) => {
                    if (bytes === 0) return "0 B";
                    if (bytes < 1024) return `${bytes} B`;
                    return `${(bytes / 1024).toFixed(1)} KB`;
                  };

                  return (
                    <motion.div
                      key={entry._id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, height: 0 }}
                      onClick={() => onSelectEntry(entry)}
                      className={`grid grid-cols-12 gap-1.5 px-3 py-2.5 items-center cursor-pointer transition border-l-2 select-text selection:bg-[#ef5b25]/20 ${
                        isSelected
                          ? "bg-[#1e293b] border-l-[#ef5b25] text-white"
                          : "hover:bg-[#111111]/60 border-l-transparent text-[#e2e8f0]"
                      }`}
                    >
                      {/* Checkbox */}
                      <div className="col-span-1 flex items-center justify-center">
                        <button
                          id={`select-row-${entry._id}`}
                          type="button"
                          onClick={(e) => handleToggleId(entry._id || "", e)}
                          className="text-[#64748b] hover:text-[#e2e8f0] p-1 rounded transition"
                        >
                          {isChecked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-[#ef5b25]" />
                          ) : (
                            <Square className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      {/* Status */}
                      <div className="col-span-1.5 flex items-center">
                        <span className={getStatusBadgeClass(entry.response.status)}>
                          {entry.response.status === 0 ? "failed" : entry.response.status}
                        </span>
                      </div>

                      {/* Method */}
                      <div className="col-span-1.5">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getMethodBadgeClass(entry.request.method)}`}>
                          {entry.request.method}
                        </span>
                      </div>

                      {/* URL / Path */}
                      <div className="col-span-6 truncate pr-2">
                        {domain && (
                          <span className="text-[#64748b] mr-1 select-all">{domain}</span>
                        )}
                        <span className={`${isSelected ? "text-white" : "text-[#e2e8f0]"} font-medium select-all`}>
                          {pathname}
                        </span>
                      </div>

                      {/* Timing */}
                      <div className="col-span-1 text-right text-[#64748b]">
                        {entry.time}ms
                      </div>

                      {/* Size */}
                      <div className="col-span-1 text-right text-[#64748b] pr-1 truncate">
                        {formatSize(totalBytesResponse)}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        ) : null}
      </div>

      {/* EXPORTER CONTROL ACCORDION / BOX (Static Bottom Bar) */}
      {entries.length > 0 && (
        <div id="export-controls" className="p-3.5 bg-[#0d0d0d] border-t border-[#1e293b] space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left side parameters */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono text-[#64748b] uppercase tracking-wider mb-1.5">
                  Collection Name
                </label>
                <input
                  id="collection-name-input"
                  type="text"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                  placeholder="DevTools Captured Logs"
                  className="w-full bg-[#0a0a0a] border border-[#1e293b] focus:border-[#ef5b25]/60 focus:outline-none rounded px-2.5 py-1 text-xs font-mono text-[#e2e8f0]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-[#64748b] uppercase tracking-wider mb-1.5">
                  Request Folder Grouping
                </label>
                <div className="flex bg-[#0a0a0a] rounded border border-[#1e293b] p-0.5 font-mono text-[11px] h-7 items-center">
                  <button
                    id="grouping-flat-btn"
                    type="button"
                    onClick={() => setGroupingMode("flat")}
                    className={`flex-1 text-center text-[10px] py-1 rounded transition cursor-pointer ${
                      groupingMode === "flat" ? "bg-[#1e293b] text-amber-400 font-bold" : "text-[#64748b]"
                    }`}
                    title="No folders inside Postman collection"
                  >
                    Flat List
                  </button>
                  <button
                    id="grouping-domain-btn"
                    type="button"
                    onClick={() => setGroupingMode("domain")}
                    className={`flex-1 text-center text-[10px] py-1 rounded transition cursor-pointer ${
                      groupingMode === "domain" ? "bg-[#1e293b] text-amber-400 font-bold" : "text-[#64748b]"
                    }`}
                    title="Group items by Web server hostname"
                  >
                    By Domain
                  </button>
                  <button
                    id="grouping-path-btn"
                    type="button"
                    onClick={() => setGroupingMode("path")}
                    className={`flex-1 text-center text-[10px] py-1 rounded transition cursor-pointer ${
                      groupingMode === "path" ? "bg-[#1e293b] text-amber-400 font-bold" : "text-[#64748b]"
                    }`}
                    title="Group by host then by first subfolder path segment"
                  >
                    Nested Path
                  </button>
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <div className="text-[10px] font-mono text-[#64748b] mb-1">
                  Selected checklist items:
                </div>
                <div id="selection-stats" className="text-emerald-400 font-mono text-xs font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {selectedExportEntries.length} of {entries.length} ready
                </div>
              </div>
            </div>

            {/* Right side download action button */}
            <div className="shrink-0 flex items-center">
              <button
                id="export-postman-btn"
                type="button"
                onClick={handleExportPostman}
                disabled={selectedExportEntries.length === 0}
                className="w-full md:w-auto bg-[#ef5b25] hover:bg-[#d94e1c] disabled:bg-[#1e293b] disabled:text-[#475569] border border-[#ef5b25] hover:border-[#ef5b25] disabled:border-[#1e293b] shadow-md shadow-[#ef5b25]/10 flex items-center justify-center gap-2 px-5 py-2.5 rounded font-sans text-xs font-bold uppercase tracking-wider text-white transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 text-white" />
                Assemble Postman Collection (v2.1)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASTE HAR CODES DIALOG / MODAL */}
      <AnimatePresence>
        {showPasteModal && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111111] border border-[#1e293b] rounded-xl p-5 max-w-2xl w-full shadow-2xl flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-mono text-sm font-semibold tracking-wider text-white">
                  PASTE CHROMEDEVTOOLS CAPTURED JSON LOGS
                </h3>
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="text-[#64748b] hover:text-[#e2e8f0] p-1 rounded hover:bg-[#1e293b] transition cursor-pointer"
                >
                  Close
                </button>
              </div>

              <p className="text-xs text-[#94a3b8] mb-3 leading-relaxed">
                Paste the copied output from running <code className="bg-emerald-950/40 text-emerald-400 px-1 py-0.2">copyLogs()</code> via our console injection snippet, or paste raw contents of standard exported browser <code>.har</code> JSON logs.
              </p>

              {errorMsg && (
                <div className="mb-3 bg-rose-950/40 border border-rose-900/40 p-2.5 rounded text-rose-300 font-mono text-[11px] leading-tight">
                  🚨 {errorMsg}
                </div>
              )}

              <div className="flex-1 min-h-[200px] mb-4">
                <textarea
                  id="raw-paste-textarea"
                  value={rawPasteText}
                  onChange={(e) => setRawPasteText(e.target.value)}
                  placeholder='Paste your captured JSON here... e.g. { "log": { "entries": [...] } }'
                  className="w-full h-full bg-[#0a0a0a] text-[#ef5b25]/90 font-mono text-[11px] p-3 border border-[#1e293b] rounded focus:border-[#ef5b25]/70 focus:outline-none resize-none custom-scrollbar"
                />
              </div>

              <div className="flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPasteModal(false)}
                  className="text-xs font-mono text-[#64748b] hover:bg-[#1e293b] px-3 py-1.5 rounded cursor-pointer transition border border-transparent hover:border-[#1e293b]"
                >
                  Cancel
                </button>
                <button
                  id="submit-paste-btn"
                  type="button"
                  onClick={handlePasteSubmit}
                  disabled={!rawPasteText}
                  className="text-xs font-mono font-bold uppercase tracking-wider bg-[#ef5b25] hover:bg-[#d94e1c] disabled:bg-[#1e293b] disabled:text-[#475569] text-white px-4 py-1.5 rounded shadow cursor-pointer transition duration-200"
                >
                  Validate & Parse Logs
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
