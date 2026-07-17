import type { OpenAIProviderSettings } from '@ai-sdk/openai';
import type { AgentReasoningEffort } from './models';

export type PerplexityAgentContext = 'chat' | 'research' | 'title';

export interface PerplexityAgentRequestOptions {
  context: PerplexityAgentContext;
  reasoningEffort?: AgentReasoningEffort;
  searchEnabled?: boolean;
}

type AgentRequestBody = Record<string, unknown>;
type AgentTool = Record<string, unknown>;
type ProviderFetch = NonNullable<OpenAIProviderSettings['fetch']>;

const SEARCH_TOOLS: readonly AgentTool[] = [
  { type: 'web_search' },
  { type: 'fetch_url' },
  { type: 'people_search' },
  { type: 'finance_search' },
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeFunctionTool(tool: AgentTool): AgentTool {
  if (tool.type !== 'function') return tool;

  const name = typeof tool.name === 'string' ? tool.name.trim() : '';
  if (!name) {
    throw new Error('Perplexity function tools require a non-empty name.');
  }

  const description =
    typeof tool.description === 'string' && tool.description.trim()
      ? tool.description.trim()
      : `Run the ${name} connector tool.`;

  return {
    ...tool,
    name,
    description,
    parameters: isRecord(tool.parameters)
      ? tool.parameters
      : { type: 'object', properties: {} },
  };
}

function normalizeTools(value: unknown): AgentTool[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map(normalizeFunctionTool);
}

function getToolIdentity(tool: AgentTool): string | null {
  const type = typeof tool.type === 'string' ? tool.type : '';
  if (!type) return null;

  if (type === 'function') {
    return typeof tool.name === 'string' ? `function:${tool.name}` : null;
  }

  return `provider:${type}`;
}

function dedupeTools(tools: AgentTool[]): AgentTool[] {
  const seen = new Set<string>();

  return tools.filter((tool) => {
    const identity = getToolIdentity(tool);
    if (!identity) return true;
    if (seen.has(identity)) return false;
    seen.add(identity);
    return true;
  });
}

function addSearchTools(tools: AgentTool[]): AgentTool[] {
  const existingIdentities = new Set(
    tools.map(getToolIdentity).filter((identity): identity is string => Boolean(identity)),
  );
  const missingSearchTools = SEARCH_TOOLS
    .filter((tool) => {
      const identity = getToolIdentity(tool);
      return identity == null || !existingIdentities.has(identity);
    })
    .map((tool) => ({ ...tool }));

  return dedupeTools([...missingSearchTools, ...tools]);
}

export function preparePerplexityAgentRequest(
  body: AgentRequestBody,
  options: PerplexityAgentRequestOptions,
): AgentRequestBody {
  const request = { ...body };
  const customTools = normalizeTools(request.tools);
  const tools =
    options.context === 'chat' && options.searchEnabled
      ? addSearchTools(customTools)
      : dedupeTools(customTools);

  if (tools.length > 0) {
    request.tools = tools;
  } else {
    delete request.tools;
  }

  if (request.max_output_tokens == null) {
    request.max_output_tokens = 4096;
  }

  if (options.reasoningEffort) {
    request.reasoning = {
      ...(isRecord(request.reasoning) ? request.reasoning : {}),
      effort: options.reasoningEffort,
    };
  }

  // Preserve the existing deep-research model behavior while the application
  // continues to own planning, retrieval, and synthesis orchestration.
  if (options.context === 'research' && request.preset == null) {
    request.preset = 'medium';
  }

  return request;
}

function isResponsesRequest(input: Parameters<ProviderFetch>[0]): boolean {
  const requestUrl =
    typeof input === 'string'
      ? input
      : input instanceof URL
        ? input.href
        : input.url;

  try {
    return new URL(requestUrl).pathname.endsWith('/responses');
  } catch {
    return requestUrl.includes('/responses');
  }
}

export function createPerplexityAgentFetch(
  options: PerplexityAgentRequestOptions,
): ProviderFetch {
  return async (input, init) => {
    if (
      init?.method?.toUpperCase() !== 'POST' ||
      typeof init.body !== 'string' ||
      !isResponsesRequest(input)
    ) {
      return globalThis.fetch(input, init);
    }

    let body: unknown;
    try {
      body = JSON.parse(init.body);
    } catch {
      throw new Error('Perplexity Agent request body was not valid JSON.');
    }

    if (!isRecord(body)) {
      throw new Error('Perplexity Agent request body must be a JSON object.');
    }

    return globalThis.fetch(input, {
      ...init,
      body: JSON.stringify(preparePerplexityAgentRequest(body, options)),
    });
  };
}
