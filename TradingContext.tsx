import React, { createContext, useContext, useState } from 'react';
import { Instrument, instruments } from '@/data/instruments';

export type Position = {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  size: number;
  entry: number;
  sl: number;
  tp: number;
  openedAt: string;
};

export type Event = {
  id: string;
  title: string;
  detail: string;
  time: string;
  amount: number;
};

type Ctx = {
  selectedInstrument: Instrument;
  setSelectedInstrument: (i: Instrument) => void;
  selectedStrategy: string;
  setSelectedStrategy: (s: string) => void;
  selectedSession: string;
  setSelectedSession: (s: string) => void;
  selectedStyle: string;
  setSelectedStyle: (s: string) => void;
  consensusThreshold: number;
  setConsensusThreshold: (n: number) => void;
  positions: Position[];
  events: Event[];
  placePaperTrade: (side: 'BUY' | 'SELL', size: number, entry: number, sl: number, tp: number) => void;
  closePosition: (id: string) => void;
};

const TradingContext = createContext<Ctx | null>(null);

export function TradingProvider({ children }: { children: React.ReactNode }) {
  const defaultInstrument = instruments.find((x) => x.symbol === 'XAUUSD') ?? instruments[0];
  const [selectedInstrument, setSelectedInstrument] = useState(defaultInstrument);
  const [selectedStrategy, setSelectedStrategy] = useState('CRT Range Reversal');
  const [selectedSession, setSelectedSession] = useState('London');
  const [selectedStyle, setSelectedStyle] = useState('Day Trading');
  const [consensusThreshold, setConsensusThreshold] = useState(6);
  const [positions, setPositions] = useState<Position[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  const placePaperTrade = (side: 'BUY' | 'SELL', size: number, entry: number, sl: number, tp: number) => {
    if (!Number.isFinite(size) || size <= 0 || !Number.isFinite(entry) || !Number.isFinite(sl) || !Number.isFinite(tp)) {
      throw new Error('Invalid paper-trade parameters.');
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const position: Position = {
      id,
      symbol: selectedInstrument.symbol,
      side,
      size,
      entry,
      sl,
      tp,
      openedAt: new Date().toISOString(),
    };

    setPositions((current) => [position, ...current]);
    setEvents((current) => [
      {
        id: `open-${id}`,
        title: 'Position opened',
        detail: `${selectedInstrument.symbol} ${side} ${size} lots`,
        time: 'Just now',
        amount: 0,
      },
      ...current,
    ]);
  };

  const closePosition = (id: string) => {
    setPositions((current) => {
      const position = current.find((item) => item.id === id);
      if (!position) return current;

      setEvents((eventsCurrent) => [
        {
          id: `close-${id}-${Date.now()}`,
          title: 'Position closed',
          detail: `${position.symbol} ${position.side}`,
          time: 'Just now',
          amount: 0,
        },
        ...eventsCurrent,
      ]);

      return current.filter((item) => item.id !== id);
    });
  };

  return (
    <TradingContext.Provider
      value={{
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
        positions,
        events,
        placePaperTrade,
        closePosition,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
}

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) throw new Error('useTrading must be inside TradingProvider');
  return context;
};
