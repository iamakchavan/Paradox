import type { ComponentType } from 'react';

export const PROVIDER_CATEGORIES = [
  { id: 'work', label: 'Work & Knowledge' },
  { id: 'developer', label: 'Developer & Cloud' },
  { id: 'search', label: 'Search & Data' },
  { id: 'finance', label: 'Finance' },
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'commerce', label: 'Food & Commerce' },
] as const;

export type ProviderCategory = (typeof PROVIDER_CATEGORIES)[number]['id'];

export interface ProviderTemplate {
  id: string;
  name: string;
  desc: string;
  icon: ComponentType<any>;
  type: string;
  url: string;
  category: ProviderCategory | 'custom';
}

export const PROVIDER_SCOPES: Record<string, string> = {
  github: 'repo',
  // Hosted MCP (mcp.cal.com) uses dynamic client registration and owns upstream
  // Cal OAuth scopes itself — same pattern as Notion/Linear. Do not inject the
  // full Cal API scope bundle (it is ignored by MCP and can break authorize).
  cal: '',
  notion: '',
  vercel: '',
  canva: '',
  linear: '',
  jira: '',
  asana: '',
  airtable: 'data.records:read schema.bases:read',
  cryptocom: '',
  godaddy: '',
  parallel: '',
  supabase: '',
  swiggy_food: '',
  swiggy_dineout: '',
  swiggy_instamart: '',
  monday: '',
  cloudflare: '',
  yahoofinance: '',
  neon: '',
  netlify: ''
};

const GitHubLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className={props.className} fill="currentColor" style={props.style}>
    <path d="M280.5 426.5C214.5 418.5 168 371 168 309.5C168 284.5 177 257.5 192 239.5C185.5 223 186.5 188 194 173.5C214 171 241 181.5 257 196C276 190 296 187 320.5 187C345 187 365 190 383 195.5C398.5 181.5 426 171 446 173.5C453 187 454 222 447.5 239C463.5 258 472 283.5 472 309.5C472 371 425.5 417.5 358.5 426C375.5 437 387 461 387 488.5L387 540.5C387 555.5 399.5 564 414.5 558C505 523.5 576 433 576 321C576 179.5 461 64 319.5 64C178 64 64 179.5 64 321C64 432 134.5 524 229.5 558.5C243 563.5 256 554.5 256 541L256 501C249 504 240 506 232 506C199 506 179.5 488 165.5 454.5C160 441 154 433 142.5 431.5C136.5 431 134.5 428.5 134.5 425.5C134.5 419.5 144.5 415 154.5 415C169 415 181.5 424 194.5 442.5C204.5 457 215 463.5 227.5 463.5C240 463.5 248 459 259.5 447.5C268 439 274.5 431.5 280.5 426.5z"/>
  </svg>
);

const NotionLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className={props.className} fill="currentColor" style={props.style}>
    <path d="M158.9 164.2C173.8 176.3 179.4 175.4 207.5 173.5L471.8 157.6C477.4 157.6 472.7 152 470.9 151.1L426.9 119.4C418.5 112.9 407.3 105.4 385.8 107.3L129.9 125.9C120.6 126.8 118.7 131.5 122.4 135.2L158.8 164.1zM174.8 225.8L174.8 503.9C174.8 518.8 182.3 524.4 199.1 523.5L489.6 506.7C506.4 505.8 508.3 495.5 508.3 483.4L508.3 207.2C508.3 195.1 503.6 188.5 493.3 189.5L189.7 207.1C178.5 208 174.8 213.6 174.8 225.8zM461.5 240.7C463.4 249.1 461.5 257.5 453.1 258.5L439.1 261.3L439.1 466.6C426.9 473.1 415.7 476.9 406.4 476.9C391.4 476.9 387.7 472.2 376.5 458.2L285 314.5L285 453.5L314 460C314 460 314 476.8 290.6 476.8L226.2 480.5C224.3 476.8 226.2 467.4 232.7 465.6L249.5 460.9L249.5 277.1L226.2 275.2C224.3 266.8 229 254.7 242.1 253.7L311.2 249L406.5 394.6L406.5 265.8L382.2 263C380.3 252.7 387.8 245.3 397.1 244.3L461.6 240.5zM108.4 100.7L374.6 81.1C407.3 78.3 415.7 80.2 436.2 95.1L521.2 154.8C535.2 165.1 539.9 167.9 539.9 179.1L539.9 506.7C539.9 527.2 532.4 539.4 506.3 541.2L197.2 559.8C177.6 560.7 168.2 557.9 158 544.9L95.4 463.7C84.2 448.8 79.5 437.6 79.5 424.5L79.5 133.3C79.5 116.5 87 102.5 108.4 100.6z"/>
  </svg>
);

const CalLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={props.className} style={props.style}>
    <path d="M458 512H56c-30.4 0-55-24.6-55-55V55C1 24.6 25.6 0 56 0h402c30.4 0 55 24.6 55 55v402c0 30.4-24.6 55-55 55" style={{ fill: '#fff' }}/>
    <path d="M162.8 347.3c-50.4 0-88.4-39.9-88.4-89.3s35.9-89.6 88.4-89.6c27.9 0 47 8.6 62.1 28l-24.3 20.1c-10.1-10.8-22.5-16.2-37.8-16.2-34.1 0-52.8 26.1-52.8 57.6s20.5 57.1 52.8 57.1c15.1 0 28-5.3 38.4-16.2l23.9 21c-14.5 18.9-34.3 27.5-62.3 27.5m166.4-131.2h32.7v128.1h-32.7v-18.7c-6.7 13.2-18.1 22.2-39.7 22.2-34.6 0-62.3-30.1-62.3-66.9 0-37 27.7-66.9 62.3-66.9 21.5 0 33 8.9 39.7 22.2zm1.1 64.5c0-20-13.8-36.6-35.4-36.6-20.8 0-34.4 16.7-34.4 36.6 0 19.4 13.6 36.6 34.4 36.6 21.4 0 35.4-16.7 35.4-36.6M385 164.3h32.7v179.6H385z" style={{ fill: '#242424' }}/>
  </svg>
);

const VercelLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={props.className} fill="currentColor" style={props.style}>
    <path d="M256 0L512 443.4H0L256 0z" />
  </svg>
);

const CanvaLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className} style={props.style}>
    <path d="M45 85C67.0914 85 85 67.0914 85 45C85 22.9086 67.0914 5 45 5C22.9086 5 5 22.9086 5 45C5 67.0914 22.9086 85 45 85Z" fill="#7D2AE7"/>
    <path d="M45 85C67.0914 85 85 67.0914 85 45C85 22.9086 67.0914 5 45 5C22.9086 5 5 22.9086 5 45C5 67.0914 22.9086 85 45 85Z" fill="url(#paint0_radial_825_3566)"/>
    <path d="M45 85C67.0914 85 85 67.0914 85 45C85 22.9086 67.0914 5 45 5C22.9086 5 5 22.9086 5 45C5 67.0914 22.9086 85 45 85Z" fill="url(#paint1_radial_825_3566)"/>
    <path d="M45 85C67.0914 85 85 67.0914 85 45C85 22.9086 67.0914 5 45 5C22.9086 5 5 22.9086 5 45C5 67.0914 22.9086 85 45 85Z" fill="url(#paint2_radial_825_3566)"/>
    <path d="M45 85C67.0914 85 85 67.0914 85 45C85 22.9086 67.0914 5 45 5C22.9086 5 5 22.9086 5 45C5 67.0914 22.9086 85 45 85Z" fill="url(#paint3_radial_825_3566)"/>
    <path d="M62.2686 53.2057C61.9385 53.2057 61.648 53.4845 61.3457 54.0933C57.9318 61.0158 52.0354 65.9139 45.212 65.9139C37.3223 65.9139 32.4365 58.7918 32.4365 48.9527C32.4365 32.286 41.7227 22.6496 49.8791 22.6496C53.6905 22.6496 56.0181 25.0448 56.0181 28.8564C56.0181 33.3801 53.448 35.7753 53.448 37.3707C53.448 38.0869 53.8935 38.5205 54.7768 38.5205C58.3259 38.5205 62.4914 34.4424 62.4914 28.6813C62.4914 23.0952 57.6295 18.9893 49.4733 18.9893C35.9935 18.9893 24.0137 31.4863 24.0137 48.7775C24.0137 62.1619 31.6567 71.0066 43.4495 71.0066C55.9663 71.0066 63.2038 58.5531 63.2038 54.511C63.2038 53.6158 62.7461 53.2057 62.2686 53.2057Z" fill="white"/>
    <defs>
      <radialGradient id="paint0_radial_825_3566" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(20.453 75.9057) rotate(-49.416) scale(61.8733)">
        <stop stopColor="#6420FF"/>
        <stop offset="1" stopColor="#6420FF" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="paint1_radial_825_3566" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(26.1788 14.0946) rotate(54.703) scale(69.7735)">
        <stop stopColor="#00C4CC"/>
        <stop offset="1" stopColor="#00C4CC" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="paint2_radial_825_3566" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(20.4526 75.9053) rotate(-45.1954) scale(61.1242 28.1118)">
        <stop stopColor="#6420FF"/>
        <stop offset="1" stopColor="#6420FF" stopOpacity="0"/>
      </radialGradient>
      <radialGradient id="paint3_radial_825_3566" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(37.7158 15.7789) rotate(66.5198) scale(62.9836 105.512)">
        <stop stopColor="#00C4CC" stopOpacity="0.725916"/>
        <stop offset="0.0001" stopColor="#00C4CC"/>
        <stop offset="1" stopColor="#00C4CC" stopOpacity="0"/>
      </radialGradient>
    </defs>
  </svg>
);

