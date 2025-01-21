"use server";

import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import Together from "together-ai";
import { z } from "zod";
import {
  getMainCodingPrompt,
  screenshotToCodePrompt,
  softwareArchitectPrompt,
} from "@/lib/prompts";

export async function createChat(
  prompt: string,
  model: string,
  quality: "high" | "low",
  screenshotUrl: string | undefined,
) {
  const chat = await prisma.chat.create({
    data: {
      model,
      quality,
      prompt,
      title: "",
      shadcn: true,
    },
  });

  async function makeBackendAIRequest(messages: any[], stream = false) {
    const baseUrl = process.env.BACKEND_AI_ENDPOINT!.replace(/\/$/, ''); // Remove trailing slash if present
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BACKEND_AI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.MODEL_NAME,
        messages,
        stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Backend.AI request failed: ${errorText}`);
    }

    return stream ? response.body : response.json();
  }

  function getClientConfig(forModel: string) {
    try {
      console.log('getClientConfig called for model:', forModel);
      const isModelBackendAI = forModel === process.env.MODEL_NAME;
      console.log('isModelBackendAI:', isModelBackendAI);
      
      let options: ConstructorParameters<typeof Together>[0] = {};
      
      if (isModelBackendAI) {
        console.log('Using Backend.AI config');
        options.baseURL = process.env.BACKEND_AI_ENDPOINT;
        options.defaultHeaders = {
          "Authorization": `Bearer ${process.env.BACKEND_AI_API_KEY}`,
          "Content-Type": "application/json"
        };
        options.apiKey = "not-needed"; // Backend.AI doesn't need Together's API key
      } else if (process.env.HELICONE_API_KEY) {
        console.log('Using Helicone config');
        options.baseURL = "https://together.helicone.ai/v1";
        options.defaultHeaders = {
          "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
          "Helicone-Property-appname": "LlamaCoder",
          "Helicone-Session-Id": chat.id,
          "Helicone-Session-Name": "LlamaCoder Chat",
        };
        options.apiKey = process.env.TOGETHER_API_KEY;
      } else {
        console.log('Using default Together AI config');
        options.apiKey = process.env.TOGETHER_API_KEY;
      }
      
      console.log('Client config created successfully');
      return options;
    } catch (error) {
      console.error('Error in getClientConfig:', error);
      throw error;
    }
  }

  async function fetchTitle() {
    try {
      console.log('fetchTitle called');
      const modelToUse = model === process.env.MODEL_NAME! ? process.env.MODEL_NAME! : "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo";
      console.log('Using model:', modelToUse);
      
      if (modelToUse === process.env.MODEL_NAME) {
        console.log('Making Backend.AI request for title');
        const titleRes = await makeBackendAIRequest([
          {
            role: "system",
            content: "You are a chatbot helping the user create a simple app or script, and your current job is to create a succinct title, maximum 3-5 words, for the chat given their initial prompt. Please return only the title.",
          },
          {
            role: "user",
            content: prompt,
          },
        ]);
        return titleRes.choices[0].message.content;
      }

      console.log('Getting Together AI client config');
      const options = getClientConfig(modelToUse);
      console.log('Initializing Together AI client');
      const client = new Together({
        apiKey: options.apiKey || "",
        ...options
      });
      
      console.log('Making Together AI request for title');
      const responseForChatTitle = await client.chat.completions.create({
        model: modelToUse,
        messages: [
          {
            role: "system",
            content:
              "You are a chatbot helping the user create a simple app or script, and your current job is to create a succinct title, maximum 3-5 words, for the chat given their initial prompt. Please return only the title.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });
      const title = responseForChatTitle.choices[0].message?.content || prompt;
      console.log('Title generated:', title);
      return title;
    } catch (error) {
      console.error('Error in fetchTitle:', error);
      throw error;
    }
  }

  async function fetchTopExample() {
    try {
      console.log('fetchTopExample called');
      const modelToUse = model === process.env.MODEL_NAME! ? process.env.MODEL_NAME! : "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo";
      console.log('Using model:', modelToUse);
      
      if (modelToUse === process.env.MODEL_NAME) {
        console.log('Making Backend.AI request for top example');
        const exampleRes = await makeBackendAIRequest([
          {
            role: "system",
            content: `You are a helpful bot. Given a request for building an app, you match it to the most similar example provided. If the request is NOT similar to any of the provided examples, return "none". Here is the list of examples, ONLY reply with one of them OR "none":

          - landing page
          - blog app
          - quiz app
          - pomodoro timer
          `,
          },
          {
            role: "user",
            content: prompt,
          },
        ]);
        return exampleRes.choices[0].message.content;
      }

      console.log('Getting Together AI client config');
      const options = getClientConfig(modelToUse);
      console.log('Initializing Together AI client');
      const client = new Together({
        apiKey: options.apiKey || "",
        ...options
      });
      
      console.log('Making Together AI request for top example');
      const findSimilarExamples = await client.chat.completions.create({
        model: modelToUse,
        messages: [
          {
            role: "system",
            content: `You are a helpful bot. Given a request for building an app, you match it to the most similar example provided. If the request is NOT similar to any of the provided examples, return "none". Here is the list of examples, ONLY reply with one of them OR "none":

          - landing page
          - blog app
          - quiz app
          - pomodoro timer
          `,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

      const mostSimilarExample =
        findSimilarExamples.choices[0].message?.content || "none";
      console.log('Most similar example:', mostSimilarExample);
      return mostSimilarExample;
    } catch (error) {
      console.error('Error in fetchTopExample:', error);
      throw error;
    }
  }

  const [title, mostSimilarExample] = await Promise.all([
    fetchTitle(),
    fetchTopExample(),
  ]);

  let fullScreenshotDescription;
  if (screenshotUrl) {
    if (model === process.env.MODEL_NAME) {
      throw new Error("Screenshot to code is not supported with Backend.AI model");
    }

    const modelToUse = "meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo";
    const options = getClientConfig(modelToUse);
    const client = new Together({
      apiKey: options.apiKey || "",
      ...options
    });
    
    try {
      console.log('Making Together AI request for screenshot description');
      const screenshotResponse = await client.chat.completions.create({
        model: modelToUse,
        temperature: 0.2,
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            // @ts-expect-error Need to fix the TypeScript library type
            content: [
              { type: "text", text: screenshotToCodePrompt },
              {
                type: "image_url",
                image_url: {
                  url: screenshotUrl,
                },
              },
            ],
          },
        ],
      });

      fullScreenshotDescription = screenshotResponse.choices[0].message?.content;
      console.log('Screenshot description generated:', fullScreenshotDescription);
    } catch (error) {
      console.error('Error in screenshot description generation:', error);
      throw error;
    }
  }

  let userMessage: string;
  if (quality === "high") {
    const modelToUse = model;
    
    if (modelToUse === process.env.MODEL_NAME) {
      console.log('Making Backend.AI request for high quality message');
      const initialRes = await makeBackendAIRequest([
        {
          role: "system",
          content: "You are a helpful AI assistant that writes high quality code.",
        },
        {
          role: "user",
          content: prompt,
        },
      ]);
      userMessage = initialRes.choices[0].message.content;
    } else {
      console.log('Getting Together AI client config');
      const options = getClientConfig(modelToUse);
      console.log('Initializing Together AI client');
      const client = new Together({
        apiKey: options.apiKey || "",
        ...options
      });
      
      try {
        console.log('Making Together AI request for high quality message');
        let initialRes = await client.chat.completions.create({
          model: modelToUse,
          messages: [
            {
              role: "system",
              content: softwareArchitectPrompt,
            },
            {
              role: "user",
              content: fullScreenshotDescription
                ? fullScreenshotDescription + prompt
                : prompt,
            },
          ],
          temperature: 0.2,
          max_tokens: 3000,
        });

        userMessage = initialRes.choices[0].message?.content ?? prompt;
        console.log('High quality message generated:', userMessage);
      } catch (error) {
        console.error('Error in high quality message generation:', error);
        throw error;
      }
    }
  } else if (fullScreenshotDescription) {
    userMessage =
      prompt +
      "RECREATE THIS APP AS CLOSELY AS POSSIBLE: " +
      fullScreenshotDescription;
  } else {
    userMessage = prompt;
  }

  let newChat = await prisma.chat.update({
    where: {
      id: chat.id,
    },
    data: {
      title,
      messages: {
        createMany: {
          data: [
            {
              role: "system",
              content: getMainCodingPrompt(mostSimilarExample),
              position: 0,
            },
            { role: "user", content: userMessage, position: 1 },
          ],
        },
      },
    },
    include: {
      messages: true,
    },
  });

  const lastMessage = newChat.messages
    .sort((a, b) => a.position - b.position)
    .at(-1);
  if (!lastMessage) throw new Error("No new message");

  return {
    chatId: chat.id,
    lastMessageId: lastMessage.id,
  };
}

export async function createMessage(
  chatId: string,
  text: string,
  role: "assistant" | "user",
) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: { messages: true },
  });
  if (!chat) notFound();

  const maxPosition = Math.max(...chat.messages.map((m) => m.position));

  const newMessage = await prisma.message.create({
    data: {
      role,
      content: text,
      position: maxPosition + 1,
      chatId,
    },
  });

  return newMessage;
}

export async function getNextCompletionStreamPromise(
  messageId: string,
  model: string,
) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message) {
    throw new Error("Message not found");
  }
  
  const messagesRes = await prisma.message.findMany({
    where: { chatId: message.chatId, position: { lte: message.position } },
    orderBy: { position: "asc" },
  });

  const messages = z
    .array(
      z.object({
        role: z.enum(["system", "user", "assistant"]),
        content: z.string(),
      }),
    )
    .parse(messagesRes);

  async function makeBackendAIRequest(messages: any[], stream = false) {
    const baseUrl = process.env.BACKEND_AI_ENDPOINT!.replace(/\/$/, ''); // Remove trailing slash if present
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BACKEND_AI_API_KEY}`
      },
      body: JSON.stringify({
        model: process.env.MODEL_NAME,
        messages,
        stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      throw new Error(`Backend.AI request failed: ${errorText}`);
    }

    return stream ? response.body : response.json();
  }

  function getClientConfig(model: string, message: any) {
    try {
      if (!message) {
        throw new Error("Message not found");
      }
      const isModelBackendAI = model.startsWith('phi');
      console.log('isModelBackendAI:', isModelBackendAI);
      
      let options: ConstructorParameters<typeof Together>[0] = {};
      
      if (isModelBackendAI) {
        console.log('Using Backend.AI config');
        options.baseURL = process.env.BACKEND_AI_ENDPOINT;
        options.defaultHeaders = {
          "Authorization": `Bearer ${process.env.BACKEND_AI_API_KEY}`,
          "Content-Type": "application/json"
        };
        options.apiKey = "not-needed"; // Backend.AI doesn't need Together's API key
      } else if (process.env.HELICONE_API_KEY) {
        console.log('Using Helicone config');
        options.baseURL = "https://together.helicone.ai/v1";
        options.defaultHeaders = {
          "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
          "Helicone-Property-appname": "LlamaCoder",
          "Helicone-Session-Id": message.chatId,
          "Helicone-Session-Name": "LlamaCoder Chat",
        };
        options.apiKey = process.env.TOGETHER_API_KEY;
      } else {
        console.log('Using default Together AI config');
        options.apiKey = process.env.TOGETHER_API_KEY;
      }
      
      console.log('Client config created successfully');
      return options;
    } catch (error) {
      console.error('Error in getClientConfig:', error);
      throw error;
    }
  }

  const options = getClientConfig(model, message);
  if (process.env.HELICONE_API_KEY) {
    options.baseURL = "https://together.helicone.ai/v1";
    options.defaultHeaders = {
      "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
      "Helicone-Property-appname": "LlamaCoder",
      "Helicone-Session-Id": message.chatId,
      "Helicone-Session-Name": "LlamaCoder Chat",
    };
    options.apiKey = process.env.TOGETHER_API_KEY;
  } else {
    options.apiKey = process.env.TOGETHER_API_KEY;
  }

  if (model === process.env.MODEL_NAME) {
    return {
      streamPromise: new Promise<ReadableStream>(async (resolve) => {
        const stream = await makeBackendAIRequest(messages.map((m) => ({ 
          role: m.role, 
          content: m.content 
        })), true);
        if (!stream) {
          throw new Error("Failed to get stream from Backend.AI");
        }
        resolve(stream);
      }),
    };
  }

  try {
    console.log('Initializing Together AI client');
    const client = new Together({
      apiKey: options.apiKey || "",
      ...options
    });
    
    return {
      streamPromise: new Promise<ReadableStream>(async (resolve) => {
        console.log('Making Together AI request for completion stream');
        const res = await client.chat.completions.create({
          model,
          messages: messages.map((message) => ({
            role: message.role,
            content: message.content || "",  // Provide default empty string if content is null
          })),
          stream: true,
          temperature: 0.2,
          max_tokens: 9000,
        });

        resolve(res.toReadableStream());
      }),
    };
  } catch (error) {
    console.error('Error in getNextCompletionStreamPromise:', error);
    throw error;
  }
}
