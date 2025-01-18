"use client";

import { createMessage } from "@/app/(main)/actions";
import LogoSmall from "@/components/icons/logo-small";
import { splitByFirstCodeFence } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, use, useEffect, useRef, useState } from "react";
import ChatBox from "./chat-box";
import ChatLog from "./chat-log";
import CodeViewer from "./code-viewer";
import CodeViewerLayout from "./code-viewer-layout";
import type { Chat } from "./page";
import { Context } from "../../providers";

async function* readStreamByChunks(stream: ReadableStream) {
  const reader = stream.getReader();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += new TextDecoder().decode(value);
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line in buffer
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(5).trim();
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed?.choices?.[0]?.delta?.content) {
              yield parsed.choices[0].delta.content;
            }
          } catch (e) {
            console.warn('Skipping malformed JSON:', e);
            // If JSON parsing fails, try to extract content directly if it matches expected format
            const contentMatch = data.match(/"content":\s*"([^"]*)"/)
            if (contentMatch) {
              yield contentMatch[1];
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Stream reading error:', e);
  } finally {
    reader.releaseLock();
  }
}

export default function PageClient({ chat }: { chat: Chat }) {
  const context = use(Context);
  const [streamPromise, setStreamPromise] = useState<
    Promise<ReadableStream> | undefined
  >(context.streamPromise);
  const [streamText, setStreamText] = useState("");
  const [isShowingCodeViewer, setIsShowingCodeViewer] = useState(
    chat.messages.some((m) => m.role === "assistant"),
  );
  const [activeTab, setActiveTab] = useState<"code" | "preview">("preview");
  const router = useRouter();
  const isHandlingStreamRef = useRef(false);
  const [activeMessage, setActiveMessage] = useState(
    chat.messages.filter((m) => m.role === "assistant").at(-1),
  );

  useEffect(() => {
    if (!streamPromise || isHandlingStreamRef.current) return;

    isHandlingStreamRef.current = true;
    let isMounted = true;

    (async () => {
      try {
        const stream = await streamPromise;
        let didPushToCode = false;
        let didPushToPreview = false;

        for await (const chunk of readStreamByChunks(stream)) {
          if (!isMounted) break;
          setStreamText((text) => text + chunk);
          
          if (!didPushToCode && chunk.includes("```")) {
            didPushToCode = true;
            setActiveTab("code");
          }
          if (!didPushToPreview && chunk.includes("Run the app")) {
            didPushToPreview = true;
            setActiveTab("preview");
          }
        }
      } catch (error) {
        console.error("Error processing stream:", error);
      } finally {
        if (isMounted) {
          setStreamPromise(undefined);
          isHandlingStreamRef.current = false;
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [streamPromise]);

  return (
    <div className="h-dvh">
      <div className="flex h-full">
        <div className="mx-auto flex w-full shrink-0 flex-col overflow-hidden lg:w-1/2">
          <div className="flex items-center gap-4 px-4 py-4">
            <Link href="/">
              <LogoSmall />
            </Link>
            <p className="italic text-gray-500">{chat.title}</p>
          </div>

          <ChatLog
            chat={chat}
            streamText={streamText}
            activeMessage={activeMessage}
            onMessageClick={(message) => {
              if (message !== activeMessage) {
                setActiveMessage(message);
                setIsShowingCodeViewer(true);
              } else {
                setActiveMessage(undefined);
                setIsShowingCodeViewer(false);
              }
            }}
          />

          <ChatBox
            chat={chat}
            onNewStreamPromise={setStreamPromise}
            isStreaming={!!streamPromise}
          />
        </div>

        <CodeViewerLayout
          isShowing={isShowingCodeViewer}
          onClose={() => {
            setActiveMessage(undefined);
            setIsShowingCodeViewer(false);
          }}
        >
          {isShowingCodeViewer && (
            <CodeViewer
              streamText={streamText}
              chat={chat}
              message={activeMessage}
              onMessageChange={setActiveMessage}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onClose={() => {
                setActiveMessage(undefined);
                setIsShowingCodeViewer(false);
              }}
            />
          )}
        </CodeViewerLayout>
      </div>
    </div>
  );
}
