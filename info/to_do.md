# Migration To-Do List

## 1. Initial Setup 
- [x] Update .env with Backend.AI configuration
- [x] Create PLAN.md with minimal change strategy
- [x] Create TO_DO.md with task list

## 2. Minimal Code Changes 

### actions.ts Updates
- [x] Add MODEL_PROVIDER check
- [x] Add Backend.AI configuration
- [x] Keep Together AI logic intact
- [x] Fix TypeScript errors
- [x] Add CodeSandbox API key
- [x] Test provider switching

### Model Selection Updates
- [x] Add Backend.AI model to constants.ts
- [x] Create next.config.js for environment variables
- [x] Configure webpack for browser polyfills
- [x] Test model selection in UI

### Chat UI Improvements
- [x] Fix stream parsing errors
- [x] Improve error handling in stream processing
- [x] Add buffer for incomplete JSON chunks
- [x] Fix loading state in chat transitions
- [x] Implement proper state management with Context
- [x] Fix hydration mismatch warnings
- [ ] Add loading indicators for long responses
- [ ] Implement retry mechanism for failed requests

### CodeSandbox Integration
- [x] Fix crypto module error
- [x] Create separate CodeSandbox client module
- [x] Handle client initialization properly
- [ ] Add error handling for missing API key
- [ ] Test code execution in chat
- [ ] Decide on final code execution strategy:
  - [ ] Option 1: Move all code execution to Sandpack React
  - [ ] Option 2: Create server-side API endpoint for CodeSandbox SDK
  - [ ] Option 3: Use Backend.AI for code execution

### No Changes Needed
- API call structure
- Response handling
- Error handling logic

## 3. Testing 

### Provider Switching
- [x] Test Backend.AI configuration
- [x] Verify Together AI still works
- [x] Check seamless switching
- [x] Validate environment variables

### API Compatibility
- [x] Test Backend.AI responses
- [x] Verify OpenAI API format
- [x] Check streaming functionality
- [x] Validate error formats

### Regression Testing
- [x] Verify Together AI unchanged
- [x] Test all existing features
- [x] Check error handling
- [x] Validate streaming

### New Tests Needed
- [ ] Test stream parsing with malformed responses
- [ ] Test state management during page transitions
- [ ] Test error recovery scenarios
- [ ] Validate context provider behavior

## 4. Documentation 
- [x] Document provider switching
- [x] Update environment variables
- [x] Add Backend.AI notes
- [x] Update README
- [x] Document code execution strategies
- [x] Add troubleshooting guide for crypto errors
- [ ] Document new error handling approach
- [ ] Add state management documentation

## 5. Bug Fixes
- [x] Fix crypto module error in browser
- [x] Fix TypeScript errors in actions.ts
- [x] Refactor CodeSandbox integration
- [x] Fix Together AI client initialization error
- [x] Fix stream parsing issues
- [x] Fix loading state in chat transitions
- [x] Fix hydration warnings
- [ ] Implement proper error recovery
- [ ] Add request timeout handling
- [ ] Fix edge cases in stream parsing

## Notes 
- Only modified necessary files for Backend.AI integration
- Improved error handling and state management
- Focus on stability and user experience
- Added proper stream handling with buffering

## Progress Tracking
- Total Tasks: 52
- Completed: 35
- Remaining: 17

Last Updated: 2025-01-19
