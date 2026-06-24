import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMistral } from '@ai-sdk/mistral';
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { MODELS_REGISTRY } from '@/lib/models';

export async function POST(req: Request) {
  let fallbackTitle = 'New Chat';
  try {
    const { firstQuery, modelMode } = await req.json();

    if (!firstQuery || !firstQuery.trim()) {
      return new Response(JSON.stringify({ error: 'First query is required' }), { status: 400 });
    }

    // Quick fallback title from the query itself (used when all model calls fail)
    fallbackTitle = firstQuery.trim().split(/\s+/).slice(0, 4).join(' ').substring(0, 30) || 'New Chat';

    // Retrieve API keys from client-side forwarded headers
    const geminiKey = req.headers.get('x-api-key-gemini');
    const mistralKey = req.headers.get('x-api-key-mistral');
    const perplexityKey = req.headers.get('x-api-key-perplexity');
    const zenmuxKey = req.headers.get('x-api-key-zenmux');
    const inceptionKey = req.headers.get('x-api-key-inception');
    const nvidiaKey = req.headers.get('x-api-key-nvidia');

    // Use Mistral Small as the dedicated title model if Mistral API key is available.
    // Otherwise, fall back to the selected chat model (modelMode).
    const modelConfig = mistralKey
      ? (MODELS_REGISTRY.find(m => m.id === 'mistral-small-latest') || MODELS_REGISTRY.find(m => m.id === 'gemini-3-flash-preview')!)
      : (MODELS_REGISTRY.find(m => m.id === modelMode) || MODELS_REGISTRY.find(m => m.id === 'gemini-3-flash-preview')!);

    let aiModel: any;

    try {
      if (modelConfig.provider === 'google') {
        if (!geminiKey) {
          return new Response(JSON.stringify({ title: fallbackTitle }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        const google = createGoogleGenerativeAI({ apiKey: geminiKey });
        aiModel = google(modelConfig.id);
      } else if (modelConfig.provider === 'mistral') {
        if (!mistralKey) {
          return new Response(JSON.stringify({ title: fallbackTitle }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        const mistral = createMistral({ apiKey: mistralKey });
        aiModel = mistral(modelConfig.id);
      } else if (modelConfig.provider === 'perplexity') {
        if (!perplexityKey) {
          return new Response(JSON.stringify({ title: fallbackTitle }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        const perplexity = createOpenAI({
          apiKey: perplexityKey,
          baseURL: 'https://api.perplexity.ai',
        });
        aiModel = perplexity.chat(modelConfig.id);
      } else if (modelConfig.provider === 'zenmux') {
        if (!zenmuxKey) {
          return new Response(JSON.stringify({ title: fallbackTitle }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        const zenmux = createOpenAI({
          apiKey: zenmuxKey,
          baseURL: 'https://zenmux.ai/api/v1',
        });
        aiModel = zenmux.chat(modelConfig.id);
      } else if (modelConfig.provider === 'nvidia') {
        if (!nvidiaKey) {
          return new Response(JSON.stringify({ title: fallbackTitle }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        const nvidia = createOpenAI({
          apiKey: nvidiaKey,
          baseURL: 'https://integrate.api.nvidia.com/v1',
        });
        aiModel = nvidia.chat(modelConfig.id);
      } else if (modelConfig.provider === 'inception') {
        if (!inceptionKey) {
          return new Response(JSON.stringify({ title: fallbackTitle }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        const inception = createOpenAI({
          apiKey: inceptionKey,
          baseURL: 'https://api.inceptionlabs.ai/v1',
        });
        aiModel = inception.chat(modelConfig.id);
      }
    } catch {
      // If provider initialization fails, return fallback title
      return new Response(JSON.stringify({ title: fallbackTitle }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    let title = '';
    try {
      const { object } = await generateObject({
        model: aiModel,
        maxRetries: 1,
        schema: z.object({
          title: z.string().max(40).describe('A short, descriptive, 2-4 word title summarizing the user query. Do not include quotes, markdown, or punctuation.'),
        }),
        prompt: `Generate a short, clean, descriptive chat title of 2 to 4 words summarizing this first user query. Do not include quotes, markdown, or punctuation:\n\n"${firstQuery}"`,
      });
      title = object.title;
    } catch (err) {
      console.warn('generateObject failed, falling back to generateText for title:', (err as Error).message);
      try {
        const { text } = await generateText({
          model: aiModel,
          maxRetries: 1,
          prompt: `Generate a short, clean, descriptive chat title of 2 to 4 words summarizing this first user query. Return ONLY the title itself, with no quotes, markdown, or punctuation. Do not write anything else:\n\n"${firstQuery}"`,
        });
        title = text.trim().replace(/^["']|["']$/g, '');
      } catch (fallbackErr) {
        console.warn('generateText title fallback also failed, using query substring:', (fallbackErr as Error).message);
        title = fallbackTitle;
      }
    }

    return new Response(JSON.stringify({ title: title || fallbackTitle }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    // Never return 500 for title generation — always return a usable title
    console.error('Error generating title:', error);
    return new Response(JSON.stringify({ title: fallbackTitle }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
