import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Send, Trash2, Filter, Sparkles, Check, AlertCircle } from 'lucide-react';
import { TerminalLog } from '../types';
import { sounds } from '../utils/soundEffects';

interface TerminalArchiveViewProps {
  logs: TerminalLog[];
  onClearLogs: () => void;
  onExecuteCommand: (cmd: string) => void;
}

export const TerminalArchiveView: React.FC<TerminalArchiveViewProps> = ({
  logs,
  onClearLogs,
  onExecuteCommand,
}) => {
  const [commandInput, setCommandInput] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'SYSTEM' | 'LIGHT_PROTOCOL' | 'AI_SIM' | 'GEAR_DRIVE'>('ALL');
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter((l) => activeFilter === 'ALL' || l.source === activeFilter);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    sounds.playClick(900);
    onExecuteCommand(commandInput.trim());
    setCommandInput('');
  };

  return (
    <div id="terminal-diagnostics" className="border border-white/10 bg-[#0A0A0A] p-5 sm:p-6 text-neutral-200 font-mono space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-5 h-5 text-red-500" />
          <div>
            <h3 className="text-sm font-black tracking-wider text-white uppercase">
              TERMINAL LOG ARCHIVE // COMMAND REPL
            </h3>
            <span className="text-[10px] text-neutral-400">Direct kernel shell stream & system events</span>
          </div>
        </div>

        {/* Source filter buttons */}
        <div className="flex flex-wrap items-center gap-1">
          {(['ALL', 'SYSTEM', 'LIGHT_PROTOCOL', 'AI_SIM', 'GEAR_DRIVE'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => {
                sounds.playClick(600);
                setActiveFilter(filter);
              }}
              className={`px-2.5 py-1 text-[9px] font-bold tracking-wider uppercase border transition-all ${
                activeFilter === filter
                  ? 'bg-white text-black border-white'
                  : 'border-white/10 bg-white/5 text-neutral-400 hover:text-white'
              }`}
            >
              {filter.replace('_', ' ')}
            </button>
          ))}

          <button
            onClick={() => {
              sounds.playClick(400);
              onClearLogs();
            }}
            className="p-1 border border-white/10 bg-white/5 text-neutral-400 hover:text-red-500 hover:border-red-600 ml-2 transition-colors"
            title="Clear Terminal Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log Output Screen */}
      <div
        ref={scrollRef}
        className="h-64 sm:h-72 overflow-y-auto border border-white/10 bg-[#050505] p-3 space-y-1.5 text-xs select-text scrollbar-thin scrollbar-thumb-neutral-800"
      >
        {filteredLogs.length === 0 ? (
          <div className="text-neutral-600 text-center py-8">NO EVENT LOGS RECORDED</div>
        ) : (
          filteredLogs.map((log) => {
            const badgeColor =
              log.type === 'CRITICAL'
                ? 'text-red-500'
                : log.type === 'WARNING'
                ? 'text-amber-400'
                : log.type === 'SUCCESS'
                ? 'text-white font-bold'
                : 'text-neutral-400';

            return (
              <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
                <span className="text-[10px] text-neutral-500 shrink-0 font-mono">[{log.timestamp}]</span>
                <span className="text-[10px] text-red-500/80 font-bold shrink-0">[{log.source}]</span>
                <span className={`flex-1 ${badgeColor}`}>{log.message}</span>
              </div>
            );
          })
        )}
      </div>

      {/* CLI Command Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="flex-1 relative flex items-center border border-white/20 bg-white/5 px-3 py-2">
          <span className="text-red-500 font-bold mr-2 text-xs">SYS:~$</span>
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            placeholder="Type 'help', 'status', 'simulate', 'overclock', 'boost all', 'light cyan'..."
            className="w-full bg-transparent text-xs text-white placeholder-neutral-500 outline-none font-mono"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-white text-black font-bold uppercase tracking-wider text-xs hover:bg-neutral-200 transition-colors flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>EXEC</span>
        </button>
      </form>
    </div>
  );
};
