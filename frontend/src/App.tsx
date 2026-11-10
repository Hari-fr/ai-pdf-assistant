import React, { useState, useRef, useEffect } from "react";
import { 
  Upload, 
  Send, 
  Bot, 
  User, 
  FileText, 
  Sparkles, 
  Trash2, 
  Copy, 
  Check, 
  X,
  FileCheck,
  ChevronRight,
  Database
} from "lucide-react";

interface Message {
  type: "user" | "assistant";
  text: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  "Summarize the main points of this document.",
  "What are the key conclusions or findings?",
  "List any tables, metrics, or statistics mentioned.",
  "What are the main recommendations or next steps?"
];

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [activeFileName, setActiveFileName] = useState<string | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [chunkCount, setChunkCount] = useState<number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAsking]);

  const handleFileSelect = (selectedFile: File | null) => {
    if (selectedFile && selectedFile.type === "application/pdf") {
      setFile(selectedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/upload-pdf/", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setActiveFileName(file.name);
        setChunkCount(data.chunks_count || 5);
        setMessages((prev) => [
          ...prev,
          {
            type: "assistant",
            text: `Document **"${file.name}"** has been parsed and stored in ChromaDB vector space. What would you like to explore?`,
            timestamp: new Date(),
          },
        ]);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          text: "Failed to connect to backend server. Make sure `uvicorn main:app --reload` is running on http://localhost:8000.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAsk = async (customQuestion?: string) => {
    const q = (customQuestion || question).trim();
    if (!q || isAsking) return;

    setIsAsking(true);
    const userMessage: Message = { type: "user", text: q, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    if (!customQuestion) setQuestion("");

    try {
      const response = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [
          ...prev,
          { type: "assistant", text: data.answer, timestamp: new Date() },
        ]);
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (err) {
      console.error("Ask error:", err);
      setMessages((prev) => [
        ...prev,
        {
          type: "assistant",
          text: "Error contacting LLM. Please make sure Ollama is running and your model is pulled.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clearChat = () => {
    setMessages([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Light formatting helper for bullet points and bold text
  const renderFormattedText = (content: string) => {
    const lines = content.split("\n");
    return lines.map((line, lIdx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g);
      const renderedLine = parts.map((part, pIdx) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={pIdx} className="font-semibold text-indigo-300">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return part;
      });

      if (line.trim().startsWith("- ") || line.trim().startsWith("* ") || line.trim().startsWith("• ")) {
        return (
          <div key={lIdx} className="flex items-start gap-2.5 my-1.5 pl-1">
            <span className="text-indigo-400 font-bold select-none">•</span>
            <span className="flex-1">{renderedLine}</span>
          </div>
        );
      }

      return (
        <p key={lIdx} className="my-1.5 leading-relaxed">
          {renderedLine}
        </p>
      );
    });
  };

  return (
    <div className="relative min-h-screen bg-[#06070a] text-slate-100 font-sans overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Dynamic Animated Ambient Background Glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-32 -left-32 w-[34rem] h-[34rem] bg-indigo-600/15 rounded-full blur-[140px] animate-float-1" />
        <div className="absolute top-1/3 -right-32 w-[32rem] h-[32rem] bg-purple-600/12 rounded-full blur-[150px] animate-float-2" />
        <div className="absolute -bottom-40 left-1/4 w-[36rem] h-[36rem] bg-cyan-600/10 rounded-full blur-[160px] animate-float-3" />
        
        {/* Subtle dot mesh background */}
        <div 
          className="absolute inset-0 opacity-[0.04]" 
          style={{
            backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)",
            backgroundSize: "28px 28px"
          }} 
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col min-h-screen">
        {/* Header Navbar */}
        <header className="flex flex-col sm:flex-row items-center justify-between pb-6 mb-6 border-b border-white/[0.08] gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 p-[1.5px] shadow-lg shadow-indigo-500/25">
              <div className="w-full h-full bg-[#0b0e17] rounded-[14.5px] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
                  AI PDF Assistant
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  RAG System
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                ChromaDB Vector Retrieval • Local Ollama Intelligence
              </p>
            </div>
          </div>

          {/* Right Header Status Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-white/[0.08] text-xs text-slate-300 shadow-sm backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-medium">System Online</span>
            </div>
            {messages.length > 0 && (
              <button
                onClick={clearChat}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/60 hover:bg-red-500/10 text-slate-400 hover:text-red-400 border border-white/[0.06] hover:border-red-500/25 text-xs transition-all duration-200 cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Chat</span>
              </button>
            )}
          </div>
        </header>

        {/* Main Workspace Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          
          {/* Left Column: Document Source & Quick Prompts */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Upload Panel */}
            <div className="glass-panel p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  Document Source
                </h2>
                <span className="text-[11px] text-slate-400 bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.05]">
                  PDF only
                </span>
              </div>

              {/* Drag & Drop Area */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-300 cursor-pointer ${
                  isDragging
                    ? "border-indigo-400 bg-indigo-500/15 scale-[1.02]"
                    : "border-white/[0.12] hover:border-indigo-500/50 bg-white/[0.02] hover:bg-slate-800/40"
                }`}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  className="hidden"
                  id="pdf-upload-input"
                  disabled={isUploading}
                />
                <label htmlFor="pdf-upload-input" className="cursor-pointer block">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-medium text-slate-200">
                    <span className="text-indigo-400 font-semibold hover:underline">Choose a PDF</span> or drop here
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5">Extracts text and table structures automatically</p>
                </label>
              </div>

              {/* Selected File Details */}
              {file && (
                <div className="mt-4 p-3 rounded-xl bg-slate-900/90 border border-indigo-500/30 flex items-center justify-between gap-2 animate-fadeIn">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-300 shrink-0">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-xs font-semibold text-slate-200 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFile(null)}
                    disabled={isUploading}
                    className="p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className={`w-full mt-4 py-3 px-4 rounded-xl font-medium text-sm flex items-center justify-center gap-2 cursor-pointer ${
                  !file || isUploading
                    ? "bg-slate-800 text-slate-500 border border-white/[0.04] cursor-not-allowed"
                    : "btn-primary"
                }`}
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Parsing & Embedding...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Process & Embed PDF</span>
                  </>
                )}
              </button>

              {/* Active Document Info */}
              {activeFileName && (
                <div className="mt-4 pt-3.5 border-t border-white/[0.06] text-xs text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    Indexed Document:
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-slate-200 truncate max-w-[130px]">{activeFileName}</span>
                    {chunkCount && (
                      <span className="text-[10px] bg-indigo-500/15 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20">
                        {chunkCount} chunks
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompts Panel */}
            <div className="glass-panel p-5 sm:p-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Suggested Inquiries
              </h3>
              <div className="flex flex-col gap-2.5">
                {SUGGESTED_QUESTIONS.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAsk(suggestion)}
                    disabled={isAsking}
                    className="prompt-chip group cursor-pointer"
                  >
                    <span className="truncate pr-2">{suggestion}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Chat Feed & Query Box */}
          <div className="lg:col-span-8 flex flex-col h-[650px] glass-panel overflow-hidden">
            
            {/* Top Bar inside Chat */}
            <div className="px-5 py-3 border-b border-white/[0.06] bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span>Conversation</span>
              </span>
              <span className="text-[11px] text-slate-500">
                {messages.length} message{messages.length === 1 ? "" : "s"}
              </span>
            </div>

            {/* Chat Messages Feed */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 custom-scrollbar"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400 shadow-lg shadow-indigo-500/10 animate-float-1">
                    <Bot className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-200 mb-1">
                    Ask Anything About Your Document
                  </h3>
                  <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                    Upload a PDF to embed chunks into ChromaDB, or click any suggested prompt to query the indexed vector space.
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 animate-fadeIn ${
                      msg.type === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                        msg.type === "user"
                          ? "bg-gradient-to-tr from-indigo-500 to-purple-600 text-white"
                          : "bg-slate-800/90 border border-white/[0.1] text-indigo-400"
                      }`}
                    >
                      {msg.type === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Message Bubble Container */}
                    <div
                      className={`relative group max-w-[85%] sm:max-w-[80%] flex flex-col ${
                        msg.type === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={
                          msg.type === "user"
                            ? "chat-bubble-user"
                            : "chat-bubble-bot"
                        }
                      >
                        {msg.type === "assistant"
                          ? renderFormattedText(msg.text)
                          : <p className="leading-relaxed m-0">{msg.text}</p>
                        }
                      </div>

                      {/* Footer: Timestamp & Action Buttons */}
                      <div className="flex items-center gap-2.5 mt-1.5 px-1 text-[10px] text-slate-500">
                        <span>{formatTime(msg.timestamp)}</span>
                        {msg.type === "assistant" && (
                          <button
                            onClick={() => handleCopy(msg.text, idx)}
                            className="opacity-0 group-hover:opacity-100 hover:text-slate-300 transition-opacity flex items-center gap-1 cursor-pointer"
                            title="Copy response"
                          >
                            {copiedIndex === idx ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Assistant Thinking / Loading Indicator */}
              {isAsking && (
                <div className="flex items-start gap-3 animate-fadeIn">
                  <div className="w-8 h-8 rounded-xl bg-slate-800/90 border border-white/[0.1] text-indigo-400 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="chat-bubble-bot flex items-center gap-2.5 py-3">
                    <div className="flex items-center gap-1.5 px-0.5">
                      <div className="w-2 h-2 rounded-full bg-indigo-400 wave-dot-1" />
                      <div className="w-2 h-2 rounded-full bg-purple-400 wave-dot-2" />
                      <div className="w-2 h-2 rounded-full bg-cyan-400 wave-dot-3" />
                    </div>
                    <span className="text-xs text-slate-400">Querying vector space & Ollama...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 bg-slate-900/50 border-t border-white/[0.06]">
              <div className="flex items-center gap-2.5 bg-slate-950/70 border border-white/[0.1] focus-within:border-indigo-500/60 focus-within:ring-2 focus-within:ring-indigo-500/20 rounded-xl px-4 py-2 transition-all">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAsk();
                    }
                  }}
                  placeholder="Ask a question about the document..."
                  disabled={isAsking}
                  className="w-full bg-transparent border-0 outline-none text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 py-1"
                />
                <button
                  onClick={() => handleAsk()}
                  disabled={!question.trim() || isAsking}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    !question.trim() || isAsking
                      ? "text-slate-600 cursor-not-allowed"
                      : "btn-primary hover:scale-105 active:scale-95"
                  }`}
                  title="Send question (Enter)"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
