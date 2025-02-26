"use client";

import { createContext, ReactNode, useState, useCallback } from "react";
import { assert } from "../../lib/assertions";

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
  assert(children !== undefined, 'Children must be provided');
  
  const [streamPromise, setStreamPromiseState] = useState<Promise<ReadableStream>>();
  const [isStreaming, setIsStreaming] = useState(false);

  const setStreamPromise = useCallback((promise: Promise<ReadableStream> | undefined) => {
    if (promise) {
      assert(promise instanceof Promise, 'Stream promise must be a Promise');
    }
    
    console.log('Stream promise state change:', {
      hasPromise: !!promise,
      currentIsStreaming: isStreaming,
      action: promise ? 'setting' : 'clearing'
    });
    
    if (!promise) {
      setStreamPromiseState(undefined);
      setIsStreaming(false);
    } else {
      setStreamPromiseState(promise);
      setIsStreaming(true);
    }
  }, [isStreaming]);

  const resetStream = useCallback(() => {
    console.log('Resetting stream state');
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
