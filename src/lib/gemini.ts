const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/**
 * Sends a prompt to the Gemini API and returns the generated text response.
 */
export async function generateGeminiText(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured in the environment. Please add it to your .env file.');
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      throw new Error('Invalid response format or empty response from Gemini API');
    }

    return text;
  } catch (error) {
    const err = error as Error;
    console.error('Gemini API call failed:', err);
    throw new Error(`Gemini integration error: ${err.message || String(err)}`);
  }
}
