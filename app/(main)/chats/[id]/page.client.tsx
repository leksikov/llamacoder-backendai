"use client";

import { startTransition, use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Chat, Message } from "@/types";
import { assert } from "@/lib/assertions";
import { Context } from "../../providers";
import ChatBox from "./chat-box";
import ChatLog from "./chat-log";
import CodeViewer from "./code-viewer";
import CodeViewerLayout from "./code-viewer-layout";
import LogoSmall from "@/components/icons/logo-small";
import { createMessage } from "@/app/(main)/actions";
import { splitByFirstCodeFence } from "@/lib/utils";

async function* readStreamByChunks(stream: ReadableStream) {
  assert(stream instanceof ReadableStream, 'Stream must be a ReadableStream');
  console.log('Starting stream reading');
  const reader = stream.getReader();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('Stream reading complete');
        break;
      }
      
      assert(value instanceof Uint8Array || value === undefined, 'Stream value must be Uint8Array or undefined');
      buffer += new TextDecoder().decode(value);
      console.log('Buffer updated:', {
        bufferLength: buffer.length,
        hasLines: buffer.includes('\n')
      });
      
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep the last incomplete line in buffer
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;
        
        if (trimmedLine.startsWith('data: ')) {
          const data = trimmedLine.slice(5).trim();
          if (data === '[DONE]') {
            console.log('Stream end marker found');
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed?.choices?.[0]?.delta?.content) {
              console.log('Content chunk found:', {
                contentLength: parsed.choices[0].delta.content.length,
                hasCodeFence: parsed.choices[0].delta.content.includes('```')
              });
              yield parsed.choices[0].delta.content;
            }
          } catch (e) {
            console.warn('JSON parsing failed, attempting direct content extraction:', e);
            const contentMatch = data.match(/"content":\s*"([^"]*)"/)
            if (contentMatch) {
              console.log('Content extracted from regex');
              yield contentMatch[1];
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Stream reading error:', e);
  } finally {
    console.log('Releasing stream reader');
    reader.releaseLock();
  }
}

export default function PageClient({ chat }: { chat: Chat }) {
  assert(chat?.id, 'Chat must have an ID');
  assert(chat?.messages, 'Chat must have messages array');
  
  const context = use(Context);
  assert(context, 'Context must be available');
  
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

    console.log('Starting stream handling');
    isHandlingStreamRef.current = true;
    let isMounted = true;

    (async () => {
      try {
        console.log('Awaiting stream promise');
        const stream = await streamPromise;
        console.log('Stream received');
        let didPushToCode = false;
        let didPushToPreview = false;

        for await (const chunk of readStreamByChunks(stream)) {
          if (!isMounted) {
            console.log('Component unmounted, breaking stream processing');
            break;
          }
          console.log('Processing chunk:', {
            chunkLength: chunk.length,
            hasCodeFence: chunk.includes('```'),
            hasRunApp: chunk.includes('Run the app')
          });
          
          setStreamText((text) => text + chunk);
          
          if (!didPushToCode && chunk.includes("```")) {
            console.log('Code fence found, switching to code tab');
            didPushToCode = true;
            setActiveTab("code");
          }
          if (!didPushToPreview && chunk.includes("Run the app")) {
            console.log('Run app found, switching to preview tab');
            didPushToPreview = true;
            setActiveTab("preview");
          }
        }
      } catch (error) {
        console.error("Error processing stream:", error);
      } finally {
        if (isMounted) {
          console.log('Stream processing complete');
          setStreamPromise(undefined);
          isHandlingStreamRef.current = false;
        }
      }
    })();

    return () => {
      console.log('Cleanup: Setting isMounted to false');
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
              console.log('Message click handler:', {
                currentMessage: message?.id,
                currentActiveMessage: activeMessage?.id,
                isShowingCodeViewer,
              });
              
              if (message !== activeMessage) {
                console.log('Setting new active message and showing viewer');
                setActiveMessage(message);
                setIsShowingCodeViewer(true);
              } else {
                console.log('Toggling viewer off');
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
