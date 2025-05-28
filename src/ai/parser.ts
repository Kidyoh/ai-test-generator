/**
 * Parse the AI response to extract just the test code
 * @param aiResponse Raw response from the AI
 * @returns Extracted test code
 */
export function parseResponse(aiResponse: string): string {
  // Extract code blocks from the response
  const codeBlockRegex = /```(?:javascript|typescript|js|ts)?\s*([\s\S]*?)```/g;
  const matches = [...aiResponse.matchAll(codeBlockRegex)];
  
  if (matches.length > 0) {
    // Join all code blocks if there are multiple
    return matches.map(match => match[1]).join('\n\n');
  }
  
  // If no code blocks, try to extract the whole response as code
  // Remove markdown formatting and explanations
  return aiResponse
    .replace(/^#.*$/gm, '') // Remove headings
    .replace(/^>.*$/gm, '') // Remove blockquotes
    .replace(/^Explanation:.*$/gm, '') // Remove explanations
    .trim();
}