const LinearLogo = (props: React.SVGProps<SVGSVGElement> & React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img src="/logo/linear-logo.svg" className={props.className} style={props.style} alt="Linear" />
);

const JiraLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className} style={props.style}>
    <path d="M82.3799 42.79L47.9054 8.31493L44.5905 5L18.7346 30.8563L6.91159 42.6797C5.69614 43.895 5.69614 45.884 6.91159 47.21L30.5577 70.8563L44.5905 85L70.4464 59.1437L70.8884 58.7017L82.3799 47.21C83.5956 45.9943 83.5956 44.0057 82.3799 42.79ZM44.5905 56.8233L32.7676 45L44.5905 33.1767L56.4136 45L44.5905 56.8233Z" fill="#2684FF"/>
    <path d="M44.5915 33.1767C36.8569 25.442 36.8569 12.8452 44.4811 5.11035L18.625 30.9667L32.658 45L44.5915 33.1767Z" fill="url(#paint0_linear_874_4152)"/>
    <path d="M56.4169 45L44.5938 56.8233C52.3283 64.558 52.3283 77.1547 44.5938 85L70.56 59.033L56.4169 45Z" fill="url(#paint1_linear_874_4152)"/>
    <defs>
      <linearGradient id="paint0_linear_874_4152" x1="42.4825" y1="21.1981" x2="25.9705" y2="37.7098" gradientUnits="userSpaceOnUse">
        <stop offset="0.176" stopColor="#0052CC"/>
        <stop offset="1" stopColor="#2684FF"/>
      </linearGradient>
      <linearGradient id="paint1_linear_874_4152" x1="46.8551" y1="68.6307" x2="63.3341" y2="52.1522" gradientUnits="userSpaceOnUse">
        <stop offset="0.176" stopColor="#0052CC"/>
        <stop offset="1" stopColor="#2684FF"/>
      </linearGradient>
    </defs>
  </svg>
);

const AsanaLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className} style={props.style}>
    <path d="M62.3962 25.3994C62.3962 35.0047 54.6084 42.799 45.003 42.799C35.3916 42.799 27.6035 35.0107 27.6035 25.3994C27.6035 15.7881 35.3916 8 45.003 8C54.6084 8 62.3962 15.7881 62.3962 25.3994ZM22.3994 47.1455C12.7941 47.1455 5 54.9336 5 64.5391C5 74.1445 12.7881 81.9384 22.3994 81.9384C32.0107 81.9384 39.7988 74.1502 39.7988 64.5391C39.7988 54.9336 32.0107 47.1455 22.3994 47.1455ZM67.6003 47.1455C57.9892 47.1455 50.201 54.9336 50.201 64.5451C50.201 74.1563 57.9892 81.9445 67.6003 81.9445C77.2058 81.9445 85 74.1563 85 64.5451C85 54.9336 77.2119 47.1455 67.6003 47.1455Z" fill="#F06A6A"/>
  </svg>
);

const AirtableLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className} style={props.style}>
    <path d="M40.7211 12.8449L10.8943 25.186C9.23566 25.8724 9.25284 28.2286 10.9219 28.8902L40.8731 40.7669C43.5046 41.8105 46.4353 41.8105 49.0669 40.7669L79.0185 28.8897C80.6871 28.2286 80.7052 25.8728 79.0457 25.1864L49.2197 12.8444C46.4986 11.7185 43.4418 11.7185 40.7207 12.8444" fill="#FCB400"/>
    <path d="M47.6289 47.2503V76.9204C47.6289 78.3311 49.052 79.2979 50.3638 78.7779L83.7386 65.8241C84.1108 65.6766 84.4301 65.4206 84.6551 65.0894C84.88 64.7582 85.0003 64.367 85.0002 63.9666V34.297C85.0002 32.8858 83.5771 31.9195 82.2653 32.4395L48.8905 45.3933C48.5184 45.5409 48.1991 45.7969 47.9742 46.1281C47.7492 46.4593 47.6289 46.8504 47.6289 47.2508" fill="#18BFFF"/>
    <path d="M39.8363 48.7828L29.9314 53.565L28.9257 54.051L8.01705 64.0689C6.69212 64.7082 5 63.7424 5 62.2701V34.4228C5 33.8901 5.27313 33.4303 5.6394 33.0844C5.78967 32.9347 5.96014 32.8069 6.14586 32.7045C6.64509 32.4047 7.35775 32.3247 7.96369 32.5644L39.6699 45.1266C41.2815 45.7659 41.4081 48.0241 39.8363 48.7833" fill="#F82B60"/>
    <path d="M39.8336 48.7838L29.9287 53.5659L5.63672 33.0849C5.78701 32.9354 5.95749 32.8077 6.14318 32.7055C6.6424 32.4057 7.35506 32.3257 7.96101 32.5653L39.6672 45.1275C41.2788 45.7669 41.4054 48.025 39.8336 48.7842" fill="#BA1E45"/>
  </svg>
);

const GrantedAiLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={props.className} fill="currentColor" style={props.style}>
    <circle cx="256" cy="256" r="240" fill="none" stroke="currentColor" strokeWidth="32" />
    <path d="M256 128l128 256H128z" />
  </svg>
);

const CryptoLogo = (props: React.SVGProps<SVGSVGElement> & React.ImgHTMLAttributes<HTMLImageElement>) => (
  <img src="/logo/crypto.com.svg" className={props.className} style={props.style} alt="Crypto.com" />
);

const GoDaddyLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" fill="none" className={props.className} style={props.style}>
    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
    <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
    <g id="SVGRepo_iconCarrier">
      <circle cx="512" cy="512" r="512" fill="#1bdbdb" />
      <path d="M697.6 315.9c-53.2-33.2-123.3-25.3-185.6 13.9-62.4-39.3-132.4-47.2-185.6-13.9-84.1 52.5-94.3 187.8-22.8 302.2 52.7 84.3 135.1 133.7 208.4 132.8 73.3.9 155.7-48.5 208.4-132.8 71.5-114.4 61.3-249.7-22.8-302.2M342.2 594c-15-24.1-26.1-49.5-33-75.5-6.5-24.5-8.9-48.5-7.1-71.2 3.2-42.3 20.4-75.2 48.4-92.7s65.2-18.6 104.5-2.9c5.9 2.4 11.8 5.1 17.6 8.1-21 19-40.3 41.9-56.7 68.1-43.4 69.5-56.6 146.7-41.5 208.4-11.8-12.8-22.6-27-32.2-42.3m372.6-75.6c-6.9 26.1-17.9 51.5-33 75.5-9.6 15.4-20.4 29.5-32.3 42.3 13.5-55.2 4.4-122.9-28.9-186.3-2.3-4.5-7.7-5.9-12-3.3l-103.5 64.7c-4 2.5-5.2 7.7-2.7 11.7l15.2 24.3c2.5 4 7.7 5.2 11.7 2.7l67.1-41.9c2.2 6.4 4.3 12.9 6 19.5 6.5 24.5 8.9 48.5 7.1 71.2-3.2 42.3-20.4 75.2-48.4 92.7-14 8.8-30.3 13.4-48 13.9h-2.2c-17.7-.5-34-5.1-48-13.9-28-17.5-45.2-50.4-48.4-92.7-1.7-22.7.7-46.7 7.1-71.2 6.8-26.1 17.9-51.5 33-75.5 15-24.1 33-45.2 53.4-62.8 19.2-16.6 39.7-29.2 60.9-37.6 39.4-15.7 76.5-14.6 104.5 2.9s45.2 50.4 48.4 92.7c1.8 22.6-.6 46.6-7 71.1" fill="#ffffff" />
    </g>
  </svg>
);

const ParallelSearchLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 16 16" fill="currentColor" style={props.style} className={props.className}>
    <path fill="currentColor" d="M12.513 14.611A8 8 0 0 1 8.015 16h-.047a8 8 0 0 1-3.679-.9h2.788a10 10 0 0 1-.238-.279h2.305-.001l.167-.21zm2.101-2.087a8 8 0 0 1-1.216 1.393H9.81l.134-.209h-3.91a12 12 0 0 1-.169-.278H2.092a9 9 0 0 1-.362-.418h3.904a9 9 0 0 1-.143-.279h4.998l.1-.209zm1.029-2.087a8 8 0 0 1-.598 1.392h-4.162l.077-.209H5.02l-.095-.278H.69a9 9 0 0 1-.177-.418h4.285a9 9 0 0 1-.075-.278h6.534l.05-.21h4.335Zm.356-1.866q-.044.6-.17 1.17h-4.385l.032-.21H4.502a8 8 0 0 1-.036-.278H.056A8 8 0 0 1 0 8.835h4.426a8 8 0 0 1-.019-.277h7.163l.01-.21h4.419zm-.17-2.31q.126.57.17 1.169v.222h-4.42l-.009-.209H4.407q.008-.138.019-.277H0q.023-.211.056-.418h4.41q.016-.139.036-.278h6.974l-.032-.21h4.384Zm-.784-2.09q.363.663.598 1.393h-4.335l-.05-.209H4.724q.036-.14.075-.278H.514q.083-.213.177-.418h4.234q.045-.14.095-.278h5.94l-.077-.21zm-1.647-2.086c.457.415.865.883 1.216 1.393H10.59l-.1-.21H5.491q.07-.139.143-.278H1.73a7 7 0 0 1 .362-.418h3.774l.17-.278h3.91l-.135-.209zM8.015 0a8 8 0 0 1 4.498 1.389H9.31l-.167-.21H6.838q.118-.14.24-.278h-2.79A8 8 0 0 1 7.968 0z" xmlns="http://www.w3.org/2000/svg" />
  </svg>
);

const SupabaseLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg width="97" height="100" viewBox="0 0 97 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={props.className} style={props.style}>
    <g clipPath="url(#clip0_1351_254)">
      <path d="M56.3796 97.5965C53.8491 100.783 48.7182 99.0372 48.6572 94.9682L47.7656 35.4537H87.7831C95.0313 35.4537 99.0738 43.8255 94.5667 49.5021L56.3796 97.5965Z" fill="url(#paint0_linear_1351_254)"/>
      <path d="M56.3796 97.5965C53.8491 100.783 48.7182 99.0372 48.6572 94.9682L47.7656 35.4537H87.7831C95.0313 35.4537 99.0738 43.8255 94.5667 49.5021L56.3796 97.5965Z" fill="url(#paint1_linear_1351_254)" fillOpacity="0.2"/>
      <path d="M40.1052 1.83277C42.6357 -1.35431 47.7667 0.391984 47.8276 4.46107L48.2183 63.9754H8.70173C1.45328 63.9754 -2.58931 55.6036 1.91799 49.927L40.1052 1.83277Z" fill="#3ECF8E"/>
    </g>
    <defs>
      <linearGradient id="paint0_linear_1351_254" x1="47.7656" y1="48.6496" x2="83.3317" y2="63.5659" gradientUnits="userSpaceOnUse">
        <stop stopColor="#249361"/>
        <stop offset="1" stopColor="#3ECF8E"/>
      </linearGradient>
      <linearGradient id="paint1_linear_1351_254" x1="31.9975" y1="27.0602" x2="48.2175" y2="57.5935" gradientUnits="userSpaceOnUse">
        <stop/>
        <stop offset="1" stopOpacity="0"/>
      </linearGradient>
      <clipPath id="clip0_1351_254">
        <rect width="96.4602" height="100" fill="white"/>
      </clipPath>
    </defs>
  </svg>
);

const SwiggyLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="-7.3 3.6 2520.1 3702.8" xmlns="http://www.w3.org/2000/svg" className={props.className} style={props.style}>
    <path d="m1255.2 3706.3c-2.4-1.7-5-4-7.8-6.3-44.6-55.3-320.5-400.9-601.6-844.2-84.4-141.2-139.1-251.4-128.5-279.9 27.5-74.1 517.6-114.7 668.5-47.5 45.9 20.4 44.7 47.3 44.7 63.1 0 67.8-3.3 249.8-3.3 249.8 0 37.6 30.5 68.1 68.2 68 37.7 0 68.1-30.7 68-68.4l-.7-453.3h-.1c0-39.4-43-49.2-51-50.8-78.8-.5-238.7-.9-410.5-.9-379 0-463.8 15.6-528-26.6-139.5-91.2-367.6-706-372.9-1052-7.5-488 281.5-910.5 688.7-1119.8 170-85.6 362-133.9 565-133.9 644.4 0 1175.2 486.4 1245.8 1112.3 0 .5 0 1.2.1 1.7 13 151.3-820.9 183.4-985.8 139.4-25.3-6.7-31.7-32.7-31.7-43.8-.1-115-.9-438.8-.9-438.8-.1-37.7-30.7-68.1-68.4-68.1-37.6 0-68.1 30.7-68.1 68.4l1.5 596.4c1.2 37.6 32.7 47.7 41.4 49.5 93.8 0 313.1-.1 517.4-.1 276.1 0 392.1 32 469.3 90.7 51.3 39.1 71.1 114 53.8 211.4-154.9 866-1135.9 1939.1-1172.8 1983.8z" fill="#fc8019"/>
  </svg>
);

const MondayLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 1549 904" xmlns="http://www.w3.org/2000/svg" className={props.className} style={props.style}>
    <path fill="#fa265d" d="m192.5 902.6c-69.6 0-133.5-37-167.3-94.5-33.9-59.4-32.6-130.9 4.5-188.3l346.1-529.3c35.8-57.5 100.9-91.3 170.6-90 69.6 1.9 133.4 40.2 166 99.6 32.6 58.7 28.1 130.2-10.8 186.4l-346.2 529.3c-33.9 54.3-95.8 86.8-162.9 86.8z"/>
    <path fill="#ffcc00" d="m782 902.6c-69.6 0-133.5-35.7-167.3-94.5-33.9-59.4-31.3-130.9 4.5-186.4l346.1-529.3c35.8-57.5 100.9-93.2 170.6-91.9 71.5 1.9 134.7 40.2 166 99.6 32.6 60.6 28.1 131.5-12.8 187.7l-344.2 528c-35.8 54.3-95.8 86.8-162.9 86.8z"/>
    <path fillRule="evenodd" fill="#00c972" d="m1356.8 903.9c-105.9 0-191.6-85.6-191.6-191.5 0-106 85.7-191.6 191.6-191.6 106 0 191.6 85.6 191.6 191.6 0 105.9-85.6 191.5-191.6 191.5z"/>
  </svg>
);

const CloudflareLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" aria-label="Cloudflare" viewBox="0 0 512 512" fill="#000000" className={props.className} style={props.style}>
    <rect width="512" height="512" rx="15%" fill="#ffffff" />
    <path fill="#f38020" d="M331 326c11-26-4-38-19-38l-148-2c-4 0-4-6 1-7l150-2c17-1 37-15 43-33 0 0 10-21 9-24a97 97 0 0 0-187-11c-38-25-78 9-69 46-48 3-65 46-60 72 0 1 1 2 3 2h274c1 0 3-1 3-3z" />
    <path fill="#faae40" d="M381 224c-4 0-6-1-7 1l-5 21c-5 16 3 30 20 31l32 2c4 0 4 6-1 7l-33 1c-36 4-46 39-46 39 0 2 0 3 2 3h113l3-2a81 81 0 0 0-78-103" />
  </svg>
);

const YahooFinanceLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1079 1000" className={props.className} style={props.style}>
    <path fill="#6001d1" d="m847 0h231.1q-92.6 223.5-185.1 447c-7.3 17.4-14.2 35.1-21.9 52.4-76.8 0-153.7 0.1-230.6-0.1 2-6 4.7-11.8 7.1-17.7 66.5-160.5 132.8-321.1 199.4-481.6zm-846.9 244.2c69.3-0.1 138.6 0 207.9-0.1 1.3 0.2 3.1-0.3 3.7 1.3 2 4.1 3.3 8.5 5.1 12.8 39.1 100.1 78.3 200.3 117.4 300.4 1.1 2.9 2.1 5.8 3.8 8.3 42.4-107.6 84.8-215.1 127.3-322.6 68.5-0.2 137.1-0.1 205.6-0.1-2.6 7.2-5.8 14.1-8.6 21.2-61.2 147.4-122.3 294.9-183.5 442.4-40.4 97.4-80.9 194.8-121.1 292.2h-206.9c27.7-65.7 55.4-131.3 83.2-197 1-1.9 1.1-4.2 0.1-6.1-78-184.2-156.1-368.4-234-552.7zm689.2 304.1c7.8-0.9 15.6-0.8 23.3 0.1 26.8 2 53 12.9 73.1 30.9 16.4 14.5 28.6 33.7 35.3 54.5 12.7 39.1 6 83.9-18 117.3-11.7 16.5-27.4 30.2-45.5 39.5-40.2 21.1-91.7 19.7-130.1-5-21.1-13.4-37.8-33.4-47.5-56.5-13.4-31.6-13.4-68.5-0.2-100.2 12.7-31.7 38.5-58 70.1-71 12.6-5.3 26-8.6 39.5-9.6z"/>
  </svg>
);

const NeonLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 57.5 57" xmlns="http://www.w3.org/2000/svg" className={props.className} style={props.style}>
    <defs>
      <linearGradient id="neon_g1" x2="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(-50.032,-57.652,62.466,-54.21,57.588,57)">
        <stop offset="0" stopColor="#2ef51c" stopOpacity="1"/>
        <stop offset="1" stopColor="#2ef51c" stopOpacity="0"/>
      </linearGradient>
      <linearGradient id="neon_g2" x2="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(-34.011,-13.404,13.812,-35.046,57.461,56.966)">
        <stop offset="0" stopColor="#000000" stopOpacity=".9"/>
        <stop offset="1" stopColor="#1a1a1a" stopOpacity="0"/>
      </linearGradient>
    </defs>
    <path fillRule="evenodd" fill="#32c0ed" d="m0 9.8c0-5.4 4.4-9.8 9.9-9.8h37.7c5.4 0 9.9 4.4 9.9 9.8v31.8c0 5.6-7.2 8-10.7 3.6l-10.8-13.9v16.9c0 4.8-4 8.8-9 8.8h-17.1c-5.5 0-9.9-4.4-9.9-9.8zm9.9-2c-1.1 0-2 0.9-2 2v37.3c0 1.1 0.9 2 2 2h17.4c0.6 0 0.7-0.5 0.7-1v-22.5c0-5.7 7.2-8.1 10.7-3.7l10.8 13.9v-26c0-1.1 0.1-2-1-2z"/>
    <path fillRule="evenodd" fill="url(#neon_g1)" d="m0 9.8c0-5.4 4.4-9.8 9.9-9.8h37.7c5.4 0 9.9 4.4 9.9 9.8v31.8c0 5.6-7.2 8-10.7 3.6l-10.8-13.9v16.9c0 4.8-4 8.8-9 8.8h-17.1c-5.5 0-9.9-4.4-9.9-9.8zm9.9-2c-1.1 0-2 0.9-2 2v37.3c0 1.1 0.9 2 2 2h17.4c0.6 0 0.7-0.5 0.7-1v-22.5c0-5.7 7.2-8.1 10.7-3.7l10.8 13.9v-26c0-1.1 0.1-2-1-2z"/>
    <path fillRule="evenodd" fill="url(#neon_g2)" opacity="0.3" d="m0 9.8c0-5.4 4.4-9.8 9.9-9.8h37.7c5.4 0 9.9 4.4 9.9 9.8v31.8c0 5.6-7.2 8-10.7 3.6l-10.8-13.9v16.9c0 4.8-4 8.8-9 8.8h-17.1c-5.5 0-9.9-4.4-9.9-9.8zm9.9-2c-1.1 0-2 0.9-2 2v37.3c0 1.1 0.9 2 2 2h17.4c0.6 0 0.7-0.5 0.7-1v-22.5c0-5.7 7.2-8.1 10.7-3.7l10.8 13.9v-26c0-1.1 0.1-2-1-2z"/>
    <path fill="#63f655" d="m47.6 0c5.4 0 9.9 4.4 9.9 9.8v31.8c0 5.6-7.2 8-10.7 3.6l-10.8-13.9v16.9c0 4.8-4 8.8-9 8.8 0.6 0 1-0.4 1-1v-30.4c0-5.6 7.2-8 10.7-3.6l10.8 13.9v-33.9c0-1.1-0.9-2-1.9-2z"/>
  </svg>
);


const NetlifyLogo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="#00C7B7" viewBox="0 0 24 24" className={props.className} style={props.style}>
    <path d="M6.49 19.04h-.23L5.13 17.9v-.23l1.73-1.71h1.2l.15.15v1.2L6.5 19.04ZM5.13 6.31V6.1l1.13-1.13h.23L8.2 6.68v1.2l-.15.15h-1.2zm9.96 9.09h-1.65l-.14-.13v-3.83c0-.68-.27-1.2-1.1-1.23-.42 0-.9 0-1.43.02l-.07.08v4.96l-.14.14H8.9l-.13-.14V8.73l.13-.14h3.7a2.6 2.6 0 0 1 2.61 2.6v4.08l-.13.14Zm-8.37-2.44H.14L0 12.82v-1.64l.14-.14h6.58l.14.14v1.64zm17.14 0h-6.58l-.14-.14v-1.64l.14-.14h6.58l.14.14v1.64zM11.05 6.55V1.64l.14-.14h1.65l.14.14v4.9l-.14.14h-1.65zm0 15.81v-4.9l.14-.14h1.65l.14.13v4.91l-.14.14h-1.65z"/>
  </svg>
);

