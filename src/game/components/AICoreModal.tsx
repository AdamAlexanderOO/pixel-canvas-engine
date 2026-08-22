import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Cpu, Activity, Zap, CheckCircle, AlertOctagon, Terminal } from 'lucide-react';
import { SimulationResult } from '../types';
import { sounds } from '../utils/soundEffects';

interface AICoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: SimulationResult | null;
  isLoading: boolean;
  onReSimulate: () => void;
}

export const AICoreModal: React.FC<AICoreModalProps> = ({
  isOpen,
  onClose,
  result,
  isLoading,
  onReSimulate,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="relative w-full max-w-2xl border border-white/20 bg-[#0A0A0A] p-5 sm:p-6 text-neutral-200 font-mono shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-red-500 animate-spin" style={{ animationDuration: '6s' }} />
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-wider text-white">
                  AURORA AI CORE // QUANTUM SIMULATION
                </h3>
                <span className="text-[10px] text-neutral-400">
                  GEMINI 3.7 FLASH DECK INTELLIGENCE
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                sounds.playClick(600);
                onClose();
              }}
              className="p-1.5 border border-white/20 bg-white/5 text-neutral-400 hover:text-white hover:border-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="my-4 space-y-4">
            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                <motion.div
                  animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="w-16 h-16 border-2 border-t-white border-r-red-600 border-b-white/20 border-l-transparent flex items-center justify-center"
                >
                  <Cpu className="w-7 h-7 text-white" />
                </motion.div>
                <div className="font-bold text-sm text-white tracking-widest animate-pulse">
                  CALCULATING QUANTUM HARMONICS...
                </div>
                <span className="text-xs text-neutral-400">
                  Synthesizing Light-Protocol traces & gear train kinematics
                </span>
              </div>
            ) : result ? (
              <>
                {/* Result Title & Protocol Summary */}
                <div className="p-3.5 border border-white/15 bg-white/5">
                  <div className="flex items-center justify-between text-xs text-red-500 font-bold mb-1">
                    <span>{result.output.title}</span>
                    <span className="text-neutral-400 font-normal">ID: {result.simulationId}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                    {result.output.description}
                  </p>
                </div>

                {/* Simulation Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  {Object.entries(result.output.metrics || {}).map(([key, val]) => (
                    <div key={key} className="p-2.5 border border-white/10 bg-white/5">
                      <div className="text-[9px] text-neutral-400 uppercase tracking-wider">{key}</div>
                      <div className="text-xs sm:text-sm font-extrabold text-white mt-0.5">{val}</div>
                    </div>
                  ))}
                </div>

                {/* Tactical Recommendation Directive */}
                {result.output.recommendation && (
                  <div className="p-3 border border-red-600/40 bg-red-950/20 flex items-start gap-2.5 text-xs text-red-400">
                    <Activity className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="tracking-wide text-white">TACTICAL DIRECTIVE:</strong>{' '}
                      <span>{result.output.recommendation}</span>
                    </div>
                  </div>
                )}

                {/* Chronological Simulation Events */}
                {result.output.events && result.output.events.length > 0 && (
                  <div className="p-3 border border-white/10 bg-neutral-950">
                    <div className="flex items-center gap-1 text-[10px] text-white font-bold mb-1.5">
                      <Terminal className="w-3 h-3 text-red-500" />
                      <span>SIMULATION TRACE EVENTS</span>
                    </div>
                    <ul className="space-y-1 text-[10px] text-neutral-300">
                      {result.output.events.map((evt, i) => (
                        <li key={i} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-red-500" />
                          <span>{evt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between pt-3 border-t border-white/10">
            <span className="text-[10px] text-neutral-400">
              STATUS: <span className="text-red-500 font-bold">SYNCHRONIZED</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sounds.playSimulatePulse();
                  onReSimulate();
                }}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3.5 py-1.5 border border-red-600 bg-red-950/40 text-red-400 hover:bg-red-950/60 active:scale-95 text-xs font-bold transition-all"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>RE-RUN PULSE</span>
              </button>
              <button
                onClick={() => {
                  sounds.playClick(640);
                  onClose();
                }}
                className="px-3.5 py-1.5 border border-white/20 bg-white/5 text-white hover:bg-white/15 text-xs font-bold transition-all"
              >
                DISMISS
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
