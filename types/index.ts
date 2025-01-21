export interface Message {
  id: string;
  chatId: string;
  content: string;
  role: "system" | "user" | "assistant";
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  quality: "high" | "low";
  screenshotUrl?: string;
  model: string;
  prompt: string;
  llamaCoderVersion: string;
  shadcn: boolean;
}
