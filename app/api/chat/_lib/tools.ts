import { createMCPClient } from '@ai-sdk/mcp';
import type { MCPIntegration } from '@/lib/db';
import type { ModelConfig } from '@/lib/models';
import {
  createBrowsePageTool,
  createMapWebsiteTool,
  createWebSearchTool,
} from '@/lib/tools/web-search';
import type { SearchKeys } from './types';

interface BuildChatToolsOptions {
  modelConfig: ModelConfig;
  mcpServers?: MCPIntegration[];
  searchEnabled: boolean;
  searchKeys: SearchKeys;
}

interface ChatToolsResult {
  tools: Record<string, any>;
  canUseTools: boolean;
}

function cleanMcpToolOutput(value: any): any {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return value
      .replace(/âš ï¸?\s*A rich UI widget is being shown[\s\S]*?what they'd like to do next\.?/gi, '')
      .trim();
  }
  if (Array.isArray(value)) {
    return value.map((item) => cleanMcpToolOutput(item));
  }
  if (typeof value === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, item] of Object.entries(value)) {
      cleaned[key] = cleanMcpToolOutput(item);
    }
    return cleaned;
  }
  return value;
}

function resolveSearchKeys(searchKeys: SearchKeys): SearchKeys {
  return {
    tavilyKey: searchKeys.tavilyKey || process.env.TAVILY_API_KEY,
    exaKey: searchKeys.exaKey || process.env.EXA_API_KEY,
    firecrawlKey: searchKeys.firecrawlKey || process.env.FIRECRAWL_API_KEY,
  };
}

function hasAnySearchKey(searchKeys: SearchKeys): boolean {
  return Boolean(searchKeys.tavilyKey || searchKeys.exaKey || searchKeys.firecrawlKey);
}

async function bindMcpTools(
  tools: Record<string, any>,
  mcpServers: MCPIntegration[] | undefined,
  modelConfig: ModelConfig,
): Promise<void> {
  const isPerplexityAgent = modelConfig.provider === 'perplexity' && modelConfig.id.includes('/');
  const canUseMcp = modelConfig.provider !== 'perplexity' || isPerplexityAgent;
  if (!canUseMcp || !mcpServers?.length) return;

  for (const server of mcpServers) {
    if (!server.isEnabled) continue;

    if (server.connectionMode === 'direct') {
      for (const tool of server.cachedTools) {
        tools[tool.name] = {
          description: tool.description,
          parameters: {
            type: 'object',
            properties: tool.inputSchema?.properties || {},
            required: tool.inputSchema?.required || [],
            additionalProperties: tool.inputSchema?.additionalProperties,
          },
        };
      }
      continue;
    }

    try {
      const transportType = server.url.includes('/sse') ? 'sse' : 'http';
      const mcpClient = await createMCPClient({
        transport: {
          type: transportType,
          url: server.url,
          headers: server.accessToken
            ? { Authorization: `Bearer ${server.accessToken}` }
            : undefined,
        },
      });

      const serverTools = await mcpClient.tools();
      for (const [name, config] of Object.entries(serverTools)) {
        const resolvedKey = name.replace(/:/g, '_');
        tools[resolvedKey] = {
          ...config,
          execute: async (args: any) => {
            try {
              const rawResult = await Promise.race([
                (config as any).execute(args),
                new Promise((_, reject) =>
                  setTimeout(
                    () => reject(new Error(`Timeout: ${server.name} did not respond.`)),
                    6000,
                  ),
                ),
              ]);

              if (
                rawResult &&
                typeof rawResult === 'object' &&
                Array.isArray((rawResult as any).content)
              ) {
                const textContent = (rawResult as any).content.find(
                  (content: any) => content.type === 'text',
                );
                if (textContent && typeof textContent.text === 'string') {
                  try {
                    return cleanMcpToolOutput(JSON.parse(textContent.text));
                  } catch {
                    return cleanMcpToolOutput({ result: textContent.text });
                  }
                }
              }

              if (typeof rawResult !== 'object' || rawResult === null) {
                return cleanMcpToolOutput({ result: String(rawResult) });
              }
              return cleanMcpToolOutput(rawResult);
            } catch (error: any) {
              return { error: error.message };
            }
          },
        };
      }
    } catch (error) {
      console.error(`[MCP Bind Error] ${server.name}:`, error);
    }
  }
}

export async function buildChatTools({
  modelConfig,
  mcpServers,
  searchEnabled,
  searchKeys,
}: BuildChatToolsOptions): Promise<ChatToolsResult> {
  const resolvedSearchKeys = resolveSearchKeys(searchKeys);
  const canUseTools =
    modelConfig.provider !== 'perplexity' &&
    hasAnySearchKey(resolvedSearchKeys) &&
    searchEnabled;

  console.log(
    `[CHAT] canUseTools=${canUseTools}, hasSearchKeys=${hasAnySearchKey(resolvedSearchKeys)}, searchEnabled=${searchEnabled}, provider=${modelConfig.provider}`,
  );

  const tools: Record<string, any> = {};
  if (canUseTools) {
    tools.webSearch = createWebSearchTool(resolvedSearchKeys);
    tools.browsePage = createBrowsePageTool(resolvedSearchKeys);
    tools.mapWebsite = createMapWebsiteTool(resolvedSearchKeys);
  }

  await bindMcpTools(tools, mcpServers, modelConfig);
  return { tools, canUseTools };
}

