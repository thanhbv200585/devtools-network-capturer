import React, { useState, useEffect } from "react";
import { HAREntry } from "./types";
import { sampleHAREntries } from "./components/SampleData";
import NetworkConsole from "./components/NetworkConsole";
import RequestDetailViewer from "./components/RequestDetailViewer";
import SandboxedRequester from "./components/SandboxedRequester";
import ScriptGenerator from "./components/ScriptGenerator";
import { Terminal, Lightbulb, Zap, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [entries, setEntries] = useState<HAREntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<HAREntry | null>(null);
  const [leftTab, setLeftTab] = useState<"sandbox" | "script">("sandbox");

  // Load sample entries on startup to prevent cold-starts and demonstrate rich layout immediately
  useEffect(() => {
    setEntries(sampleHAREntries);
    if (sampleHAREntries.length > 0) {
      setSelectedEntry(sampleHAREntries[0]);
    }
  }, []);

  const handleCaptureRequest = (newEntry: HAREntry) => {
    // Prepend newly captured request to the logs list
    setEntries((prev) => [newEntry, ...prev]);
    // Auto-focus on the newly created request log
    setSelectedEntry(newEntry);
  };

  const handleAddEntries = (newEntries: HAREntry[]) => {
    // Bulk append imported entries
    setEntries((prev) => [...newEntries, ...prev]);
    if (newEntries.length > 0) {
      setSelectedEntry(newEntries[0]);
    }
  };

  const handleClearLog = () => {
    setEntries([]);
    setSelectedEntry(null);
  };

  const handleResetSample = () => {
    setEntries(sampleHAREntries);
    if (sampleHAREntries.length > 0) {
      setSelectedEntry(sampleHAREntries[0]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e2e8f0] flex flex-col font-sans select-none overflow-hidden">
      
      {/* Premium Top Navigation header -- Human-centric description, matches Elegant Dark design */}
      <header id="site-header" className="h-14 border-b border-[#1e293b] bg-[#111111] px-5 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#3b82f6] rounded flex items-center justify-center shadow-sm">
            <Terminal className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5 font-mono">
              Postman <span className="text-[#64748b] font-normal font-sans">Capture & Intercept Tool</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#1e293b] px-3 py-1 rounded border border-[#334155] font-mono text-[10px]">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse"></div>
            <span className="text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wider">Recording Console</span>
          </div>
        </div>
      </header>

      {/* Main split interactive board */}
      <main id="main-workbench" className="flex-1 flex flex-col lg:flex-row overflow-hidden p-3.5 gap-3.5">
        
        {/* Left Side Control Panel Column: Contains Injector & Sandbox controls */}
        <div className="w-full lg:w-[410px] shrink-0 flex flex-col h-full overflow-hidden gap-3">
          
          {/* Custom navigation tabs for inputs */}
          <div className="bg-[#111111] border border-[#1e293b] p-1 rounded-lg flex gap-1 shrink-0">
            <button
              id="left-tab-sandbox-btn"
              type="button"
              onClick={() => setLeftTab("sandbox")}
              className={`flex-1 py-1.5 rounded-md font-mono text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                leftTab === "sandbox"
                  ? "bg-[#1e293b] text-emerald-400 border border-[#334155] shadow-xs"
                  : "text-[#64748b] hover:text-[#e2e8f0]"
              }`}
            >
              Request Sandbox
            </button>
            <button
              id="left-tab-script-btn"
              type="button"
              onClick={() => setLeftTab("script")}
              className={`flex-1 py-1.5 rounded-md font-mono text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                leftTab === "script"
                  ? "bg-[#1e293b] text-indigo-400 border border-[#334155] shadow-xs"
                  : "text-[#64748b] hover:text-[#e2e8f0]"
              }`}
            >
              Console Injector
            </button>
          </div>

          {/* Active Tab Panel Node */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              {leftTab === "sandbox" ? (
                <motion.div
                  key="sandbox"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.12 }}
                >
                  <SandboxedRequester onCaptureRequest={handleCaptureRequest} />
                </motion.div>
              ) : (
                <motion.div
                  key="script"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  transition={{ duration: 0.12 }}
                >
                  <ScriptGenerator />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Humble design tutorial footer */}
          <div className="bg-[#0d0d0d] border border-[#1e293b] rounded-lg p-3 text-[11px] text-[#94a3b8] shrink-0 leading-relaxed font-sans">
            <div className="flex gap-2.5 items-start">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[#e2e8f0] font-bold uppercase block text-[10px] tracking-wide mb-1">PRO-TIP: HAR EXPORTS WITH RESPONSES</span>
                Browser Network Devtools allows you to <strong className="text-[#e2e8f0]">Save all as HAR with Content</strong> to bundle full payload variables into your Postman collection export!
              </div>
            </div>
          </div>
        </div>

        {/* Right Area Workspace Column: Network Console Log & Interactive Detail Viewer Panel */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-3.5 h-full relative">
          
          {/* Main Network virtual monitor */}
          <div className="flex-1 h-full min-w-0">
            <NetworkConsole
              entries={entries}
              selectedEntry={selectedEntry}
              onSelectEntry={setSelectedEntry}
              onClearLog={handleClearLog}
              onResetSample={handleResetSample}
              onAddEntries={handleAddEntries}
            />
          </div>

          {/* Side Inspector detail tray */}
          <AnimatePresence>
            {selectedEntry && (
              <motion.div
                key="inspector-panel"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "100%", maxWidth: "520px" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ type: "tween", duration: 0.18 }}
                className="w-full lg:w-auto h-full lg:max-w-[520px] shrink-0 z-20"
              >
                <RequestDetailViewer
                  entry={selectedEntry}
                  onClose={() => setSelectedEntry(null)}
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
