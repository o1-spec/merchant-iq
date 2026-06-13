import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const systemInstruction = "You are a highly professional, expert AI Chief Financial Officer for a small business in Africa using OPay Business OS. Provide clear, concise, corporate, and highly actionable financial advice. Use formatting like bullet points when helpful. Maintain a professional, trustworthy, and supportive tone. Keep answers relatively brief but dense with value.";

    // Format messages for Gemini API
    const formattedMessages = messages.map((msg: any) => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: formattedMessages,
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        generationConfig: {
          temperature: 0.7,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API Error:', errorText);
      return NextResponse.json({ error: 'Failed to communicate with AI provider' }, { status: response.status });
    }

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";

    return NextResponse.json({ reply: replyText });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
