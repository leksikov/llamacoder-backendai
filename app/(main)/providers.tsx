"use client";

import { createContext, ReactNode, useState, useCallback } from "react";

export const Context = createContext<{
  streamPromise?: Promise<ReadableStream>;
  isStreaming: boolean;
  setStreamPromise: (v: Promise<ReadableStream> | undefined) => void;
  resetStream: () => void;
}>({
  isStreaming: false,
  setStreamPromise: () => {},
  resetStream: () => {},
});

export default function Providers({ children }: { children: ReactNode }) {
  const [streamPromise, setStreamPromiseState] = useState<Promise<ReadableStream>>();
  const [isStreaming, setIsStreaming] = useState(false);

  const setStreamPromise = useCallback((promise: Promise<ReadableStream> | undefined) => {
    setStreamPromiseState(promise);
    setIsStreaming(!!promise);
  }, []);

  const resetStream = useCallback(() => {
    setStreamPromiseState(undefined);
    setIsStreaming(false);
  }, []);

  return (
    <Context.Provider value={{ 
      streamPromise, 
      isStreaming,
      setStreamPromise, 
      resetStream 
    }}>
      {children}
    </Context.Provider>
  );
}
