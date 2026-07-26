export interface ModelConfig {
  id: string;
  name: string;
  provider: 'google' | 'mistral' | 'perplexity' | 'zenmux' | 'nvidia' | 'inception';
  description: string;
  contextWindow: string;
  pricing: { input: string; output: string };
  tags: string[]; // e.g. ["Vision", "Coding", "Reasoning", "Fast"]
}

export const MODELS_REGISTRY: ModelConfig[] = [
  // --- GOOGLE PROVIDER ---
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash',
    provider: 'google',
    description: "Google's latest small SOTA LLM",
    contextWindow: '1M tokens',
    pricing: { input: '$0.50 / 1M', output: '$3.00 / 1M' },
    tags: ['Coding', 'Fast', 'Agentic', 'Multimodal']
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro',
    provider: 'google',
    description: "Google's newest SOTA LLM",
    contextWindow: '1M tokens',
    pricing: { input: '$2.00/1M (≤200k) | $4.00/1M (>200k)', output: '$12.00/1M (≤200k) | $18.00/1M (>200k)' },
    tags: ['Reasoning', 'Coding', 'Multimodal']
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    description: "Google's advanced small LLM",
    contextWindow: '1M tokens',
    pricing: { input: '$0.30 / 1M', output: '$2.50 / 1M' },
    tags: ['Vision', 'Coding', 'Fast']
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    description: "Google's advanced LLM",
    contextWindow: '1M tokens',
    pricing: { input: '$1.25/1M (≤200k) | $2.50/1M (>200k)', output: '$10.00/1M (≤200k) | $15.00/1M (>200k)' },
    tags: ['Reasoning', 'Vision', 'Multimodal']
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'google',
    description: "Google's advanced small LLM",
    contextWindow: '1M tokens',
    pricing: { input: '$0.10 / 1M', output: '$0.40 / 1M' },
    tags: ['Fast', 'Cost-Effective', 'Multimodal']
  },
  {
    id: 'imagen-3.0-generate-002',
    name: 'Imagen 3.0 Generate',
    provider: 'google',
    description: "Google's high-quality image generation model, optimized for detailed photorealistic and artistic outputs.",
    contextWindow: 'N/A',
    pricing: { input: 'N/A', output: '$0.04 / image' },
    tags: ['Image-Generation', 'Art', 'Design']
  },

  // --- MISTRAL PROVIDER ---
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large 3',
    provider: 'mistral',
    description: "Mistral's latest and greatest large multi-modal LLM",
    contextWindow: '256k tokens',
    pricing: { input: '$0.50 / 1M', output: '$1.50 / 1M' },
    tags: ['Reasoning', 'Coding', 'Multilingual']
  },
  {
    id: 'mistral-medium-latest',
    name: 'Mistral Medium',
    provider: 'mistral',
    description: "Mistral's medium multi-modal LLM",
    contextWindow: '256k tokens',
    pricing: { input: '$1.50 / 1M', output: '$7.50 / 1M' },
    tags: ['Reasoning', 'Agentic', 'Generalist']
  },
  {
    id: 'mistral-small-latest',
    name: 'Mistral Small 4',
    provider: 'mistral',
    description: "Mistral's small efficient model",
    contextWindow: '128k tokens',
    pricing: { input: '$0.10 / 1M', output: '$0.30 / 1M' },
    tags: ['Coding', 'Fast', 'Cost-Effective']
  },
  {
    id: 'codestral-latest',
    name: 'Codestral',
    provider: 'mistral',
    description: "Mistral's specialized coding model, designed specifically for code-generation, autocomplete, and math explanations.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.30 / 1M', output: '$0.90 / 1M' },
    tags: ['Coding', 'Autocomplete', 'Math']
  },
  {
    id: 'pixtral-large-latest',
    name: 'Pixtral Large',
    provider: 'mistral',
    description: "Mistral's flagship 123B multimodal model, delivering top-tier image understanding and vision reasoning.",
    contextWindow: '128k tokens',
    pricing: { input: '$2.00 / 1M', output: '$6.00 / 1M' },
    tags: ['Vision', 'Reasoning', 'Multimodal']
  },
  {
    id: 'pixtral-12b-2409',
    name: 'Pixtral 12B',
    provider: 'mistral',
    description: "Mistral's open-weights 12B multimodal model, optimized for local or efficient vision-text operations.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.15 / 1M', output: '$0.15 / 1M' },
    tags: ['Vision', 'Fast', 'Multimodal']
  },
  {
    id: 'ministral-8b-latest',
    name: 'Ministral 3 8B',
    provider: 'mistral',
    description: "Mistral's mini-model 8B multi-modal LLM",
    contextWindow: '128k tokens',
    pricing: { input: '$0.10 / 1M', output: '$0.10 / 1M' },
    tags: ['Edge', 'Fast', 'Cost-Effective']
  },
  {
    id: 'ministral-3b-latest',
    name: 'Ministral 3 3B',
    provider: 'mistral',
    description: "Mistral's mini-model 3B multi-modal LLM",
    contextWindow: '128k tokens',
    pricing: { input: '$0.04 / 1M', output: '$0.04 / 1M' },
    tags: ['Edge', 'Mobile', 'Fast']
  },

  // --- PERPLEXITY PROVIDER ---
  {
    id: 'sonar',
    name: 'Sonar',
    provider: 'perplexity',
    description: "Perplexity's fast and highly efficient search-grounded model, optimized for real-time web search and querying.",
    contextWindow: '128k tokens',
    pricing: { input: '$1.00 / 1M', output: '$1.00 / 1M' },
    tags: ['Search', 'Fast', 'Web-Grounded']
  },
  {
    id: 'sonar-pro',
    name: 'Sonar Pro',
    provider: 'perplexity',
    description: "Perplexity's premium search-grounded model, optimized for detailed research, source checking, and citation volumes.",
    contextWindow: '205k tokens',
    pricing: { input: '$3.00 / 1M', output: '$15.00 / 1M' },
    tags: ['Search', 'Research', 'Web-Grounded']
  },
  {
    id: 'sonar-reasoning-pro',
    name: 'Sonar Reasoning Pro',
    provider: 'perplexity',
    description: "Perplexity's top-tier reasoning model using multi-step chain-of-thought planning and deep web citation matching.",
    contextWindow: '131k tokens',
    pricing: { input: '$2.00 / 1M', output: '$8.00 / 1M' },
    tags: ['Reasoning', 'Research', 'Deep-Search']
  },
  {
    id: 'sonar-deep-research',
    name: 'Sonar Deep Research',
    provider: 'perplexity',
    description: "Perplexity's expert model optimized for autonomous multi-step planning and long-form report synthesis.",
    contextWindow: '128k tokens',
    pricing: { input: '$2.00 / 1M', output: '$8.00 / 1M' },
    tags: ['Research', 'Autonomous', 'Deep-Search']
  },
  // --- INCEPTION LABS PROVIDER ---
  {
    id: 'mercury-2',
    name: 'Mercury 2',
    provider: 'inception',
    description: "Inception Labs' flagship diffusion-based LLM, delivering ultra-fast inference with high-quality reasoning and code generation.",
    contextWindow: '32k tokens',
    pricing: { input: '$0.50 / 1M', output: '$1.50 / 1M' },
    tags: ['Diffusion', 'Fast', 'Reasoning', 'Coding']
  },
  // --- ZENMUX PROVIDER ---
  {
    id: 'z-ai/glm-5.2-free',
    name: 'GLM 5.2 (Free)',
    provider: 'zenmux',
    description: "GLM 5.2 model hosted on ZenMux free tier.",
    contextWindow: '128k tokens',
    pricing: { input: '$1.40 / 1M', output: '$4.40 / 1M' },
    tags: ['Fast', 'Generalist', 'Free']
  },
  {
    id: 'glm-5.2-free',
    name: 'GLM 5.2 Alias (Free)',
    provider: 'zenmux',
    description: "GLM 5.2 model alias hosted on ZenMux free tier.",
    contextWindow: '128k tokens',
    pricing: { input: '$1.40 / 1M', output: '$4.40 / 1M' },
    tags: ['Fast', 'Generalist', 'Free']
  },
  {
    id: 'moonshotai/kimi-k2.7-code-free',
    name: 'Kimi K2.7 Code (Free)',
    provider: 'zenmux',
    description: "Moonshot's specialized coding model hosted on ZenMux free tier.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.95 / 1M', output: '$4.00 / 1M' },
    tags: ['Coding', 'Autocomplete', 'Free']
  },
  {
    id: 'z-ai/glm-4.6v-flash-free',
    name: 'GLM 4.6V Flash',
    provider: 'zenmux',
    description: "Zhipu AI's fast vision reasoning LLM",
    contextWindow: '128k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Vision', 'Fast', 'Free']
  },
  {
    id: 'z-ai/glm-4.7-flash-free',
    name: 'GLM 4.7 Flash',
    provider: 'zenmux',
    description: "Zhipu AI's latest fast vision reasoning LLM",
    contextWindow: '128k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Fast', 'Free']
  },
  // --- NVIDIA PROVIDER ---
  {
    id: 'deepseek-ai/deepseek-v4-flash',
    name: 'DeepSeek V4 Flash',
    provider: 'nvidia',
    description: "DeepSeek's high-throughput reasoning and coding model hosted on NVIDIA NIM API catalog.",
    contextWindow: '1M tokens',
    pricing: { input: '$0.14 / 1M', output: '$0.28 / 1M' },
    tags: ['Coding', 'Reasoning', 'Fast']
  },
  {
    id: 'stepfun-ai/step-3.7-flash',
    name: 'Step 3.7 Flash',
    provider: 'nvidia',
    description: "StepFun's latest flash model, optimized for fast reasoning and agentic workflows.",
    contextWindow: '256k tokens',
    pricing: { input: '$0.20 / 1M', output: '$1.15 / 1M' },
    tags: ['Fast', 'Reasoning', 'Agentic']
  },
  {
    id: 'moonshotai/kimi-k2.6',
    name: 'Kimi K2.6',
    provider: 'nvidia',
    description: "Moonshot AI's powerful long-context model optimized for reasoning and conversation.",
    contextWindow: '256k tokens',
    pricing: { input: '$0.95 / 1M', output: '$4.00 / 1M' },
    tags: ['Reasoning', 'Chat', 'Long-Context']
  },
  {
    id: 'deepseek-ai/deepseek-v4-pro',
    name: 'DeepSeek V4 Pro',
    provider: 'nvidia',
    description: "DeepSeek's frontier-class Mixture-of-Weights reasoning and coding model.",
    contextWindow: '1M tokens',
    pricing: { input: '$0.435 / 1M', output: '$0.87 / 1M' },
    tags: ['Coding', 'Reasoning', 'Agentic']
  },
  {
    id: 'z-ai/glm-5.1',
    name: 'GLM 5.1',
    provider: 'nvidia',
    description: "Zhipu AI's high-performance bilingual model with strong reasoning capabilities.",
    contextWindow: '200k tokens',
    pricing: { input: '$1.40 / 1M', output: '$4.40 / 1M' },
    tags: ['Bilingual', 'Reasoning', 'Fast']
  },
  {
    id: 'qwen/qwen3.5-122b-a10b',
    name: 'Qwen 3.5 122B',
    provider: 'nvidia',
    description: "Alibaba's large-scale open-weights model, delivering top-tier performance on reasoning and coding.",
    contextWindow: '262k tokens',
    pricing: { input: '$0.40 / 1M', output: '$2.00 / 1M' },
    tags: ['Coding', 'Reasoning', 'Multilingual']
  },
  {
    id: 'stepfun-ai/step-3.5-flash',
    name: 'Step 3.5 Flash',
    provider: 'nvidia',
    description: "StepFun's highly efficient flash model, optimized for speed and cost effectiveness.",
    contextWindow: '262k tokens',
    pricing: { input: '$0.09 / 1M', output: '$0.30 / 1M' },
    tags: ['Fast', 'Cost-Effective', 'Agentic']
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    provider: 'nvidia',
    description: "OpenAI's high-reasoning open-weights model with transparent chain-of-thought capabilities.",
    contextWindow: '131k tokens',
    pricing: { input: '$0.35 / 1M', output: '$0.87 / 1M' },
    tags: ['Reasoning', 'Agentic', 'Transparent-CoT']
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b',
    name: 'Nemotron 3 Super',
    provider: 'nvidia',
    description: "NVIDIA's flagship reasoning model, optimized for complex instruction following and deep thinking.",
    contextWindow: '1M tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Reasoning', 'Coding', 'Deep-Thinking']
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    provider: 'nvidia',
    description: "OpenAI's fast, low-latency open-weights reasoning model, optimized for efficient deployment.",
    contextWindow: '131k tokens',
    pricing: { input: '$0.029 / 1M', output: '$0.14 / 1M' },
    tags: ['Fast', 'Reasoning', 'Transparent-CoT']
  },
  {
    id: 'minimaxai/minimax-m3',
    name: 'MiniMax M3',
    provider: 'nvidia',
    description: "MiniMax's multimodal agentic model, built for long-horizon planning and tool execution.",
    contextWindow: '512k tokens',
    pricing: { input: '$0.30 / 1M', output: '$1.20 / 1M' },
    tags: ['Multimodal', 'Agentic', 'Tool-Use']
  },
  {
    id: 'minimaxai/minimax-m2.7',
    name: 'MiniMax M2.7',
    provider: 'nvidia',
    description: "MiniMax's high-performance language model optimized for rapid text completion and dialogue.",
    contextWindow: '205k tokens',
    pricing: { input: '$0.30 / 1M', output: '$1.20 / 1M' },
    tags: ['Fast', 'Chat']
  },
  {
    id: 'qwen/qwen3.5-397b-a17b',
    name: 'Qwen 3.5 397B',
    provider: 'nvidia',
    description: "Alibaba's largest Mixture-of-Experts model, featuring 397B total parameters, optimized for complex reasoning.",
    contextWindow: '262k tokens',
    pricing: { input: '$0.60 / 1M', output: '$3.60 / 1M' },
    tags: ['Reasoning', 'Multilingual', 'Coding']
  },
  {
    id: 'qwen/qwen3-next-80b-a3b-instruct',
    name: 'Qwen 3 Next 80B',
    provider: 'nvidia',
    description: "Alibaba's advanced hybrid Transformer-Mamba network using a high-sparsity MoE design, optimized for long-context tasks.",
    contextWindow: '262k tokens',
    pricing: { input: '$0.15 / 1M', output: '$1.50 / 1M' },
    tags: ['Long-Context', 'Tool-Use', 'Agentic']
  },
  {
    id: 'microsoft/phi-4-multimodal-instruct',
    name: 'Phi-4 Multimodal',
    provider: 'nvidia',
    description: "Microsoft's lightweight 5.6B multimodal model, delivering top-tier performance on text, image, and audio tasks.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Multimodal', 'Vision', 'Audio', 'Fast']
  },
  {
    id: 'microsoft/phi-4-mini-instruct',
    name: 'Phi-4 Mini',
    provider: 'nvidia',
    description: "Microsoft's highly capable 3.8B small language model, optimized for reasoning, math, and coding.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.08 / 1M', output: '$0.35 / 1M' },
    tags: ['Fast', 'Reasoning', 'Coding']
  },
  {
    id: 'sarvamai/sarvam-m',
    name: 'Sarvam-M',
    provider: 'nvidia',
    description: "Sarvam AI's 24B parameter multilingual model, built on Mistral-Small and optimized for Indian languages, math, and coding.",
    contextWindow: '8k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Multilingual', 'Math', 'Coding']
  },
  {
    id: 'bytedance/seed-oss-36b-instruct',
    name: 'Seed-OSS 36B Instruct',
    provider: 'nvidia',
    description: "ByteDance's open-weights model featuring robust reasoning and instruction following capabilities.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Reasoning', 'Fast', 'Coding']
  },
  {
    id: 'google/diffusiongemma-26b-a4b-it',
    name: 'DiffusionGemma 26B',
    provider: 'nvidia',
    description: "Google's open-weights model designed for generative diffusion tasks and instruction-following.",
    contextWindow: '8k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Multimodal', 'Reasoning', 'Fast']
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b',
    name: 'Nemotron 3 Ultra 550B',
    provider: 'nvidia',
    description: "NVIDIA's frontier-scale language model featuring 550B parameters for complex reasoning and thinking.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Reasoning', 'Deep-Thinking', 'Agentic']
  },
  {
    id: 'google/gemma-4-31b-it',
    name: 'Gemma 4 31B IT',
    provider: 'nvidia',
    description: "Google's next-generation open-weights model optimized for instruction following and reasoning.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Reasoning', 'Coding', 'Fast']
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    name: 'Nemotron-3 Nano Omni 30B (Reasoning)',
    provider: 'nvidia',
    description: "NVIDIA's lightweight omni reasoning model, optimized for transparent chain-of-thought and rapid reasoning.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Reasoning', 'Fast', 'Transparent-CoT']
  },
  {
    id: 'nvidia/nemotron-nano-12b-v2-vl',
    name: 'Nemotron Nano 12B VL',
    provider: 'nvidia',
    description: "NVIDIA's multimodal vision-language model, optimized for video and image understanding.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Vision', 'Multimodal', 'Fast']
  },
  {
    id: 'nvidia/nvidia-nemotron-nano-9b-v2',
    name: 'Nemotron Nano 9B V2 (Reasoning)',
    provider: 'nvidia',
    description: "NVIDIA's highly efficient 9B reasoning model, designed for fast reasoning tasks with custom thinking tokens.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Reasoning', 'Fast']
  },
  {
    id: 'google/gemma-3n-e4b-it',
    name: 'Gemma 3N E4B IT',
    provider: 'nvidia',
    description: "Google's Gemma 3N iteration model, optimized for instruction following and reasoning tasks.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Reasoning', 'Fast']
  },
  {
    id: 'google/gemma-3n-e2b-it',
    name: 'Gemma 3N E2B IT',
    provider: 'nvidia',
    description: "Google's Gemma 3N iteration model, designed for rapid responses and lightweight edge tasks.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Fast', 'Cost-Effective']
  },
  {
    id: 'mistralai/mistral-nemotron',
    name: 'Mistral Nemotron',
    provider: 'nvidia',
    description: "Mistral's model optimized in collaboration with NVIDIA, delivering fast and high-context reasoning.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Chat', 'Reasoning', 'Fast']
  },
  {
    id: 'nvidia/nemotron-mini-4b-instruct',
    name: 'Nemotron Mini 4B Instruct',
    provider: 'nvidia',
    description: "NVIDIA's mini 4B model, designed for fast instruction following and local edge-device tasks.",
    contextWindow: '32k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Fast', 'Edge', 'Chat']
  }
];
