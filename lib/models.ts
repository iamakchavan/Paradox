export type AgentReasoningEffort = 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'google' | 'mistral' | 'perplexity' | 'zenmux' | 'nvidia' | 'inception';
  description: string;
  contextWindow: string;
  maxOutputTokens?: string;
  pricing: { input: string; output: string };
  tags: string[]; // e.g. ["Vision", "Coding", "Reasoning", "Fast"]
  agentApi?: {
    reasoningEffort?: AgentReasoningEffort;
  };
}

export const MODELS_REGISTRY: ModelConfig[] = [
  // --- GOOGLE PROVIDER ---
  {
    id: 'gemini-3-flash-preview',
    name: 'Gemini 3 Flash (Preview)',
    provider: 'google',
    description: "Google's fast multimodal preview model for agentic coding, reasoning, and computer-use workflows.",
    contextWindow: '1M tokens',
    maxOutputTokens: '64k tokens',
    pricing: { input: '$0.50 / 1M', output: '$3.00 / 1M' },
    tags: ['Fast', 'Multimodal', 'Agentic', 'Coding']
  },
  {
    id: 'gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Preview)',
    provider: 'google',
    description: "Google's advanced preview model for complex problem solving, multimodal reasoning, and agentic coding.",
    contextWindow: '1M tokens',
    maxOutputTokens: '64k tokens',
    pricing: { input: '$2.00 / 1M (<=200k) | $4.00 / 1M (>200k)', output: '$12.00 / 1M (<=200k) | $18.00 / 1M (>200k)' },
    tags: ['Reasoning', 'Multimodal', 'Agentic', 'Coding']
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    description: "Google's price-performance thinking model for low-latency, high-volume, and agentic workloads.",
    contextWindow: '1M tokens',
    maxOutputTokens: '64k tokens',
    pricing: { input: '$0.30 / 1M', output: '$2.50 / 1M' },
    tags: ['Fast', 'Reasoning', 'Multimodal', 'Agentic']
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    description: "Google's advanced thinking model for code, mathematics, STEM, and analysis of large documents and codebases.",
    contextWindow: '1M tokens',
    maxOutputTokens: '64k tokens',
    pricing: { input: '$1.25 / 1M (<=200k) | $2.50 / 1M (>200k)', output: '$10.00 / 1M (<=200k) | $15.00 / 1M (>200k)' },
    tags: ['Reasoning', 'Coding', 'Multimodal', 'Long Context']
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'google',
    description: "Google's fastest budget multimodal model for classification, extraction, translation, and high-throughput tasks.",
    contextWindow: '1M tokens',
    maxOutputTokens: '64k tokens',
    pricing: { input: '$0.10 / 1M', output: '$0.40 / 1M' },
    tags: ['Fast', 'Cost-Effective', 'Multimodal', 'High Throughput']
  },

  // --- MISTRAL PROVIDER ---
  {
    id: 'mistral-large-latest',
    name: 'Mistral Large 3',
    provider: 'mistral',
    description: "Mistral's flagship open-weight multimodal model for complex reasoning, coding, multilingual work, and agentic workflows.",
    contextWindow: '256k tokens',
    pricing: { input: '$0.50 / 1M', output: '$1.50 / 1M' },
    tags: ['Reasoning', 'Coding', 'Multimodal', 'Agentic']
  },
  {
    id: 'mistral-medium-latest',
    name: 'Mistral Medium 3.5',
    provider: 'mistral',
    description: "Mistral's balanced multimodal model for enterprise chat, coding, tool use, and agentic workflows.",
    contextWindow: '256k tokens',
    pricing: { input: '$1.50 / 1M', output: '$7.50 / 1M' },
    tags: ['Reasoning', 'Coding', 'Multimodal', 'Agentic']
  },
  {
    id: 'mistralai/mistral-medium-3.5-128b',
    name: 'Mistral Medium 3.5 128B',
    provider: 'nvidia',
    description: "Mistral's dense multimodal model with configurable reasoning for coding, instruction following, and agentic workflows on NVIDIA Build.",
    contextWindow: '256k tokens',
    pricing: { input: '$0.50 / 1M', output: '$1.50 / 1M' },
    tags: ['Reasoning', 'Coding', 'Multimodal', 'Agentic']
  },
  {
    id: 'mistral-small-latest',
    name: 'Mistral Small 4',
    provider: 'mistral',
    description: "Mistral's efficient hybrid instruct and reasoning model for multimodal coding, agents, and general-purpose work.",
    contextWindow: '256k tokens',
    pricing: { input: '$0.15 / 1M', output: '$0.60 / 1M' },
    tags: ['Reasoning', 'Coding', 'Multimodal', 'Fast']
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
    description: "Mistral's legacy 123B multimodal model for image understanding and visual reasoning, superseded by Mistral Medium 3.5.",
    contextWindow: '128k tokens',
    pricing: { input: '$2.00 / 1M', output: '$6.00 / 1M' },
    tags: ['Vision', 'Multimodal', 'Legacy']
  },
  {
    id: 'pixtral-12b-2409',
    name: 'Pixtral 12B',
    provider: 'mistral',
    description: "Mistral's legacy open-weight 12B vision model, superseded by Ministral 3 14B for current multimodal workloads.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.15 / 1M', output: '$0.15 / 1M' },
    tags: ['Vision', 'Multimodal', 'Legacy']
  },
  {
    id: 'mistralai/mixtral-8x7b-instruct-v0.1',
    name: 'Mixtral 8x7B Instruct',
    provider: 'nvidia',
    description: "Mistral's legacy sparse Mixture-of-Experts instruction model for efficient text generation on NVIDIA Build.",
    contextWindow: '32k tokens',
    pricing: { input: '$0.15 / 1M', output: '$0.15 / 1M' },
    tags: ['Generalist', 'Mixture of Experts', 'Legacy']
  },
  {
    id: 'ministral-8b-latest',
    name: 'Ministral 3 8B',
    provider: 'mistral',
    description: "Mistral's compact multimodal edge model for local assistants, image understanding, and low-latency applications.",
    contextWindow: '256k tokens',
    pricing: { input: '$0.15 / 1M', output: '$0.15 / 1M' },
    tags: ['Edge', 'Multimodal', 'Fast', 'Cost-Effective']
  },
  {
    id: 'ministral-3b-latest',
    name: 'Ministral 3 3B',
    provider: 'mistral',
    description: "Mistral's smallest multimodal edge model for efficient local assistants and resource-constrained deployments.",
    contextWindow: '256k tokens',
    pricing: { input: '$0.10 / 1M', output: '$0.10 / 1M' },
    tags: ['Edge', 'Multimodal', 'Mobile', 'Fast']
  },
  {
    id: 'mistralai/ministral-14b-instruct-2512',
    name: 'Ministral 3 14B',
    provider: 'nvidia',
    description: "Mistral's compact multimodal model for edge deployment, instruction following, and visual understanding on NVIDIA Build.",
    contextWindow: '256k tokens',
    pricing: { input: '$0.15 / 1M', output: '$0.15 / 1M' },
    tags: ['Edge', 'Multimodal', 'Fast', 'Cost-Effective']
  },
  {
    id: 'mistralai/mistral-nemotron',
    name: 'Mistral Nemotron',
    provider: 'nvidia',
    description: "Mistral and NVIDIA's text model for instruction following, coding, function calling, and agentic workflows.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Coding', 'Function Calling', 'Agentic']
  },

  // --- PERPLEXITY PROVIDER ---
  {
    id: 'sonar',
    name: 'Sonar',
    provider: 'perplexity',
    description: "Perplexity's lightweight search model for quick, grounded answers and straightforward Q&A with real-time web search.",
    contextWindow: '128k tokens',
    pricing: { input: '$1.00 / 1M', output: '$1.00 / 1M' },
    tags: ['Search', 'Fast', 'Web-Grounded']
  },
  {
    id: 'sonar-pro',
    name: 'Sonar Pro',
    provider: 'perplexity',
    description: "Perplexity's advanced non-reasoning search model for complex, multi-step Q&A, with enhanced retrieval and twice the search results of Sonar.",
    contextWindow: '200k tokens',
    pricing: { input: '$3.00 / 1M', output: '$15.00 / 1M' },
    tags: ['Search', 'Complex Q&A', 'Web-Grounded']
  },
  {
    id: 'sonar-reasoning-pro',
    name: 'Sonar Reasoning Pro',
    provider: 'perplexity',
    description: "Perplexity's advanced reasoning model for complex problem-solving, combining multi-step chain-of-thought reasoning with enhanced information retrieval.",
    contextWindow: '128k tokens',
    pricing: { input: '$2.00 / 1M', output: '$8.00 / 1M' },
    tags: ['Reasoning', 'Search', 'Multi-Step']
  },
  {
    id: 'sonar-deep-research',
    name: 'Sonar Deep Research',
    provider: 'perplexity',
    description: "Perplexity's expert research model for exhaustive searches across hundreds of sources, deep analysis, and comprehensive report generation.",
    contextWindow: '128k tokens',
    pricing: { input: '$2.00 / 1M', output: '$8.00 / 1M' },
    tags: ['Deep Research', 'Reasoning', 'Reports']
  },
  {
    id: 'anthropic/claude-haiku-4-5',
    name: 'Claude Haiku 4.5',
    provider: 'perplexity',
    description: "Anthropic's fastest model with near-frontier intelligence, built for low-latency coding, computer use, and high-volume agent workflows.",
    contextWindow: '200k tokens',
    maxOutputTokens: '64k tokens',
    pricing: { input: '$1.00 / 1M', output: '$5.00 / 1M' },
    tags: ['Fast', 'Coding', 'Cost-Effective']
  },
  {
    id: 'anthropic/claude-opus-4-5',
    name: 'Claude Opus 4.5',
    provider: 'perplexity',
    description: "Anthropic's advanced model for coding, agents, computer use, deep research, and professional document workflows.",
    contextWindow: '200k tokens',
    maxOutputTokens: '64k tokens',
    pricing: { input: '$5.00 / 1M', output: '$25.00 / 1M' },
    tags: ['Reasoning', 'Coding', 'Computer Use']
  },
  {
    id: 'anthropic/claude-opus-4-6',
    name: 'Claude Opus 4.6',
    provider: 'perplexity',
    description: "Anthropic's highly capable model for complex agentic tasks, long-horizon work, coding, and adaptive reasoning.",
    contextWindow: '1M tokens',
    maxOutputTokens: '128k tokens',
    pricing: { input: '$5.00 / 1M', output: '$25.00 / 1M' },
    tags: ['Reasoning', 'Coding', 'Agentic']
  },
  {
    id: 'anthropic/claude-opus-4-7',
    name: 'Claude Opus 4.7',
    provider: 'perplexity',
    description: "Anthropic's highly autonomous model for long-horizon agentic work, complex coding, knowledge work, vision, and memory tasks.",
    contextWindow: '1M tokens',
    maxOutputTokens: '128k tokens',
    pricing: { input: '$5.00 / 1M', output: '$25.00 / 1M' },
    tags: ['Reasoning', 'Agentic', 'Vision']
  },
  {
    id: 'anthropic/claude-opus-4-8',
    name: 'Claude Opus 4.8',
    provider: 'perplexity',
    description: "Anthropic's most capable Opus-tier model for complex agentic coding, enterprise work, advanced reasoning, and autonomous workflows.",
    contextWindow: '1M tokens',
    maxOutputTokens: '128k tokens',
    pricing: { input: '$5.00 / 1M', output: '$25.00 / 1M' },
    tags: ['Reasoning', 'Coding', 'Agentic']
  },
  {
    id: 'anthropic/claude-sonnet-4-5',
    name: 'Claude Sonnet 4.5',
    provider: 'perplexity',
    description: "Anthropic's balanced model for everyday coding, analysis, content, and agent workflows, combining strong intelligence with fast performance.",
    contextWindow: '200k tokens',
    maxOutputTokens: '64k tokens',
    pricing: { input: '$3.00 / 1M', output: '$15.00 / 1M' },
    tags: ['Reasoning', 'Coding', 'Agentic']
  },
  {
    id: 'anthropic/claude-sonnet-4-6',
    name: 'Claude Sonnet 4.6',
    provider: 'perplexity',
    description: "Anthropic's balanced model combining speed and intelligence for coding, agentic search, tool use, and everyday professional work.",
    contextWindow: '1M tokens',
    maxOutputTokens: '128k tokens',
    pricing: { input: '$3.00 / 1M', output: '$15.00 / 1M' },
    tags: ['Reasoning', 'Coding', 'Agentic']
  },
  {
    id: 'anthropic/claude-sonnet-5',
    name: 'Claude Sonnet 5',
    provider: 'perplexity',
    description: "Anthropic's most agentic Sonnet model, offering frontier intelligence at scale for coding, tools, enterprise workflows, and knowledge work.",
    contextWindow: '1M tokens',
    maxOutputTokens: '128k tokens',
    pricing: { input: '$2.00 / 1M', output: '$10.00 / 1M' },
    tags: ['Reasoning', 'Coding', 'Agentic']
  },
  {
    id: 'xai/grok-4.5',
    name: 'Grok 4.5',
    provider: 'perplexity',
    description: "xAI's frontier multimodal reasoning model for coding, agentic tasks, and knowledge work, accessed via Perplexity Agent API.",
    contextWindow: '500k tokens',
    pricing: { input: '$2.00 / 1M (<=200k) | $4.00 / 1M (>200k)', output: '$6.00 / 1M (<=200k) | $12.00 / 1M (>200k)' },
    tags: ['Reasoning', 'Coding', 'Multimodal', 'Agentic'],
    agentApi: { reasoningEffort: 'medium' }
  },
  {
    id: 'xai/grok-4.20-reasoning',
    name: 'Grok 4.20 Reasoning',
    provider: 'perplexity',
    description: "xAI's long-context reasoning model for complex analysis, coding, and tool-driven agent workflows, accessed via Perplexity Agent API.",
    contextWindow: '1M tokens',
    pricing: { input: '$1.25 / 1M (<=200k) | $2.50 / 1M (>200k)', output: '$2.50 / 1M (<=200k) | $5.00 / 1M (>200k)' },
    tags: ['Reasoning', 'Coding', 'Agentic']
  },
  {
    id: 'xai/grok-4.20-multi-agent',
    name: 'Grok 4.20 Multi-Agent',
    provider: 'perplexity',
    description: "xAI's server-side multi-agent model that coordinates multiple agents and synthesizes their work through a leader agent.",
    contextWindow: '1M tokens',
    pricing: { input: '$1.25 / 1M (<=200k) | $2.50 / 1M (>200k)', output: '$2.50 / 1M (<=200k) | $5.00 / 1M (>200k)' },
    tags: ['Multi-Agent', 'Reasoning', 'Agentic']
  },
  {
    id: 'xai/grok-4.20-non-reasoning',
    name: 'Grok 4.20',
    provider: 'perplexity',
    description: "xAI's direct, non-reasoning long-context model for fast agentic tool use, coding, and general workloads.",
    contextWindow: '1M tokens',
    pricing: { input: '$1.25 / 1M (<=200k) | $2.50 / 1M (>200k)', output: '$2.50 / 1M (<=200k) | $5.00 / 1M (>200k)' },
    tags: ['Fast', 'Coding', 'Agentic']
  },
  {
    id: 'xai/grok-4.3',
    name: 'Grok 4.3',
    provider: 'perplexity',
    description: "xAI's long-context foundation model for reasoning, coding, agentic tool use, and high-accuracy professional work.",
    contextWindow: '1M tokens',
    pricing: { input: '$1.25 / 1M (<=200k) | $2.50 / 1M (>200k)', output: '$2.50 / 1M (<=200k) | $5.00 / 1M (>200k)' },
    tags: ['Reasoning', 'Coding', 'Agentic']
  },
  {
    id: 'perplexity/glm-5.2',
    name: 'GLM 5.2',
    provider: 'perplexity',
    description: "Z.AI's flagship reasoning and coding model for project-scale engineering and stable long-horizon execution, accessed through the Perplexity Agent API.",
    contextWindow: '1M tokens',
    maxOutputTokens: '128k tokens',
    pricing: { input: '$1.40 / 1M', output: '$4.40 / 1M' },
    tags: ['Reasoning', 'Coding', 'Agentic']
  },
  {
    id: 'perplexity/kimi-k2.7-code',
    name: 'Kimi K2.7 Code',
    provider: 'perplexity',
    description: "Moonshot AI's strongest coding model for long-horizon software engineering, agentic tool use, multimodal input, and long-thinking workflows, accessed through the Perplexity Agent API.",
    contextWindow: '256k tokens',
    pricing: { input: '$0.95 / 1M', output: '$4.00 / 1M' },
    tags: ['Coding', 'Reasoning', 'Agentic', 'Multimodal']
  },
  {
    id: 'google/gemini-3-flash-preview',
    name: 'Gemini 3 Flash (Preview)',
    provider: 'perplexity',
    description: "Google's fast multimodal preview model for agentic coding, reasoning, and computer-use workflows, accessed via Perplexity Agent API.",
    contextWindow: '1M tokens',
    maxOutputTokens: '64k tokens',
    pricing: { input: '$0.50 / 1M', output: '$3.00 / 1M' },
    tags: ['Fast', 'Multimodal', 'Agentic', 'Preview']
  },
  {
    id: 'google/gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    provider: 'perplexity',
    description: "Google's low-latency multimodal model for high-volume agentic workloads, extraction, and translation, accessed via Perplexity Agent API.",
    contextWindow: '1M tokens',
    maxOutputTokens: '64k tokens',
    pricing: { input: '$0.25 / 1M', output: '$1.50 / 1M' },
    tags: ['Fast', 'Cost-Effective', 'Multimodal', 'High Throughput']
  },
  {
    id: 'google/gemini-3.1-flash-lite-preview',
    name: 'Gemini 3.1 Flash Lite (Preview)',
    provider: 'perplexity',
    description: "Google's earlier Flash-Lite preview, superseded by the stable Gemini 3.1 Flash-Lite release and retained for Agent API compatibility.",
    contextWindow: '1M tokens',
    maxOutputTokens: '64k tokens',
    pricing: { input: '$0.25 / 1M', output: '$1.50 / 1M' },
    tags: ['Fast', 'Multimodal', 'Legacy', 'Preview']
  },
  {
    id: 'google/gemini-3.1-pro-preview',
    name: 'Gemini 3.1 Pro (Preview)',
    provider: 'perplexity',
    description: "Google's advanced preview model for complex problem solving, multimodal reasoning, and agentic coding, accessed via Perplexity Agent API.",
    contextWindow: '1M tokens',
    maxOutputTokens: '64k tokens',
    pricing: { input: '$2.00 / 1M (<=200k) | $4.00 / 1M (>200k)', output: '$12.00 / 1M (<=200k) | $18.00 / 1M (>200k)' },
    tags: ['Reasoning', 'Multimodal', 'Agentic', 'Preview']
  },
  {
    id: 'google/gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'perplexity',
    description: "Google's frontier multimodal model for coding, long-horizon reasoning, subagents, and computer-use workflows, accessed via Perplexity Agent API.",
    contextWindow: '1M tokens',
    maxOutputTokens: '64k tokens',
    pricing: { input: '$1.50 / 1M', output: '$9.00 / 1M' },
    tags: ['Reasoning', 'Multimodal', 'Agentic', 'Coding']
  },
  {
    id: 'openai/gpt-5.6-sol',
    name: 'GPT 5.6 Sol',
    provider: 'perplexity',
    description: "OpenAI's flagship model for complex professional work, advanced reasoning, agentic coding, cybersecurity, and science.",
    contextWindow: '1.05M tokens',
    maxOutputTokens: '128k tokens',
    pricing: { input: '$5.00 / 1M', output: '$30.00 / 1M' },
    tags: ['Reasoning', 'Coding', 'Agentic'],
    agentApi: { reasoningEffort: 'medium' }
  },
  {
    id: 'openai/gpt-5.6-terra',
    name: 'GPT 5.6 Terra',
    provider: 'perplexity',
    description: "OpenAI's balanced GPT 5.6 model for everyday and enterprise work, combining strong intelligence with lower cost.",
    contextWindow: '1.05M tokens',
    maxOutputTokens: '128k tokens',
    pricing: { input: '$2.50 / 1M', output: '$15.00 / 1M' },
    tags: ['Reasoning', 'Coding', 'Agentic'],
    agentApi: { reasoningEffort: 'medium' }
  },
  {
    id: 'openai/gpt-5.6-luna',
    name: 'GPT 5.6 Luna',
    provider: 'perplexity',
    description: "OpenAI's fastest and most affordable GPT 5.6 model, optimized for cost-sensitive, high-volume workloads.",
    contextWindow: '1.05M tokens',
    maxOutputTokens: '128k tokens',
    pricing: { input: '$1.00 / 1M', output: '$6.00 / 1M' },
    tags: ['Fast', 'Reasoning', 'Cost-Effective']
  },
  {
    id: 'openai/gpt-5',
    name: 'GPT 5',
    provider: 'perplexity',
    description: "OpenAI's previous intelligent reasoning model for coding and agentic tasks, with configurable reasoning effort.",
    contextWindow: '400k tokens',
    maxOutputTokens: '128k tokens',
    pricing: { input: '$1.25 / 1M', output: '$10.00 / 1M' },
    tags: ['Reasoning', 'Coding', 'Agentic']
  },
  {
    id: 'openai/gpt-5.1',
    name: 'GPT 5.1',
    provider: 'perplexity',
    description: "OpenAI's coding and agentic model with adaptive reasoning for faster simple tasks and configurable reasoning effort.",
    contextWindow: '400k tokens',
    maxOutputTokens: '128k tokens',
    pricing: { input: '$1.25 / 1M', output: '$10.00 / 1M' },
    tags: ['Reasoning', 'Coding', 'Agentic']
  },
  {
    id: 'openai/gpt-5.2',
    name: 'GPT 5.2',
    provider: 'perplexity',
    description: "OpenAI's previous frontier model for complex professional work, with strong logical, mathematical, and agentic reasoning.",
    contextWindow: '400k tokens',
    maxOutputTokens: '128k tokens',
    pricing: { input: '$1.75 / 1M', output: '$14.00 / 1M' },
    tags: ['Reasoning', 'Coding', 'Agentic']
  },
  {
    id: 'openai/gpt-5.4',
    name: 'GPT 5.4',
    provider: 'perplexity',
    description: "OpenAI's frontier model for complex professional work, with native computer use and strong visual understanding.",
    contextWindow: '1.05M tokens',
    maxOutputTokens: '128k tokens',
    pricing: { input: '$2.50 / 1M', output: '$15.00 / 1M' },
    tags: ['Reasoning', 'Coding', 'Computer Use']
  },
  {
    id: 'openai/gpt-5.5',
    name: 'GPT 5.5',
    provider: 'perplexity',
    description: "OpenAI's premium agentic model for long-horizon autonomous workflows, browser and desktop control, and high-accuracy professional work.",
    contextWindow: '1.05M tokens',
    maxOutputTokens: '128k tokens',
    pricing: { input: '$5.00 / 1M', output: '$30.00 / 1M' },
    tags: ['Reasoning', 'Agentic', 'Computer Use']
  },
  {
    id: 'openai/gpt-5-mini',
    name: 'GPT 5 Mini',
    provider: 'perplexity',
    description: "OpenAI's faster, cost-efficient GPT 5 model for well-defined, low-latency, high-volume workloads.",
    contextWindow: '400k tokens',
    maxOutputTokens: '128k tokens',
    pricing: { input: '$0.25 / 1M', output: '$2.00 / 1M' },
    tags: ['Fast', 'Reasoning', 'Cost-Effective']
  },
  {
    id: 'openai/gpt-5.4-mini',
    name: 'GPT 5.4 Mini',
    provider: 'perplexity',
    description: "OpenAI's strongest mini model for high-volume coding, computer-use, and subagent workloads.",
    contextWindow: '400k tokens',
    maxOutputTokens: '128k tokens',
    pricing: { input: '$0.75 / 1M', output: '$4.50 / 1M' },
    tags: ['Fast', 'Coding', 'Computer Use']
  },
  {
    id: 'openai/gpt-5.4-nano',
    name: 'GPT 5.4 Nano',
    provider: 'perplexity',
    description: "OpenAI's lowest-cost GPT 5.4 model for simple, high-volume tasks such as classification, extraction, ranking, and subagents.",
    contextWindow: '400k tokens',
    maxOutputTokens: '128k tokens',
    pricing: { input: '$0.20 / 1M', output: '$1.25 / 1M' },
    tags: ['Fast', 'Cost-Effective']
  },
  // --- INCEPTION LABS PROVIDER ---
  {
    id: 'mercury-2',
    name: 'Mercury 2',
    provider: 'inception',
    description: "Inception Labs' fastest reasoning diffusion language model, with tool calling and structured output for latency-sensitive applications.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.25 / 1M', output: '$0.75 / 1M' },
    tags: ['Diffusion', 'Fast', 'Reasoning', 'Tool Use']
  },
  // --- ZENMUX PROVIDER ---
  {
    id: 'moonshotai/kimi-k2.7-code-free',
    name: 'Kimi K2.7 Code (Free)',
    provider: 'zenmux',
    description: "Moonshot AI's free long-context coding route with multimodal input, long thinking, tool use, and agentic software workflows.",
    contextWindow: '256k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Coding', 'Reasoning', 'Multimodal', 'Free']
  },
  {
    id: 'z-ai/glm-4.6v-flash-free',
    name: 'GLM 4.6V Flash (Free)',
    provider: 'zenmux',
    description: "Z.AI's free multimodal model with configurable reasoning, native function calling, and visual agent capabilities.",
    contextWindow: '200k tokens',
    maxOutputTokens: '128k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Multimodal', 'Reasoning', 'Function Calling', 'Free']
  },
  {
    id: 'z-ai/glm-4.7-flash-free',
    name: 'GLM 4.7 Flash (Free)',
    provider: 'zenmux',
    description: "Z.AI's free 30B-class model for efficient agentic coding, long-horizon planning, and tool collaboration.",
    contextWindow: '200k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Fast', 'Coding', 'Agentic', 'Free']
  },
  // --- NVIDIA PROVIDER ---
  {
    id: 'deepseek-ai/deepseek-v4-flash',
    name: 'DeepSeek V4 Flash',
    provider: 'nvidia',
    description: "DeepSeek's efficient 284B MoE model with selectable reasoning modes for fast coding, tool use, and agentic workflows.",
    contextWindow: '1M tokens',
    pricing: { input: '$0.14 / 1M', output: '$0.28 / 1M' },
    tags: ['Reasoning', 'Coding', 'Agentic', 'Fast']
  },
  {
    id: 'stepfun-ai/step-3.7-flash',
    name: 'Step 3.7 Flash',
    provider: 'nvidia',
    description: "StepFun's fast multimodal model for visual understanding, coding, GUI tasks, tool use, and agentic workflows.",
    contextWindow: '256k tokens',
    pricing: { input: '$0.20 / 1M', output: '$1.15 / 1M' },
    tags: ['Fast', 'Multimodal', 'Coding', 'Agentic']
  },
  {
    id: 'moonshotai/kimi-k2.6',
    name: 'Kimi K2.6',
    provider: 'nvidia',
    description: "Moonshot AI's native multimodal MoE model for long-horizon coding, visual reasoning, and large-scale agent orchestration.",
    contextWindow: '256k tokens',
    pricing: { input: '$0.95 / 1M', output: '$4.00 / 1M' },
    tags: ['Reasoning', 'Coding', 'Multimodal', 'Agentic']
  },
  {
    id: 'deepseek-ai/deepseek-v4-pro',
    name: 'DeepSeek V4 Pro',
    provider: 'nvidia',
    description: "DeepSeek's frontier 1.6T MoE model with selectable reasoning modes for complex coding, tool use, and agentic problem solving.",
    contextWindow: '1M tokens',
    pricing: { input: '$0.435 / 1M', output: '$0.87 / 1M' },
    tags: ['Coding', 'Reasoning', 'Agentic']
  },
  {
    id: 'z-ai/glm-5.2',
    name: 'GLM 5.2',
    provider: 'nvidia',
    description: "Z.AI's flagship long-context model for reasoning, project-scale coding, debugging, and sustained agentic workflows.",
    contextWindow: '1M tokens',
    pricing: { input: '$1.40 / 1M', output: '$4.40 / 1M' },
    tags: ['Reasoning', 'Coding', 'Agentic', 'Long Context']
  },

  {
    id: 'qwen/qwen3.5-122b-a10b',
    name: 'Qwen 3.5 122B',
    provider: 'nvidia',
    description: "Qwen's efficient multimodal MoE model for reasoning, coding, visual understanding, tool use, and native agent workflows.",
    contextWindow: '262k tokens',
    pricing: { input: '$0.40 / 1M', output: '$2.00 / 1M' },
    tags: ['Reasoning', 'Coding', 'Multimodal', 'Agentic']
  },
  {
    id: 'stepfun-ai/step-3.5-flash',
    name: 'Step 3.5 Flash',
    provider: 'nvidia',
    description: "StepFun's efficient reasoning MoE model for coding assistants, deep-research agents, GUI automation, and tool calling.",
    contextWindow: '256k tokens',
    pricing: { input: '$0.09 / 1M', output: '$0.30 / 1M' },
    tags: ['Fast', 'Reasoning', 'Coding', 'Agentic']
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT OSS 120B',
    provider: 'nvidia',
    description: "OpenAI's larger open-weight MoE model with configurable reasoning effort, tool use, and structured outputs.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.35 / 1M', output: '$0.87 / 1M' },
    tags: ['Reasoning', 'Agentic', 'Tool Use', 'Open Weights']
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b',
    name: 'Nemotron 3 Super',
    provider: 'nvidia',
    description: "NVIDIA's efficient 120B MoE model for long-context reasoning, collaborative agents, tool use, and high-volume workloads.",
    contextWindow: '1M tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Reasoning', 'Agentic', 'Tool Use', 'Long Context']
  },
  {
    id: 'openai/gpt-oss-20b',
    name: 'GPT OSS 20B',
    provider: 'nvidia',
    description: "OpenAI's compact open-weight MoE model for low-latency reasoning, local deployment, tool use, and specialized workloads.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.029 / 1M', output: '$0.14 / 1M' },
    tags: ['Fast', 'Reasoning', 'Tool Use', 'Open Weights']
  },
  {
    id: 'minimaxai/minimax-m3',
    name: 'MiniMax M3',
    provider: 'nvidia',
    description: "MiniMax's multimodal MoE model for long-form video, extended coding, creative workflows, and long-horizon agents.",
    contextWindow: '1M tokens',
    pricing: { input: '$0.30 / 1M', output: '$1.20 / 1M' },
    tags: ['Multimodal', 'Coding', 'Agentic', 'Long Context']
  },
  {
    id: 'minimaxai/minimax-m2.7',
    name: 'MiniMax M2.7',
    provider: 'nvidia',
    description: "MiniMax's text model for long-horizon software engineering, agentic tool use, production troubleshooting, and office workflows.",
    contextWindow: '205k tokens',
    pricing: { input: '$0.30 / 1M', output: '$1.20 / 1M' },
    tags: ['Coding', 'Agentic', 'Tool Use', 'Productivity']
  },
  {
    id: 'qwen/qwen3.5-397b-a17b',
    name: 'Qwen 3.5 397B',
    provider: 'nvidia',
    description: "Qwen's large multimodal MoE model for reasoning, coding, video understanding, function calling, and agentic workflows.",
    contextWindow: '262k tokens',
    pricing: { input: '$0.60 / 1M', output: '$3.60 / 1M' },
    tags: ['Reasoning', 'Coding', 'Multimodal', 'Agentic']
  },
  {
    id: 'qwen/qwen3-next-80b-a3b-instruct',
    name: 'Qwen 3 Next 80B',
    provider: 'nvidia',
    description: "Qwen's efficient non-thinking hybrid MoE model for ultra-long-context instruction following, tool use, and agent applications.",
    contextWindow: '262k tokens',
    pricing: { input: '$0.15 / 1M', output: '$1.50 / 1M' },
    tags: ['Long Context', 'Fast', 'Tool Use', 'Agentic']
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
    description: "ByteDance's open-weight text model with controllable thinking budgets, tool calling, and native long-context reasoning.",
    contextWindow: '512k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Reasoning', 'Agentic', 'Tool Use', 'Long Context']
  },
  {
    id: 'google/diffusiongemma-26b-a4b-it',
    name: 'DiffusionGemma 26B A4B IT',
    provider: 'nvidia',
    description: "Google DeepMind's open multimodal diffusion model with parallel token generation, configurable reasoning, and native function calling.",
    contextWindow: '256k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Multimodal', 'Reasoning', 'Fast', 'Agentic']
  },
  {
    id: 'nvidia/nemotron-3-ultra-550b-a55b',
    name: 'Nemotron 3 Ultra 550B',
    provider: 'nvidia',
    description: "NVIDIA's frontier 550B MoE model for complex agents, high-accuracy reasoning, tool use, and long-context analysis.",
    contextWindow: '1M tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Reasoning', 'Agentic', 'Tool Use', 'Long Context']
  },
  {
    id: 'google/gemma-4-31b-it',
    name: 'Gemma 4 31B IT',
    provider: 'nvidia',
    description: "Google DeepMind's open multimodal model for reasoning, coding, agentic workflows, function calling, and long-context understanding.",
    contextWindow: '256k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Reasoning', 'Coding', 'Multimodal', 'Agentic']
  },
  {
    id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
    name: 'Nemotron-3 Nano Omni 30B (Reasoning)',
    provider: 'nvidia',
    description: "NVIDIA's multimodal reasoning model for text, images, audio, video, transcription, document intelligence, and tool calling.",
    contextWindow: '256k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Reasoning', 'Multimodal', 'Audio', 'Tool Use']
  },
  {
    id: 'nvidia/nemotron-nano-12b-v2-vl',
    name: 'Nemotron Nano 12B VL',
    provider: 'nvidia',
    description: "NVIDIA's multimodal model for multi-image reasoning, video understanding, document intelligence, visual Q&A, and summarization.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Vision', 'Video', 'Reasoning', 'Document AI']
  },
  {
    id: 'nvidia/nvidia-nemotron-nano-9b-v2',
    name: 'Nemotron Nano 9B V2 (Reasoning)',
    provider: 'nvidia',
    description: "NVIDIA's efficient hybrid text model with switchable reasoning and runtime thinking-budget control for agents and RAG.",
    contextWindow: '128k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Reasoning', 'Fast', 'Agentic', 'RAG']
  },
  {
    id: 'google/gemma-3n-e4b-it',
    name: 'Gemma 3n E4B IT',
    provider: 'nvidia',
    description: "Google DeepMind's efficient open multimodal model for text, image, video, and audio tasks on resource-constrained devices.",
    contextWindow: '32k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Multimodal', 'Fast', 'Edge', 'Multilingual']
  },
  {
    id: 'google/gemma-3n-e2b-it',
    name: 'Gemma 3n E2B IT',
    provider: 'nvidia',
    description: "Google DeepMind's smallest efficient open multimodal model for text, image, video, and audio tasks on everyday devices.",
    contextWindow: '32k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Multimodal', 'Fast', 'Edge', 'Cost-Effective']
  },
  {
    id: 'nvidia/nemotron-mini-4b-instruct',
    name: 'Nemotron Mini 4B Instruct',
    provider: 'nvidia',
    description: "NVIDIA's compact on-device text model for roleplay, retrieval-augmented generation, and function calling.",
    contextWindow: '4k tokens',
    pricing: { input: '$0.00 / 1M', output: '$0.00 / 1M' },
    tags: ['Fast', 'Edge', 'RAG', 'Function Calling']
  }
];