export const PROVIDER_TEMPLATES: ProviderTemplate[] = [
  { id: 'notion', name: 'Notion', desc: 'Search and sync workspace pages, databases, and lists.', icon: NotionLogo, type: 'oauth', url: 'https://mcp.notion.com/mcp', category: 'work' },
  { id: 'canva', name: 'Canva', desc: 'Search designs, manage folders, upload assets, and export work.', icon: CanvaLogo, type: 'oauth', url: 'https://mcp.canva.com/mcp', category: 'work' },
  { id: 'linear', name: 'Linear', desc: 'Search issues, list teams, create tickets, and manage project workflows.', icon: LinearLogo, type: 'oauth', url: 'https://mcp.linear.app/mcp', category: 'work' },
  { id: 'jira', name: 'Jira', desc: 'Search Jira tickets, manage projects, link issues, and track sprints.', icon: JiraLogo, type: 'oauth', url: 'https://mcp.atlassian.com/v1/mcp/authv2', category: 'work' },
  { id: 'asana', name: 'Asana', desc: 'Manage tasks, create projects, assign work, and track milestones.', icon: AsanaLogo, type: 'oauth', url: 'https://mcp.asana.com/sse', category: 'work' },
  { id: 'airtable', name: 'Airtable', desc: 'Read and write base records, search tables, and inspect schemas.', icon: AirtableLogo, type: 'oauth', url: 'https://mcp.airtable.com/mcp', category: 'work' },
  { id: 'monday', name: 'Monday.com', desc: 'Manage boards, track tasks, update items, and automate collaborative workflows.', icon: MondayLogo, type: 'oauth', url: 'https://mcp.monday.com/mcp', category: 'work' },
  { id: 'github', name: 'GitHub', desc: 'Read code, search files, manage repos, and commit work.', icon: GitHubLogo, type: 'oauth', url: 'https://mcp.github.com/mcp', category: 'developer' },
  { id: 'vercel', name: 'Vercel', desc: 'Deploy projects, manage domains, list deployments, and trigger builds.', icon: VercelLogo, type: 'oauth', url: 'https://mcp.vercel.com', category: 'developer' },
  { id: 'godaddy', name: 'GoDaddy', desc: 'Search domain availability, register domains, and manage DNS settings.', icon: GoDaddyLogo, type: 'oauth', url: 'https://api.godaddy.com/v1/domains/mcp', category: 'developer' },
  { id: 'supabase', name: 'Supabase', desc: 'Manage Supabase projects, databases, storage buckets, and edge functions.', icon: SupabaseLogo, type: 'oauth', url: 'https://mcp.supabase.com/mcp', category: 'developer' },
  { id: 'cloudflare', name: 'Cloudflare', desc: 'Inspect zones, manage DNS records, check traffic data, and purge cache.', icon: CloudflareLogo, type: 'oauth', url: 'https://mcp.cloudflare.com/mcp', category: 'developer' },
  { id: 'neon', name: 'Neon', desc: 'Manage Neon serverless Postgres projects, branches, endpoints, and databases.', icon: NeonLogo, type: 'oauth', url: 'https://mcp.neon.tech/mcp', category: 'developer' },
  { id: 'netlify', name: 'Netlify', desc: 'Manage Netlify sites, deployments, configure environment variables, and sync web projects.', icon: NetlifyLogo, type: 'oauth', url: 'https://netlify-mcp.netlify.app/mcp', category: 'developer' },
  { id: 'parallel', name: 'Parallel Search', desc: 'Execute high-performance web searches and aggregate web results.', icon: ParallelSearchLogo, type: 'oauth', url: 'https://search.parallel.ai/mcp', category: 'search' },
  { id: 'cryptocom', name: 'Crypto.com', desc: 'Retrieve real-time market data, check coin rates, and track digital assets.', icon: CryptoLogo, type: 'oauth', url: 'https://mcp.crypto.com/market-data/mcp', category: 'finance' },
  { id: 'yahoofinance', name: 'Yahoo Finance', desc: 'Query stock quotes, search ticker details, retrieve historical prices, and fetch financial news.', icon: YahooFinanceLogo, type: 'oauth', url: 'https://gateway.mcpservers.org/yahoo-finance/mcp', category: 'finance' },
  { id: 'cal', name: 'Cal.com', desc: 'Read calendars, check availability, and schedule meetings.', icon: CalLogo, type: 'oauth', url: 'https://mcp.cal.com/mcp', category: 'scheduling' },
  { id: 'swiggy_food', name: 'Swiggy Food', desc: 'Order food online from restaurants near you, search menus, and manage your cart.', icon: SwiggyLogo, type: 'oauth', url: 'https://mcp.swiggy.com/food', category: 'commerce' },
  { id: 'swiggy_dineout', name: 'Swiggy Dineout', desc: 'Find nearby restaurants, reserve tables, and book dining experiences.', icon: SwiggyLogo, type: 'oauth', url: 'https://mcp.swiggy.com/dineout', category: 'commerce' },
  { id: 'swiggy_instamart', name: 'Swiggy Instamart', desc: 'Order groceries, fresh food, and household essentials for quick delivery.', icon: SwiggyLogo, type: 'oauth', url: 'https://mcp.swiggy.com/im', category: 'commerce' }
];

export const PROVIDER_LOGOS: Record<string, ComponentType<any>> = {
  github: GitHubLogo,
  notion: NotionLogo,
  cal: CalLogo,
  vercel: VercelLogo,
  canva: CanvaLogo,
  linear: LinearLogo,
  jira: JiraLogo,
  asana: AsanaLogo,
  airtable: AirtableLogo,
  cryptocom: CryptoLogo,
  godaddy: GoDaddyLogo,
  parallel: ParallelSearchLogo,
  supabase: SupabaseLogo,
  swiggy_food: SwiggyLogo,
  swiggy_dineout: SwiggyLogo,
  swiggy_instamart: SwiggyLogo,
  monday: MondayLogo,
  cloudflare: CloudflareLogo,
  yahoofinance: YahooFinanceLogo,
  neon: NeonLogo,
  netlify: NetlifyLogo
};
