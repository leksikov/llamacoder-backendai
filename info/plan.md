# Migration Plan: Together AI → Backend.AI

## Core Objective
Add Backend.AI LLM endpoints as an alternative provider while:
- Maintaining existing Together AI functionality
- Making minimal codebase changes
- Ensuring seamless provider switching
- Preserving OpenAI API compatibility
- Ensuring robust error handling and state management

## Current Architecture
- Together AI client initialization in `actions.ts`
- Optional Helicone proxy support
- Chat completion streaming support
- Model-specific configurations
- Improved state management with Context
- Robust stream parsing with buffering
- Dual code execution strategies:
  - CodeSandbox SDK for server-side execution
  - Sandpack React for client-side preview

## Implementation Strategy

### 1. Provider Selection & Configuration
```typescript
// actions.ts
function getClientConfig(forModel: string) {
  const isModelBackendAI = forModel === process.env.MODEL_NAME;
  
  let options = {};
  if (isModelBackendAI) {
    options.baseURL = process.env.BACKEND_AI_ENDPOINT;
    options.defaultHeaders = {
      "Authorization": `Bearer ${process.env.BACKEND_AI_API_KEY}`,
      "Content-Type": "application/json"
    };
  } else {
    // Existing Together AI logic
    if (process.env.HELICONE_API_KEY) {
      options.baseURL = "https://together.helicone.ai/v1";
      // ... existing Helicone headers
    }
  }
  return options;
}
```

### 2. Stream Processing Implementation
```typescript
async function* readStreamByChunks(stream: ReadableStream) {
  const reader = stream.getReader();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      buffer += new TextDecoder().decode(value);
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete chunks
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(5).trim();
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed?.choices?.[0]?.delta?.content) {
              yield parsed.choices[0].delta.content;
            }
          } catch (e) {
            // Fallback content extraction for malformed JSON
            const contentMatch = data.match(/"content":\s*"([^"]*)"/)
            if (contentMatch) {
              yield contentMatch[1];
            }
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
```

### 3. State Management
```typescript
// providers.tsx
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
```

### 4. Code Execution Strategy
Current temporary solution:
- Use Sandpack React for all code execution
- Avoid Node.js crypto module issues
- Plan for proper solution implementation

Long-term options under consideration:
1. **Enhanced Sandpack React**
   - Pros: Browser-compatible, no Node.js dependencies
   - Cons: Limited language support
   - Plan: Add custom language support plugins

2. **Backend.AI Integration**
   - Pros: Native code execution, unified provider
   - Cons: Additional setup required
   - Plan: Implement as premium feature

## Implementation Progress

### Completed
- Backend.AI configuration 
- Provider switching logic 
- Stream processing improvements 
- State management refactor 
- Error handling enhancements 
- Hydration fixes 

### In Progress
- Loading state improvements
- Error recovery mechanisms
- Request timeout handling
- Edge case handling in stream parsing

### Planned
- Retry mechanism for failed requests
- Loading indicators for long responses
- Comprehensive error documentation
- Extended test coverage

## Success Criteria 
1. Backend.AI integration works seamlessly
2. Together AI functionality preserved
3. Seamless provider switching
4. Code execution works reliably
5. Maintained streaming support with improved reliability
6. Robust error handling and recovery
7. Smooth state transitions

## Fallback Strategy
- Together AI remains default fallback
- Simple environment switch to change providers
- Sandpack React as temporary code execution solution
- Graceful degradation on errors
- Automatic retry with exponential backoff

## Next Steps
1. Implement remaining error recovery mechanisms
2. Add comprehensive logging
3. Enhance loading states and indicators
4. Complete test coverage
5. Update documentation with new features

Last Updated: 2025-01-19
