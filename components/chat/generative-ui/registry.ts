import dynamic from 'next/dynamic';

export const GenerativeUIRegistry = {
  StockQuote: dynamic(() => import('./StockQuote'), { ssr: false }),
  WeatherCard: dynamic(() => import('./WeatherCard'), { ssr: false }),
  MeetingCard: dynamic(() => import('./MeetingCard'), { ssr: false }),
  EventCard: dynamic(() => import('./EventCard'), { ssr: false }),
  LinearIssue: dynamic(() => import('./LinearIssue'), { ssr: false }),
  LinearProject: dynamic(() => import('./LinearProject'), { ssr: false }),
};

export type GenerativeUIComponentType = keyof typeof GenerativeUIRegistry;
