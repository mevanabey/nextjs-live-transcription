"use client";

import {
  DeepgramClient,
  LiveClient,
  LiveTranscriptionEvents,
  LiveTranscriptionEvent,
  createClient,
} from "@deepgram/sdk";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  FunctionComponent,
} from "react";

interface DeepgramContextType {
  connection: LiveClient | null;
  connectToDeepgram: (options: Record<string, unknown>, endpoint?: string) => Promise<void>;
  disconnectFromDeepgram: () => void;
  connectionState: string;
}

const DeepgramContext = createContext<DeepgramContextType | undefined>(
  undefined
);

interface DeepgramContextProviderProps {
  children: ReactNode;
}

const getApiKey = async (): Promise<string> => {
  const response = await fetch("/api/authenticate", { cache: "no-store" });
  const result = await response.json();
  return result.key;
};

const DeepgramContextProvider: FunctionComponent<
  DeepgramContextProviderProps
> = ({ children }) => {
  const [connection, setConnection] = useState<LiveClient | null>(null);
  const [connectionState, setConnectionState] = useState<string>("CLOSED");

  /**
   * Connects to the Deepgram speech recognition service and sets up a live transcription session.
   *
   * @param options - The configuration options for the live transcription session.
   * @param endpoint - The optional endpoint URL for the Deepgram service.
   * @returns A Promise that resolves when the connection is established.
   */
  const connectToDeepgram = async (options: Record<string, unknown>, endpoint?: string) => {
    const key = await getApiKey();
    const deepgram = createClient(key || '3b817e3bea63c4ef15479384d108bd321cf601a3');

    const conn = deepgram.listen.live(options);

    conn.addListener(LiveTranscriptionEvents.Open, () => {
      setConnectionState("OPEN");
    });

    conn.addListener(LiveTranscriptionEvents.Close, () => {
      setConnectionState("CLOSED");
    });

    setConnection(conn);
  };

  const disconnectFromDeepgram = async () => {
    if (connection) {
      await connection.finish();
      setConnection(null);
    }
  };

  return (
    <DeepgramContext.Provider
      value={{
        connection,
        connectToDeepgram,
        disconnectFromDeepgram,
        connectionState,
      }}
    >
      {children}
    </DeepgramContext.Provider>
  );
};

function useDeepgram(): DeepgramContextType {
  const context = useContext(DeepgramContext);
  if (context === undefined) {
    throw new Error(
      "useDeepgram must be used within a DeepgramContextProvider"
    );
  }
  return context;
}

export {
  DeepgramContextProvider,
  useDeepgram,
  LiveTranscriptionEvents,
  type LiveTranscriptionEvent,
};
