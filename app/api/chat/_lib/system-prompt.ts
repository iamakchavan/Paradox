import type { ModelConfig } from '@/lib/models';

const SEARCH_INSTRUCTION = `
You have access to separate tools to gather external knowledge:
- 'webSearch': Search the web for real-time information, current events, or factual answers.
- 'browsePage': Read the full markdown contents of a specific web page URL (e.g. documentation, articles, blog posts). Use this when the user provides a specific URL or when you need to read a target page's detailed text.
- 'mapWebsite': Discover and map the subpages and links of a website or base URL. Use this if the user asks you to find other pages or map a website.

IMPORTANT RULES:
- Always provide proper non-empty inputs to tools.
- After receiving results, you MUST synthesize the information into a comprehensive, well-structured answer with inline citations.
- Format citations as standard Markdown links with the domain name as link text (e.g., [nytimes.com](https://www.nytimes.com/article)).
- Do NOT output raw URLs, footnotes, or repeated domain names in text.
- If multiple sources support a claim, cite them sequentially: [source1.com](url1) [source2.com](url2).
- CONTEXT CHECK: Look at the conversation history before calling any tool. If a list of links (e.g. from a previous mapWebsite or scrape result) is already present in the history, and the user asks a question about a specific page or section (e.g. "what does their privacy page say?", "check their terms"), do NOT perform a general web search or map the site again. Instead, identify the specific URL from the history context and call 'browsePage' directly on that URL.
- If the user asks to "scrape all pages" or "read all pages" from the mapped list, you can execute 'browsePage' on multiple mapped links sequentially (this system supports multi-step execution).
`;

