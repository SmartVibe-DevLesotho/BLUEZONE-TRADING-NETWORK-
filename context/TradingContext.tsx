import React, { createContext, useContext, useState } from 'react';
import { Instrument, instruments } from '@/instruments';

type TradingContextValue = {
  selectedInstrument: Instrument;
  setSelectedInstrument: (i: Instrument) => void;
  selectedStrategy: string;
  setSelectedStrategy: (v: string) => void;
  selectedSession: string;
  setSelectedSession: (v: string) => void;
  selectedStyle: string;
  setSelectedStyle: (v: string) => void;
  consensusThreshold: number;
  setConsensusThreshold: (v: number) => void;
};

const fallback = instruments.find(i => i.symbol === 'XAUUSD') ?? instruments[0];
const TradingContext = createContext<TradingContextValue | null>(null);

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const [selectedInstrument, setSelectedInstrument] = useState(fallback);
  const [selectedStrategy, setSelectedStrategy] = useState('CRT Range Reversal');
  const [selectedSession, setSelectedSession] = useState('London');
  const [selectedStyle, setSelectedStyle] = useState('Day Trading');
  const [consensusThreshold, setConsensusThreshold] = useState(6);

  return (
    <TradingContext.Provider value={{
      selectedInstrument,
      setSelectedInstrument,
      selectedStrategy,
      setSelectedStrategy,
      selectedSession,
      setSelectedSession,
      selectedStyle,
      setSelectedStyle,
      consensusThreshold,
      setConsensusThreshold,
    }}>
      {children}
    </TradingContext.Provider>
  );
}

export function useTrading() {
  const value = useContext(TradingContext);
  if (!value) throw new Error('useTrading must be used inside TradingProvider');
  return value;
}
