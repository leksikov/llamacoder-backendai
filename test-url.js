// Test script to check the correct URL format
const endpoint = process.env.BACKEND_AI_ENDPOINT || "https://llama-vision-11b.asia03.app.backend.ai/";
const baseUrl = endpoint.replace(/\/$/, ''); // Remove trailing slash if present

console.log('Original endpoint:', endpoint);
console.log('Processed baseUrl:', baseUrl);
console.log('Final URL:', `${baseUrl}/v1/chat/completions`);

// Check if the endpoint already includes /v1
const hasV1Path = endpoint.includes('/v1');
console.log('Endpoint already includes /v1:', hasV1Path);

// Suggested fix
const correctUrl = hasV1Path ? `${baseUrl}/chat/completions` : `${baseUrl}/v1/chat/completions`;
console.log('Suggested correct URL:', correctUrl);