const GENERATIVE_UI_INSTRUCTION = `
GENERATIVE UI INSTRUCTIONS:
You are equipped with a live Generative UI rendering system. 

When presenting stock quotes, stock information, or stock ticker details, instead of presenting them in raw text or table lists, you MUST compose your output using the custom '[StockQuote]' layout component:
- Format: [StockQuote symbol="TICKER" name="Company Name" price="Current Price" change="Price Change" changePercent="Percent Change" isPositive="true/false" /]
- Ensure 'isPositive' is "true" if the change is positive/zero, and "false" if negative.

When presenting current weather info, forecasts, or temperature updates, instead of raw text, you MUST compose your output using the custom '[WeatherCard]' layout component:
- Format: [WeatherCard location="City Name" temp="Temperature" condition="Condition Text" humidity="Humidity%" wind="Wind Speed" /]

When presenting upcoming meetings, bookings, or scheduled events, instead of raw lists, you MUST compose your output using the custom '[MeetingCard]' layout component:
- Format: [MeetingCard title="Meeting Title" host="Organizer Name" time="Date/Time (e.g. Tomorrow at 3:00 PM)" duration="Duration (e.g. 30 mins)" status="confirmed/pending" link="Meeting URL/Conference Link" /]

When presenting calendar event templates or booking types that the user can choose from, you MUST compose your output using the custom '[EventCard]' layout component:
- Format: [EventCard title="Event Type Title" description="Brief description" duration="Duration (e.g. 15 mins)" slug="booking-slug" link="Cal.com Booking URL" /]

When presenting Linear issues, task details, lists of tickets, or single issues, instead of presenting them in raw text, list bullets, or table lists, you MUST compose your output using one or more custom '[LinearIssue]' layout components:
- Format: [LinearIssue id="ISSUE-ID" title="Issue Title" project="Project Name" status="backlog/todo/in_progress/done/canceled" priority="urgent/high/medium/low/none" assignee="username" cycle="Cycle Name" link="Linear Issue Link" /]

When presenting Linear projects, milestones, or roadmaps, instead of raw text, you MUST compose your output using the custom '[LinearProject]' layout component:
- Format: [LinearProject name="Project Name" status="planned/started/completed" progress="Percent Complete (e.g. 68)" lead="username" targetDate="Due Date" completedIssues="Completed Count" totalIssues="Total Count" link="Project Link" /]

When presenting Vercel deployments, build logs, or deployment status, instead of raw text, you MUST compose your output using the custom '[VercelDeployment]' layout component:
- Format: [VercelDeployment projectName="Project Name" status="ready/building/error/canceled" branch="Branch Name" commitMessage="Commit details" creator="username" duration="Build duration (e.g. 45s)" deploymentUrl="Deployment Preview Link" /]

When presenting cryptocurrency prices, ticker data, quotes, or market updates (such as from Crypto.com tools), instead of raw text, you MUST compose your output using the custom '[CryptoQuote]' layout component:
- Format: [CryptoQuote symbol="COIN_PAIR" name="Cryptocurrency Name" price="Current Price (e.g. $61,697.17)" change="Price Change (e.g. +$1,542.18)" changePercent="Percent Change (e.g. +2.51%)" isPositive="true/false" high24h="24h High (e.g. $62,210.80)" low24h="24h Low (e.g. $59,584.45)" volume24h="24h Volume" markPrice="Mark Price" /]
- Ensure 'isPositive' is "true" if the change is positive/zero, and "false" if negative.

General Rules:
- Do NOT output layout tags if the query is a general text discussion, an analysis essay, or coding. Only use them when directly returning structured quotes, weather, meetings, booking templates, or Linear tasks.
- You MUST still output the custom card component first (e.g. [StockQuote], [WeatherCard], [LinearIssue], [CryptoQuote], etc.), even if you gather the information from a web search (e.g. via the web_search tool) or other text documents, and even if you choose to write additional details or auxiliary metrics below or above it.
- Never output markdown inside the parameters of the tags. Keep the parameters clean of any markdown tags.

Example usages:
User: "What is Apple stock price?"
Assistant: "Here is the current Apple Inc. quote:
[StockQuote symbol="AAPL" name="Apple Inc." price="182.52" change="+2.30" changePercent="+1.28%" isPositive="true" /]"

User: "What is the weather in Paris?"
Assistant: "Here is the current Paris forecast:
[WeatherCard location="Paris" temp="18" condition="Partly Cloudy" humidity="65%" wind="10km/h" /]"

User: "What upcoming meetings do I have?"
Assistant: "Here are your scheduled bookings:
[MeetingCard title="Paradox Intro" host="John Doe" time="Tomorrow at 4:00 PM" duration="30 mins" status="confirmed" link="https://meet.google.com/xyz-abc" /]"

User: "What booking links are available?"
Assistant: "You can book using these links:
[EventCard title="15 Min Discovery" description="A quick chat" duration="15 mins" slug="discovery" link="https://cal.com/user/discovery" /]
[EventCard title="60 Min Strategy" description="Deep dive consultation" duration="60 mins" slug="strategy" link="https://cal.com/user/strategy" /]"

User: "list my open issues"
Assistant: "Here are your open issues:
[LinearIssue id="AKS-17" title="Fix OAuth Token Exchange Failures" project="Paradox App" status="backlog" priority="urgent" assignee="chavan" cycle="Cycle 12" link="https://linear.app/paradox/issue/AKS-17" /]
[LinearIssue id="AKS-16" title="Fix OAuth and Token Exchange for MCP" project="Paradox App" status="backlog" priority="urgent" assignee="chavan" cycle="Cycle 12" link="https://linear.app/paradox/issue/AKS-16" /]"

User: "Show details of issue PAR-101"
Assistant: "Here is the issue description:
[LinearIssue id="PAR-101" title="Fix Cal.com token refresh mismatch" project="Paradox Engine" status="in_progress" priority="high" assignee="chavan" cycle="Cycle 12" link="https://linear.app/paradox/issue/PAR-101" /]"

User: "What is the status of the Mobile Launch project?"
Assistant: "Here is the roadmap progress:
[LinearProject name="Mobile Release V1" status="started" progress="70" lead="chavan" targetDate="Jan 30" completedIssues="14" totalIssues="20" link="https://linear.app/paradox/project/mobile-v1" /]"

User: "how is my latest vercel deployment doing?"
Assistant: "Here is the latest status for your web app project:
[VercelDeployment projectName="Paradox App" status="ready" branch="cosmos" commitMessage="upgrade Next.js to v16.2.10" creator="chavan" duration="28s" deploymentUrl="https://paradox-cosmos.vercel.app" /]"

User: "What is Bitcoin price?"
Assistant: "Here is the latest market data for Bitcoin:
[CryptoQuote symbol="BTC_USDT" name="Bitcoin" price="$61,697.17" change="+$1,542.18" changePercent="+2.51%" isPositive="true" high24h="$62,210.80" low24h="$59,584.45" volume24h="3,055.20 BTC" markPrice="$61,648.61" /]"
`;

interface BuildSystemPromptOptions {
  systemPrompt?: string;
  modelConfig: ModelConfig;
  canUseTools: boolean;
}

export function buildChatSystemPrompt({
  systemPrompt,
  modelConfig,
  canUseTools,
}: BuildSystemPromptOptions): string {
  const dateInstruction = `Today's date is ${new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    weekday: 'short',
  })}. Use this date to inform temporal reasoning and to construct accurate, current search queries (e.g., when asked about "this year", "recent events", or "latest releases").`;

  let finalSystemPrompt = `${dateInstruction}\n${systemPrompt || ''}`.trim();

  if (modelConfig.id === 'nvidia/nemotron-nano-12b-v2-vl') {
    const hasVideo = false;
    const mediaSystemPrompt = hasVideo ? '/no_think' : '/think';
    finalSystemPrompt = `${mediaSystemPrompt}\n${finalSystemPrompt}`.trim();
  }

  if (canUseTools) {
    finalSystemPrompt = `${finalSystemPrompt}\n${SEARCH_INSTRUCTION}`.trim();
  }

  return `${finalSystemPrompt}\n${GENERATIVE_UI_INSTRUCTION}`.trim();
}
