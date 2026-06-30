'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, MCPIntegration } from '@/lib/db';
import { executeDirectTool, discoverDirectTools, preflightRefreshIntegrations } from '@/lib/mcp-client';
import { 
  Github, Calendar, Puzzle, RefreshCw, Trash2, Plus, 
  Check, AlertTriangle, Globe, Lock, Settings, ChevronRight, X, Info,
  Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCustomToast } from '@/components/ui/custom-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  discoverOAuthMetadata, 
  registerMcpClient, 
  generateCodeVerifier, 
  generateCodeChallenge 
} from '@/lib/mcp-oauth';

const formatToolName = (name: string) => {
  let cleanName = name.replace(/^__+|__+$/g, '');
  cleanName = cleanName.replace(/[_-]+/g, ' ');
  return cleanName
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

const PROVIDER_SCOPES: Record<string, string> = {
  github: 'repo',
  cal: 'EVENT_TYPE_READ EVENT_TYPE_WRITE BOOKING_READ BOOKING_WRITE SCHEDULE_READ SCHEDULE_WRITE APPS_READ APPS_WRITE PROFILE_READ PROFILE_WRITE ORG_BOOKING_READ TEAM_BOOKING_READ ORG_MEMBERSHIP_READ ORG_MEMBERSHIP_WRITE ORG_ROUTING_FORM_READ',
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
  supabase: ''
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
  <svg width="28" height="28" viewBox="0 0 16 16" fill="currentColor" style={{ ...props.style, position: 'relative', minHeight: '28px', minWidth: '28px', top: '0' }} className={props.className}>
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

const PROVIDER_TEMPLATES = [
  { id: 'github', name: 'GitHub', desc: 'Read code, search files, manage repos, and commit work.', icon: GitHubLogo, type: 'oauth', url: 'https://mcp.github.com/mcp', category: 'Featured' },
  { id: 'notion', name: 'Notion', desc: 'Search and sync workspace pages, databases, and lists.', icon: NotionLogo, type: 'oauth', url: 'https://mcp.notion.com/mcp', category: 'Featured' },
  { id: 'cal', name: 'Cal.com', desc: 'Read calendars, check availability, and schedule meetings.', icon: CalLogo, type: 'oauth', url: 'https://mcp.cal.com/mcp', category: 'Featured' },
  { id: 'vercel', name: 'Vercel', desc: 'Deploy projects, manage domains, list deployments, and trigger builds.', icon: VercelLogo, type: 'oauth', url: 'https://mcp.vercel.com', category: 'Featured' },
  { id: 'canva', name: 'Canva', desc: 'Search designs, manage folders, upload assets, and export work.', icon: CanvaLogo, type: 'oauth', url: 'https://mcp.canva.com/mcp', category: 'Featured' },
  { id: 'linear', name: 'Linear', desc: 'Search issues, list teams, create tickets, and manage project workflows.', icon: LinearLogo, type: 'oauth', url: 'https://mcp.linear.app/mcp', category: 'Featured' },
  { id: 'jira', name: 'Jira', desc: 'Search Jira tickets, manage projects, link issues, and track sprints.', icon: JiraLogo, type: 'oauth', url: 'https://mcp.atlassian.com/v1/mcp/authv2', category: 'Featured' },
  { id: 'asana', name: 'Asana', desc: 'Manage tasks, create projects, assign work, and track milestones.', icon: AsanaLogo, type: 'oauth', url: 'https://mcp.asana.com/sse', category: 'Featured' },
  { id: 'airtable', name: 'Airtable', desc: 'Read and write base records, search tables, and inspect schemas.', icon: AirtableLogo, type: 'oauth', url: 'https://mcp.airtable.com/mcp', category: 'Featured' },
  { id: 'cryptocom', name: 'Crypto.com', desc: 'Retrieve real-time market data, check coin rates, and track digital assets.', icon: CryptoLogo, type: 'oauth', url: 'https://mcp.crypto.com/market-data/mcp', category: 'Featured' },
  { id: 'godaddy', name: 'GoDaddy', desc: 'Search domain availability, register domains, and manage DNS settings.', icon: GoDaddyLogo, type: 'oauth', url: 'https://api.godaddy.com/v1/domains/mcp', category: 'Featured' },
  { id: 'parallel', name: 'Parallel Search', desc: 'Execute high-performance web searches and aggregate web results.', icon: ParallelSearchLogo, type: 'oauth', url: 'https://search.parallel.ai/mcp', category: 'Featured' },
  { id: 'supabase', name: 'Supabase', desc: 'Manage Supabase projects, databases, storage buckets, and edge functions.', icon: SupabaseLogo, type: 'oauth', url: 'https://mcp.supabase.com/mcp', category: 'Featured' }
];

export function IntegrationsTab() {
  const { showToast } = useCustomToast();
  const integrations = useLiveQuery(() => db.mcpIntegrations.toArray()) || [];
  
  const [selectedIntegration, setSelectedIntegration] = useState<MCPIntegration | null>(null);
  const [isRegisteringCustom, setIsRegisteringCustom] = useState(false);
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'skills' | 'connectors'>('connectors');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTmplModal, setActiveTmplModal] = useState<any | null>(null);
  const [showAllTools, setShowAllTools] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<any | null>(null);

  useEffect(() => {
    setMounted(true);

    const restoreProvider = sessionStorage.getItem('settings-restore-provider');
    if (!restoreProvider) return;

    // A. Check templates first (they are always in-memory and load instantly)
    const tmpl = PROVIDER_TEMPLATES.find(t => t.id === restoreProvider);
    if (tmpl) {
      setActiveTmplModal(tmpl);
      sessionStorage.removeItem('settings-restore-provider');
      return;
    }

    // B. Check custom integrations (wait until loaded from IndexedDB query)
    const conn = integrations.find(i => i.id === restoreProvider);
    if (conn) {
      setSelectedIntegration(conn);
      sessionStorage.removeItem('settings-restore-provider');
    }
  }, [integrations]);

  // Custom Integration Form state
  const [customName, setCustomName] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [customMode, setCustomMode] = useState<'auto' | 'direct' | 'proxy'>('auto');
  const [customAuthType, setCustomAuthType] = useState<'none' | 'apiKey' | 'oauth'>('none');
  const [customAccessToken, setCustomAccessToken] = useState('');
  const [customScopes, setCustomScopes] = useState('');

  const [detectingAuth, setDetectingAuth] = useState(false);
  const [detectedAuthResult, setDetectedAuthResult] = useState<'oauth' | 'apiKey' | 'none' | null>(null);
  const detectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleUrlChange = async (urlVal: string) => {
    setDetectedAuthResult(null);

    // Only probe if it's a valid URL starting with http:// or https://
    if (!urlVal.startsWith('http://') && !urlVal.startsWith('https://')) {
      return;
    }

    setDetectingAuth(true);
    try {
      // 1. Check for OAuth first
      const metadata = await discoverOAuthMetadata(urlVal);
      if (metadata && metadata.authorization_endpoint && metadata.token_endpoint) {
        setDetectedAuthResult('oauth');
        setCustomAuthType('oauth');
        return;
      }

      // 2. Check if it's open or requires a token
      const probeRes = await fetch('/api/mcp/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlVal
        })
      });

      if (probeRes.ok) {
        setDetectedAuthResult('none');
        setCustomAuthType('none');
      } else {
        const errData = await probeRes.json().catch(() => ({}));
        const errMsg = errData.error || '';
        if (
          probeRes.status === 401 ||
          errMsg.includes('401') ||
          errMsg.toLowerCase().includes('credentials required') ||
          errMsg.toLowerCase().includes('api key') ||
          errMsg.toLowerCase().includes('invalid_token')
        ) {
          setDetectedAuthResult('apiKey');
          setCustomAuthType('apiKey');
        } else {
          setDetectedAuthResult('none');
          setCustomAuthType('none');
        }
      }
    } catch (err) {
      console.warn('[Auto-detect Auth] Probe failed', err);
      setDetectedAuthResult('none');
      setCustomAuthType('none');
    } finally {
      setDetectingAuth(false);
    }
  };

  const handleUrlInput = (urlVal: string) => {
    setCustomUrl(urlVal);
    
    if (detectTimeoutRef.current) {
      clearTimeout(detectTimeoutRef.current);
    }

    detectTimeoutRef.current = setTimeout(() => {
      handleUrlChange(urlVal);
    }, 600);
  };

  const resetCustomForm = () => {
    setCustomName('');
    setCustomUrl('');
    setCustomMode('auto');
    setCustomAuthType('none');
    setCustomAccessToken('');
    setCustomScopes('');
    setDetectingAuth(false);
    setDetectedAuthResult(null);
    setIsConnecting(false);
    if (detectTimeoutRef.current) {
      clearTimeout(detectTimeoutRef.current);
    }
  };

  const triggerOAuthFlow = async (provider: string, remoteUrl: string, customScopeOverride?: string) => {
    try {
      showToast({
        title: 'Authorizing App',
        message: 'Discovering remote MCP server OAuth config...',
        type: 'info',
        mode: 'capsule'
      });

      // 1. Discover OAuth Metadata from the remote MCP server
      const metadata = await discoverOAuthMetadata(remoteUrl);
      if (!metadata) {
        throw new Error('Could not discover OAuth metadata endpoints on this remote MCP server.');
      }

      const isMobile = window.innerWidth < 768;
      const { origin } = window.location;
      const redirectUri = `${origin}/auth/callback`;
      const scope = customScopeOverride || PROVIDER_SCOPES[provider] || '';

      const stateId = Math.random().toString(36).substring(2, 15);
      const csrf = Math.random().toString(36).substring(2, 15);

      // 2. Register OAuth Client dynamically if supported
      let clientId = '';
      let clientSecret: string | undefined = undefined;
      if (metadata.registration_endpoint) {
        localStorage.removeItem(`mcp_oauth_client_${provider}`);
        localStorage.removeItem(`mcp_oauth_secret_${provider}`);
        try {
          const reg = await registerMcpClient(metadata.registration_endpoint, redirectUri, scope);
          clientId = reg.clientId;
          clientSecret = reg.clientSecret;
          localStorage.setItem(`mcp_oauth_client_${provider}`, clientId);
          if (clientSecret) {
            localStorage.setItem(`mcp_oauth_secret_${provider}`, clientSecret);
          }
        } catch (regErr) {
          console.warn('[OAuth Flow] Dynamic client registration failed, falling back to paradox-local client ID:', regErr);
          clientId = 'paradox-local';
        }
      } else {
        clientId = 'paradox-local'; // Default fallback client ID
      }

      // 3. Generate PKCE params
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      
      localStorage.setItem(`oauth_csrf_${provider}_${stateId}`, csrf);
      localStorage.setItem(`oauth_verifier_${provider}_${stateId}`, codeVerifier);
      localStorage.setItem(`oauth_client_${provider}_${stateId}`, clientId);
      if (clientSecret) {
        localStorage.setItem(`oauth_secret_${provider}_${stateId}`, clientSecret);
      }
      localStorage.setItem(`oauth_token_endpoint_${provider}_${stateId}`, metadata.token_endpoint);

      const state = encodeURIComponent(JSON.stringify({ 
        provider, 
        isMobile, 
        csrf, 
        stateId, 
        remoteUrl 
      }));

      // 4. Formulate the official Authorize URL redirecting to the remote gateway
      let authorizeUrl = `${metadata.authorization_endpoint}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&code_challenge=${codeChallenge}&code_challenge_method=S256&response_type=code`;
      if (scope) {
        authorizeUrl += `&scope=${encodeURIComponent(scope)}`;
      }

      if (isMobile) {
        localStorage.setItem('mcp_oauth_restore_state', JSON.stringify({ provider }));
        window.location.href = authorizeUrl;
      } else {
        const popup = window.open(authorizeUrl, 'oauth-popup', 'width=600,height=750,status=no,resizable=yes');
        
        const handleMessage = (event: MessageEvent) => {
          if (
            event.origin === window.location.origin && 
            event.data?.type === 'AUTH_SUCCESS' && 
            event.data?.provider === provider
          ) {
            window.removeEventListener('message', handleMessage);
            showToast({
              title: 'App Authorized',
              message: `Successfully authenticated with ${provider.charAt(0).toUpperCase() + provider.slice(1)}!`,
              type: 'success',
              mode: 'capsule'
            });
            // Reload tools list after successful login callback
            syncTools(provider);
          }
        };
        
        window.addEventListener('message', handleMessage);
      }
    } catch (err: any) {
      console.error(err);
      showToast({
        title: 'Authorization Failed',
        message: err.message || 'Could not initiate login consent flow.',
        type: 'error',
        mode: 'capsule'
      });
    }
  };

  // OAuth triggering flow
  const handleConnectOAuth = async (provider: string, remoteUrl: string) => {
    try {
      showToast({
        title: 'Connecting Account',
        message: `Setting up connection to ${provider}...`,
        type: 'info',
        mode: 'capsule'
      });

      // 1. Probe remote server OAuth capability
      let supportsOAuth = false;
      try {
        const metadata = await discoverOAuthMetadata(remoteUrl);
        if (metadata && metadata.authorization_endpoint && metadata.token_endpoint) {
          supportsOAuth = true;
        }
      } catch (err) {
        console.log('[OAuth Probe] Remote server does not support OAuth, registering as public:', err);
      }

      const existing = await db.mcpIntegrations.get(provider);
      const tmpl = PROVIDER_TEMPLATES.find(t => t.id === provider);
      const name = tmpl?.name || provider.charAt(0).toUpperCase() + provider.slice(1);
      const scopeToUse = existing?.scope || undefined;

      if (!supportsOAuth) {
        // Register as No Auth / Public
        await db.mcpIntegrations.put({
          id: provider,
          name,
          url: remoteUrl,
          connectionMode: 'auto',
          authType: 'none',
          isEnabled: true,
          status: 'connected',
          cachedTools: [],
          lastToolSync: 0,
          createdAt: Date.now()
        });

        showToast({
          title: 'Connected',
          message: `${name} connected successfully!`,
          type: 'success',
          mode: 'capsule'
        });

        // Sync tools in background
        await syncTools(provider);
        return;
      }
      
      await db.mcpIntegrations.put({
        id: provider,
        name,
        url: remoteUrl,
        connectionMode: 'auto', // Default to auto checks
        authType: 'oauth',
        isEnabled: true,
        status: 'disconnected',
        scope: scopeToUse,
        cachedTools: [],
        lastToolSync: 0,
        createdAt: Date.now()
      });

      // Launch dynamic client registration and PKCE flow immediately
      await triggerOAuthFlow(provider, remoteUrl, scopeToUse);
    } catch (e: any) {
      showToast({
        title: 'Connection Failed',
        message: e.message || 'Could not register integration.',
        type: 'error',
        mode: 'capsule'
      });
    }
  };

  const handleTemplateClick = (tmpl: any) => {
    setActiveTmplModal(tmpl);
    setShowAllTools(false);
  };

  // Register custom SSE integration
  const handleRegisterCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customUrl) {
      showToast({
        title: 'Missing Fields',
        message: 'Name and SSE endpoint URL are required.',
        type: 'error',
        mode: 'capsule'
      });
      return;
    }

    setIsConnecting(true);
    try {
      const parsedUrl = new URL(customUrl);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new Error('Endpoint must start with http:// or https://');
      }

      const id = customName.toLowerCase().replace(/[^a-z0-9]/g, '-');

      showToast({
        title: 'Registering Connector',
        message: 'Connecting to remote server and detecting capabilities...',
        type: 'info',
        mode: 'capsule'
      });

      // 1. Pre-flight check: Autodetect remote OAuth capabilities (RFC 8414)
      let detectedAuthType = customAuthType;
      let supportsOAuth = false;

      try {
        const metadata = await discoverOAuthMetadata(customUrl);
        if (metadata && metadata.authorization_endpoint && metadata.token_endpoint) {
          supportsOAuth = true;
          detectedAuthType = 'oauth';
        }
      } catch (err) {
        console.log('[OAuth Autodetect] No OAuth metadata found on server, falling back', err);
      }

      const isOAuth = customAuthType === 'oauth' || supportsOAuth;

      if (isOAuth) {
        // Register integration with status 'disconnected' and authType 'oauth'
        await db.mcpIntegrations.put({
          id,
          name: customName,
          url: customUrl,
          connectionMode: customMode,
          authType: 'oauth',
          isEnabled: true,
          status: 'disconnected',
          scope: customScopes || undefined,
          cachedTools: [],
          lastToolSync: 0,
          createdAt: Date.now()
        });

        showToast({
          title: customAuthType === 'oauth' ? 'OAuth Integration' : 'OAuth Autodetected',
          message: 'OAuth enabled! Launching authentication consent flow...',
          type: 'success',
          mode: 'capsule'
        });

        const urlToRegister = customUrl;
        const scopesToRegister = customScopes;
        setIsRegisteringCustom(false);
        setShowAdvanced(false);
        resetCustomForm();

        // Launch PKCE authorization flow immediately
        await triggerOAuthFlow(id, urlToRegister, scopesToRegister);
        return;
      }

      // 2. Pre-flight connection probe (only for non-OAuth connectors)
      if (!isOAuth) {
        const probeRes = await fetch('/api/mcp/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: customUrl,
            accessToken: customAccessToken || undefined
          })
        });

        if (!probeRes.ok) {
          const errData = await probeRes.json().catch(() => ({}));
          const errMsg = errData.error || '';
          if (
            probeRes.status === 401 ||
            errMsg.includes('401') ||
            errMsg.toLowerCase().includes('credentials required') ||
            errMsg.toLowerCase().includes('api key') ||
            errMsg.toLowerCase().includes('invalid_token')
          ) {
            throw new Error('Authentication Required: This server requires an Access Token. Please open Advanced Settings, change Auth Type to Bearer Token, and enter your API key.');
          }
          throw new Error(errMsg || `Could not connect to the remote server (status: ${probeRes.status})`);
        }
      }

      // 3. Normal Flow: No OAuth detected, register as none/bearer
      await db.mcpIntegrations.put({
        id,
        name: customName,
        url: customUrl,
        connectionMode: customMode,
        authType: customAuthType,
        accessToken: customAccessToken || undefined,
        isEnabled: true,
        status: 'connected',
        cachedTools: [],
        lastToolSync: 0,
        createdAt: Date.now()
      });

      showToast({
        title: 'Custom Integration Created',
        message: `Registered ${customName} successfully. Syncing tools...`,
        type: 'success',
        mode: 'capsule'
      });

      setIsRegisteringCustom(false);
      setShowAdvanced(false);
      resetCustomForm();

      await syncTools(id);
    } catch (err: any) {
      showToast({
        title: 'Registration Error',
        message: err.message || 'Invalid server URL structure.',
        type: 'error',
        mode: 'capsule'
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Synchronize tools list from Client-Side SSE or Proxy Discovery API
  const syncTools = async (integrationId: string) => {
    setIsSyncing(prev => ({ ...prev, [integrationId]: true }));
    try {
      // Refresh token if expired or expiring before discovery check
      await preflightRefreshIntegrations();

      const record = await db.mcpIntegrations.get(integrationId);
      if (!record) return;

      // If we don't have an access token yet and auth is OAuth, trigger login flow immediately
      if (record.authType === 'oauth' && !record.accessToken) {
        await triggerOAuthFlow(integrationId, record.url);
        setIsSyncing(prev => ({ ...prev, [integrationId]: false }));
        return;
      }

      let tools: any[] = [];
      let syncError = '';

      // 1. If connectionMode is 'direct' or 'auto', try browser direct SSE handshake
      if (record.connectionMode === 'direct' || record.connectionMode === 'auto') {
        try {
          console.log(`[MCP Sync] Attempting direct browser tools list for ${record.name} at ${record.url}`);
          tools = await discoverDirectTools(record.url, record.accessToken);
          console.log(`[MCP Sync] Browser direct tools list success: loaded ${tools.length} tools.`);
        } catch (err: any) {
          console.warn(`[MCP Sync] Browser direct tools list failed for ${record.name}:`, err);
          syncError = err.message || '';
          // If connectionMode is strictly direct, propagate error. Otherwise fallback to proxy in auto.
          if (record.connectionMode === 'direct') {
            throw new Error(`Direct connection failed: ${err.message || 'CORS block or server offline.'}`);
          }
        }
      }

      // 2. Fallback: Proxy discovery via Next.js backend server
      if (tools.length === 0 && (record.connectionMode === 'proxy' || record.connectionMode === 'auto')) {
        console.log(`[MCP Sync] Attempting proxy backend tools list for ${record.name} at ${record.url}`);
        const res = await fetch('/api/mcp/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: record.url,
            accessToken: record.accessToken
          })
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || syncError || 'Failed to fetch schemas via proxy.');
        }

        const data = await res.json();
        // Check if preflight returned an authorization request URL
        if (data.requiresAuth && data.authorizationUrl) {
          console.log(`[MCP Sync] Server challenged with auth request URL: ${data.authorizationUrl}`);
          showToast({
            title: 'Authorization Required',
            message: `Opening login portal for ${record.name}...`,
            type: 'info',
            mode: 'capsule'
          });
          const popup = window.open(data.authorizationUrl, 'oauth-popup', 'width=600,height=750,status=no,resizable=yes');
          
          const handleMessage = (event: MessageEvent) => {
            if (
              event.origin === window.location.origin && 
              event.data?.type === 'AUTH_SUCCESS' && 
              event.data?.provider === integrationId
            ) {
              window.removeEventListener('message', handleMessage);
              // Retry sync schema after popup authorization success!
              syncTools(integrationId);
            }
          };
          window.addEventListener('message', handleMessage);
          setIsSyncing(prev => ({ ...prev, [integrationId]: false }));
          return;
        }

        tools = data.tools || [];
        console.log(`[MCP Sync] Proxy backend tools list success: loaded ${tools.length} tools.`);
      }

      // Namespace the tools using the integration ID to prevent collision if they aren't already namespaced
      const namespacedTools = tools.map((t: any) => {
        const cleanName = t.name.replace(/:/g, '_');
        const prefix = `${integrationId.toLowerCase()}_`;
        const namespacedName = cleanName.startsWith(prefix) ? cleanName : `${prefix}${cleanName}`;
        return {
          name: namespacedName,
          namespacedName: namespacedName,
          description: t.description || 'No description provided.',
          inputSchema: t.inputSchema || {}
        };
      });

      await db.mcpIntegrations.update(integrationId, {
        cachedTools: namespacedTools,
        lastToolSync: Date.now(),
        status: 'connected'
      });

      // Update selected detail view if open
      if (selectedIntegration?.id === integrationId) {
        const updated = await db.mcpIntegrations.get(integrationId);
        if (updated) setSelectedIntegration(updated);
      }

      showToast({
        title: 'Synchronization Complete',
        message: `Loaded ${namespacedTools.length} tool definitions from integration.`,
        type: 'success',
        mode: 'capsule'
      });
    } catch (err: any) {
      console.error(err);
      await db.mcpIntegrations.update(integrationId, { status: 'unreachable' });
      showToast({
        title: 'Sync Failed',
        message: err.message || 'Connection to remote server failed.',
        type: 'error',
        mode: 'capsule'
      });
    } finally {
      setIsSyncing(prev => ({ ...prev, [integrationId]: false }));
    }
  };

  // Toggle tool enabled state
  const handleToggleEnabled = async (integrationId: string, currentVal: boolean) => {
    try {
      await db.mcpIntegrations.update(integrationId, { isEnabled: !currentVal });
      if (selectedIntegration?.id === integrationId) {
        setSelectedIntegration(prev => prev ? { ...prev, isEnabled: !currentVal } : null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Disconnect / Delete integration
  const handleDeleteIntegration = async (integrationId: string) => {
    try {
      await db.mcpIntegrations.delete(integrationId);
      setSelectedIntegration(null);
      showToast({
        title: 'Integration Removed',
        message: 'Deleted integration credentials from local database.',
        type: 'success',
        mode: 'capsule'
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Update connection mode toggling
  const handleUpdateMode = async (integrationId: string, mode: 'auto' | 'direct' | 'proxy') => {
    try {
      await db.mcpIntegrations.update(integrationId, { connectionMode: mode });
      setSelectedIntegration(prev => prev ? { ...prev, connectionMode: mode } : null);
      showToast({
        title: 'Strategy Updated',
        message: `Set execution strategy to ${mode}.`,
        type: 'success',
        mode: 'capsule'
      });
    } catch (err) {
      console.error(err);
    }
  };

  // 1. Custom (user SSE-registered) connections
  const customConnectors = integrations.filter(
    i => !PROVIDER_TEMPLATES.some(tmpl => tmpl.id === i.id)
  );

  const filteredCustomConnectors = customConnectors.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. Filter templates
  const filteredTemplates = PROVIDER_TEMPLATES.filter(tmpl => 
    tmpl.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tmpl.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 3. Unified connected tools
  const allConnectedTools = integrations.flatMap(integration => 
    (integration.cachedTools || []).map(tool => ({
      ...tool,
      integrationName: integration.name,
      integrationId: integration.id
    }))
  );

  const filteredTools = allConnectedTools.filter(tool => 
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.integrationName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col min-h-0 text-foreground font-sans space-y-5">
      {/* Tabs & Search Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border shrink-0">
        {/* Switcher tabs */}
        <div className="flex gap-1 items-center bg-zinc-100 dark:bg-zinc-900/60 p-1 rounded-full border border-zinc-200 dark:border-border/40 w-fit shrink-0">
          <button 
            type="button"
            onClick={() => setActiveSubTab('skills')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs transition-colors cursor-pointer select-none font-medium whitespace-nowrap",
              activeSubTab === 'skills' 
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs" 
                : "text-zinc-500 hover:text-zinc-900 dark:text-muted-foreground dark:hover:text-foreground"
            )}
          >
            All Tools
          </button>
          <button 
            type="button"
            onClick={() => setActiveSubTab('connectors')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs transition-colors cursor-pointer select-none font-medium whitespace-nowrap",
              activeSubTab === 'connectors' 
                ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 shadow-xs" 
                : "text-zinc-500 hover:text-zinc-900 dark:text-muted-foreground dark:hover:text-foreground"
            )}
          >
            Connectors
          </button>
        </div>

        {/* Right side: Search + New Connector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="h-9 pl-8.5 pr-4 text-xs bg-zinc-100/60 dark:bg-zinc-900/40 border-zinc-200 dark:border-zinc-800 rounded-full focus-visible:ring-1 focus-visible:ring-cyan-500/30"
            />
          </div>
          <Button
            onClick={() => setIsRegisteringCustom(true)}
            className="h-9 px-5 rounded-full text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-black dark:hover:bg-zinc-200 cursor-pointer active:scale-[0.97] transition-all shrink-0 shadow-none border-0"
          >
            New Connector
          </Button>
        </div>
      </div>

      {/* Main Scroll Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar pr-0.5 pb-4">
        {activeSubTab === 'skills' ? (
          /* Skills Sub-Tab View */
          filteredTools.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-9 bg-zinc-50/5 dark:bg-zinc-950/10 border border-dashed border-zinc-200/20 dark:border-zinc-850 rounded-2xl">
              <Puzzle className="w-9 h-9 text-muted-foreground/45 mb-3" strokeWidth={1.5} />
              <p className="text-xs text-muted-foreground text-center font-medium">
                No active skills or tools found matching your search query.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {(() => {
                const grouped = filteredTools.reduce((acc, tool) => {
                  if (!acc[tool.integrationName]) {
                    acc[tool.integrationName] = [];
                  }
                  acc[tool.integrationName].push(tool);
                  return acc;
                }, {} as Record<string, typeof filteredTools>);

                return Object.entries(grouped).map(([integrationName, tools]) => (
                  <div key={integrationName} className="space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground/60 tracking-wider uppercase mb-1">
                      {integrationName} Tools ({tools.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {tools.map((tool) => (
                        <div 
                          key={`${tool.integrationId}-${tool.name}`}
                          onClick={() => setSelectedSkill(tool)}
                          className="flex flex-col p-5 h-36 bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-900 rounded-2xl hover:border-zinc-300 dark:hover:border-zinc-800 hover:shadow-xs transition-all duration-200 text-left cursor-pointer select-none"
                        >
                          <div className="flex items-start justify-between mb-2 gap-4">
                            <div className="flex flex-col min-w-0">
                              <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 truncate">
                                {formatToolName(tool.name)}
                              </span>
                              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                                {tool.name}
                              </span>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed font-normal mt-1.5 line-clamp-2">
                            {tool.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ));
              })()}
            </div>
          )
        ) : (
          /* Connectors Sub-Tab View */
          filteredTemplates.length === 0 && filteredCustomConnectors.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-9 bg-zinc-50/5 dark:bg-zinc-950/10 border border-dashed border-zinc-200/20 dark:border-zinc-850 rounded-2xl">
              <Puzzle className="w-9 h-9 text-muted-foreground/45 mb-3" strokeWidth={1.5} />
              <p className="text-xs text-muted-foreground text-center font-medium">
                No connectors found matching your search.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Featured Category */}
              {(() => {
                const featured = filteredTemplates.filter(t => t.category === 'Featured');
                if (featured.length === 0) return null;
                return (
                  <div>
                    <h4 className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase mb-3">Featured</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {featured.map(tmpl => {
                        const matchedConn = integrations.find(i => i.id === tmpl.id);
                        const isConnected = matchedConn && matchedConn.status === 'connected';
                        const TmplIcon = tmpl.icon;
                        return (
                          <div
                            key={tmpl.id}
                            onClick={() => handleTemplateClick(tmpl)}
                            className="group flex items-center gap-3.5 px-4 py-3.5 bg-transparent hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 border border-transparent hover:border-zinc-200/80 dark:hover:border-zinc-800/80 rounded-xl transition-all duration-150 cursor-pointer"
                          >
                            <div className="w-9 h-9 flex items-center justify-center shrink-0">
                              <TmplIcon className="w-7 h-7" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-100 leading-none block truncate">
                                {tmpl.name}
                              </span>
                              {isConnected ? (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Connected</span>
                                </div>
                              ) : (
                                <span className="text-[11.5px] text-zinc-400 dark:text-zinc-500 line-clamp-1 leading-normal mt-0.5 block">
                                  {tmpl.desc}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Finance Category */}
              {(() => {
                const finance = filteredTemplates.filter(t => t.category === 'Finance');
                if (finance.length === 0) return null;
                return (
                  <div>
                    <h4 className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase mb-3">Finance</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {finance.map(tmpl => {
                        const isConnected = integrations.some(i => i.id === tmpl.id);
                        const TmplIcon = tmpl.icon;
                        return (
                          <div
                            key={tmpl.id}
                            onClick={() => handleTemplateClick(tmpl)}
                            className="group flex items-center gap-3.5 px-4 py-3.5 bg-transparent hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 border border-transparent hover:border-zinc-200/80 dark:hover:border-zinc-800/80 rounded-xl transition-all duration-150 cursor-pointer"
                          >
                            <div className="w-9 h-9 flex items-center justify-center shrink-0">
                              <TmplIcon className="w-7 h-7" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-100 leading-none block truncate">
                                {tmpl.name}
                              </span>
                              {isConnected ? (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Connected</span>
                                </div>
                              ) : (
                                <span className="text-[11.5px] text-zinc-400 dark:text-zinc-500 line-clamp-1 leading-normal mt-0.5 block">
                                  {tmpl.desc}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Productivity Category */}
              {(() => {
                const productivity = filteredTemplates.filter(t => t.category === 'Productivity');
                if (productivity.length === 0) return null;
                return (
                  <div>
                    <h4 className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase mb-3">Productivity</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {productivity.map(tmpl => {
                        const isConnected = integrations.some(i => i.id === tmpl.id);
                        const TmplIcon = tmpl.icon;
                        return (
                          <div
                            key={tmpl.id}
                            onClick={() => handleTemplateClick(tmpl)}
                            className="group flex items-center gap-3.5 px-4 py-3.5 bg-transparent hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 border border-transparent hover:border-zinc-200/80 dark:hover:border-zinc-800/80 rounded-xl transition-all duration-150 cursor-pointer"
                          >
                            <div className="w-9 h-9 flex items-center justify-center shrink-0">
                              <TmplIcon className="w-7 h-7" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-100 leading-none block truncate">
                                {tmpl.name}
                              </span>
                              {isConnected ? (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Connected</span>
                                </div>
                              ) : (
                                <span className="text-[11.5px] text-zinc-400 dark:text-zinc-500 line-clamp-1 leading-normal mt-0.5 block">
                                  {tmpl.desc}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Custom Connectors Category */}
              {filteredCustomConnectors.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tracking-widest uppercase mb-3">Custom Connectors</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {filteredCustomConnectors.map(conn => {
                      const customTmpl = {
                        id: conn.id,
                        name: conn.name,
                        desc: 'Custom user-registered SSE Server.',
                        icon: Puzzle,
                        type: 'custom',
                        url: conn.url
                      };
                      return (
                        <div
                          key={conn.id}
                          onClick={() => handleTemplateClick(customTmpl)}
                          className="group flex items-center gap-3.5 px-4 py-3.5 bg-transparent hover:bg-zinc-100/70 dark:hover:bg-zinc-900/60 border border-transparent hover:border-zinc-200/80 dark:hover:border-zinc-800/80 rounded-xl transition-all duration-150 cursor-pointer"
                        >
                          <div className="w-9 h-9 flex items-center justify-center shrink-0">
                            <Puzzle className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-[13.5px] font-semibold text-zinc-800 dark:text-zinc-100 leading-none block truncate">
                              {conn.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                conn.status === 'connected' ? "bg-emerald-500" : "bg-amber-500"
                              )} />
                              <span className={cn(
                                "text-[10px] font-medium",
                                conn.status === 'connected' ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"
                              )}>
                                {conn.status === 'connected' ? 'Connected' : 'Disconnected'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      {/* 1. App Template Details & Connection Pop-up Modal */}
      <Dialog 
        open={!!activeTmplModal} 
        onOpenChange={(open) => setActiveTmplModal(open ? activeTmplModal : null)}
      >
        <DialogContent className="w-[92%] max-w-md bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-900 text-foreground font-sans rounded-[20px] p-0 overflow-hidden shadow-2xl text-left [&>button]:hidden focus:outline-none focus-visible:outline-none animate-in fade-in-50 zoom-in-95 duration-200">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-4 w-full text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200/50 dark:border-zinc-800 shrink-0">
                {activeTmplModal && (() => {
                  const TmplIcon = activeTmplModal.icon;
                  return <TmplIcon className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />;
                })()}
              </div>
              <div className="flex flex-col min-w-0 gap-0.5 text-left">
                <DialogTitle className="text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">{activeTmplModal?.name}</DialogTitle>
                <DialogDescription className="text-xs text-zinc-400 dark:text-zinc-500 leading-none">MCP Connector</DialogDescription>
              </div>
            </div>
            <button
              onClick={() => setActiveTmplModal(null)}
              className="text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-355 transition-colors p-1.5 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Content Details */}
          {activeTmplModal && (() => {
            const conn = integrations.find(i => i.id === activeTmplModal.id);
            return (
              <div className="px-6 pb-6 space-y-5 text-left">
                {/* Description */}
                <p className="text-xs sm:text-sm text-zinc-650 dark:text-zinc-300 leading-relaxed font-normal pb-1">
                  {activeTmplModal.desc}
                </p>

                {/* Server URL */}
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Server Endpoint URL</span>
                  <div className="text-xs font-mono text-zinc-700 dark:text-zinc-350 break-all select-all leading-normal bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2 rounded-xl border border-zinc-200/65 dark:border-zinc-800/80">
                    {activeTmplModal.url}
                  </div>
                </div>

                {/* Scopes if connected */}
                {conn && PROVIDER_SCOPES[activeTmplModal.id] && (
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Authorized Scopes</span>
                    <div className="text-xs font-mono text-zinc-700 dark:text-zinc-350 break-all leading-normal bg-zinc-50 dark:bg-zinc-900/50 px-3 py-2 rounded-xl border border-zinc-200/65 dark:border-zinc-800/80">
                      {PROVIDER_SCOPES[activeTmplModal.id]}
                    </div>
                  </div>
                )}

                {/* Tools listing if connected */}
                {conn && (
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                        All tools enabled
                      </span>
                      <button
                        type="button"
                        disabled={isSyncing[conn.id]}
                        onClick={() => syncTools(conn.id)}
                        className="text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-350 transition-colors p-1 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
                        title="Refresh tools list"
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5", isSyncing[conn.id] && "animate-spin")} />
                      </button>
                    </div>

                    {!conn.cachedTools || conn.cachedTools.length === 0 ? (
                      <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                        No tools found. Click refresh to query endpoints.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <div className="max-h-48 overflow-y-auto pr-1 no-scrollbar pt-0.5 pb-0.5">
                          <div className="flex flex-wrap gap-1.5">
                            {(() => {
                              const toolsToRender = showAllTools 
                                ? conn.cachedTools 
                                : conn.cachedTools.slice(0, 6);
                                return toolsToRender.map((tool) => (
                                  <div
                                    key={tool.name}
                                  className="inline-flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/50 dark:border-zinc-800/80 text-[11.5px] font-mono text-zinc-700 dark:text-zinc-300 px-2.5 py-1 rounded-full select-none"
                                >
                                  <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-550">✓</span>
                                  <span>{tool.name}</span>
                                </div>
                              ));
                            })()}
                          </div>
                        </div>

                        {conn.cachedTools.length > 6 && (
                          <button
                            type="button"
                            onClick={() => setShowAllTools(!showAllTools)}
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer select-none block mt-1"
                          >
                            {showAllTools ? 'See less' : 'See more'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Status indicator if connected */}
                {conn && conn.status === 'connected' && (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-medium pt-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Connected</span>
                  </div>
                )}

                {conn && conn.status !== 'connected' && (
                  <div className="flex items-center gap-2 text-xs text-amber-500 font-medium pt-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>Disconnected (Click Connect)</span>
                  </div>
                )}

                {/* Warning Disclaimer */}
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-normal font-normal pt-2 border-t border-zinc-100 dark:border-zinc-900/60">
                  Third-party connectors are not built or maintained by Paradox. Use caution when granting access to external services. Usage is subject to the <span className="underline hover:text-zinc-650 dark:hover:text-zinc-400 cursor-pointer transition-colors">Paradox Privacy Policy</span>.
                </p>
              </div>
            );
          })()}

          {/* Footer Action Button Tray */}
          <div className="px-6 py-4 flex justify-end items-center gap-2 bg-zinc-50/50 dark:bg-zinc-900/10 border-t border-zinc-100 dark:border-zinc-900">
            {activeTmplModal && (() => {
              const conn = integrations.find(i => i.id === activeTmplModal.id);
              if (conn && conn.status === 'connected') {
                return (
                  <>
                    <Button
                      variant="outline"
                      type="button"
                      disabled={isSyncing[conn.id]}
                      onClick={() => syncTools(conn.id)}
                      className="h-8 px-4 rounded-full text-xs font-medium border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-all active:scale-[0.98] flex items-center gap-1.5"
                    >
                      <RefreshCw className={cn("w-3 h-3 text-zinc-500", isSyncing[conn.id] && "animate-spin")} />
                      Refresh Connection
                    </Button>
                    <Button
                      onClick={() => {
                        handleDeleteIntegration(conn.id);
                        setActiveTmplModal(null);
                      }}
                      className="h-8 px-4 rounded-full text-xs font-bold bg-red-600 hover:bg-red-750 dark:bg-red-650 dark:hover:bg-red-550 text-white cursor-pointer transition-all active:scale-[0.98]"
                    >
                      Disconnect
                    </Button>
                  </>
                );
              } else if (conn) {
                return (
                  <>
                    <Button
                      onClick={() => {
                        handleDeleteIntegration(conn.id);
                        setActiveTmplModal(null);
                      }}
                      className="h-8 px-4 rounded-full text-xs font-bold bg-red-600 hover:bg-red-750 dark:bg-red-650 dark:hover:bg-red-550 text-white cursor-pointer transition-all active:scale-[0.98]"
                    >
                      Remove
                    </Button>
                    <Button
                      onClick={() => {
                        handleConnectOAuth(activeTmplModal.id, activeTmplModal.url);
                        setActiveTmplModal(null);
                      }}
                      className="h-8 px-5 rounded-full text-xs font-bold bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white cursor-pointer transition-all active:scale-[0.98]"
                    >
                      Connect
                    </Button>
                  </>
                );
              } else {
                return (
                  <Button
                    onClick={() => {
                      handleConnectOAuth(activeTmplModal.id, activeTmplModal.url);
                      setActiveTmplModal(null);
                    }}
                    className="h-8 px-5 rounded-full text-xs font-bold bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white cursor-pointer transition-all active:scale-[0.98]"
                  >
                    Connect
                  </Button>
                );
              }
            })()}
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Custom SSE Setup Modal */}
      <Dialog 
        open={isRegisteringCustom} 
        onOpenChange={(open) => {
          setIsRegisteringCustom(open);
          if (!open) {
            setShowAdvanced(false);
            resetCustomForm();
          }
        }}
      >
        <DialogContent className="w-[92%] max-w-md bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-900 text-foreground font-sans rounded-[20px] p-0 overflow-hidden shadow-2xl text-left [&>button]:hidden focus:outline-none focus-visible:outline-none animate-in fade-in-50 zoom-in-95 duration-200">
          <div className="flex items-center justify-between gap-4 px-6 pt-6 pb-4 w-full text-left">
            <div className="flex flex-col min-w-0 gap-0.5 text-left">
              <DialogTitle className="text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-200 leading-tight">Custom Connector</DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 leading-none">
                Register a custom MCP server
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsRegisteringCustom(false);
                setShowAdvanced(false);
              }}
              className="text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-355 transition-colors p-1.5 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleRegisterCustom} className="space-y-0">
            <div className="px-6 pb-6 space-y-4">
              {/* Connector Name */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="custom-name" className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left">Connector Name</label>
                <Input
                  id="custom-name"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. My Database Search"
                  required
                  className="h-9 px-3 text-xs bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 dark:focus-visible:ring-cyan-500/15"
                />
              </div>

              {/* Server URL */}
              <div className="flex flex-col gap-1.5">
                <label htmlFor="custom-url" className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left">Server Endpoint URL</label>
                <Input
                  id="custom-url"
                  value={customUrl}
                  onChange={(e) => handleUrlInput(e.target.value)}
                  placeholder="https://mcp.example.com/sse"
                  required
                  className="h-9 px-3 text-xs bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 dark:focus-visible:ring-cyan-500/15"
                />

                {detectingAuth && (
                  <div className="flex items-center gap-1.5 mt-2 text-zinc-450 dark:text-zinc-500 text-[11px] select-none text-left">
                    <RefreshCw className="w-3 h-3 animate-spin text-cyan-600 dark:text-cyan-400" />
                    Checking auth type...
                  </div>
                )}

                {!detectingAuth && detectedAuthResult === 'oauth' && (
                  <div className="flex items-center gap-2 mt-2 select-none text-left">
                    <span className="bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-900/40 rounded-full text-[10.5px] font-semibold px-2.5 py-0.5 inline-flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-cyan-650 dark:text-cyan-400" />
                      OAuth (auto-registration)
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(true)}
                      className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 dark:hover:text-zinc-355 underline cursor-pointer select-none"
                    >
                      Change
                    </button>
                  </div>
                )}

                {!detectingAuth && detectedAuthResult === 'apiKey' && (
                  <div className="flex items-center gap-2 mt-2 select-none text-left">
                    <span className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 rounded-full text-[10.5px] font-semibold px-2.5 py-0.5 inline-flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5 text-amber-655 dark:text-amber-400" />
                      Token Required
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(true)}
                      className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 dark:hover:text-zinc-355 underline cursor-pointer select-none"
                    >
                      Change
                    </button>
                  </div>
                )}

                {!detectingAuth && detectedAuthResult === 'none' && (
                  <div className="flex items-center gap-2 mt-2 select-none text-left">
                    <span className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-950/10 rounded-full text-[10.5px] font-semibold px-2.5 py-0.5 inline-flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5 text-emerald-650 dark:text-emerald-400" />
                      No Auth / Public
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(true)}
                      className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 hover:text-zinc-650 dark:hover:text-zinc-355 underline cursor-pointer select-none"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Advanced Settings Accordion */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center justify-between w-full cursor-pointer select-none"
                >
                  <span className="uppercase tracking-wider text-[10px] text-zinc-400 dark:text-zinc-500 font-bold">Advanced Settings</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px]">{showAdvanced ? 'Hide' : 'Show'}</span>
                    <ChevronRight className={cn("w-3.5 h-3.5 transition-transform", showAdvanced && "transform rotate-90")} />
                  </div>
                </button>

                <AnimatePresence initial={false}>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-3 overflow-hidden pt-2"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left">Execution Strategy</label>
                          <Select 
                            value={customMode} 
                            onValueChange={(val: any) => setCustomMode(val)}
                          >
                            <SelectTrigger className="h-8.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-cyan-500 dark:focus:border-cyan-550 focus:outline-none">
                              <SelectValue placeholder="Select strategy" />
                            </SelectTrigger>
                            <SelectContent className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">
                              <SelectItem value="auto" className="text-xs cursor-pointer">Auto Checks</SelectItem>
                              <SelectItem value="direct" className="text-xs cursor-pointer">Direct Browser</SelectItem>
                              <SelectItem value="proxy" className="text-xs cursor-pointer">Server Proxy</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left">Auth Type</label>
                          <Select 
                            value={customAuthType} 
                            onValueChange={(val: any) => setCustomAuthType(val)}
                          >
                            <SelectTrigger className="h-8.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-cyan-500 dark:focus:border-cyan-550 focus:outline-none">
                              <SelectValue placeholder="Select auth type" />
                            </SelectTrigger>
                            <SelectContent className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200">
                              <SelectItem value="none" className="text-xs cursor-pointer">None / Public</SelectItem>
                              <SelectItem value="apiKey" className="text-xs cursor-pointer">Bearer Token</SelectItem>
                              <SelectItem value="oauth" className="text-xs cursor-pointer">OAuth (Consent Flow)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {customAuthType === 'apiKey' && (
                        <div className="flex flex-col gap-1.5 pt-1">
                          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left">Bearer Access Token</label>
                          <Input
                            type="password"
                            value={customAccessToken}
                            onChange={(e) => setCustomAccessToken(e.target.value)}
                            placeholder="Enter authentication token"
                            className="h-9 px-3 rounded-xl text-xs bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500"
                          />
                        </div>
                      )}

                      {customAuthType === 'oauth' && (
                        <div className="flex flex-col gap-1.5 pt-1">
                          <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider text-left font-sans">Scopes (space-separated)</label>
                          <Input
                            value={customScopes}
                            onChange={(e) => setCustomScopes(e.target.value)}
                            placeholder="e.g. data.records:read schema.bases:read"
                            className="h-9 px-3 rounded-xl text-xs bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500"
                          />
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer Action Button Tray */}
            <div className="px-6 py-4 flex justify-end items-center gap-2 bg-zinc-50/50 dark:bg-zinc-900/10 border-t border-zinc-100 dark:border-zinc-900">
              <Button
                variant="outline"
                type="button"
                onClick={() => {
                  setIsRegisteringCustom(false);
                  setShowAdvanced(false);
                }}
                className="h-8 px-4 rounded-full text-xs font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-all active:scale-[0.98]"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={detectingAuth}
                className="h-8 px-4 rounded-full text-xs font-bold bg-cyan-600 hover:bg-cyan-700 dark:bg-cyan-600 dark:hover:bg-cyan-500 text-white cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {detectingAuth ? 'Checking Server...' : 'Add Connector'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Skill Detail Modal Dialog */}
      <Dialog 
        open={!!selectedSkill} 
        onOpenChange={(open) => setSelectedSkill(open ? selectedSkill : null)}
      >
        <DialogContent className="w-[92%] max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-900 text-foreground font-sans rounded-[20px] p-6 [&>button]:hidden focus:outline-none focus-visible:outline-none animate-in fade-in-50 zoom-in-95 duration-200">
          <div className="flex items-center justify-between gap-4 pb-3.5 border-b border-zinc-100 dark:border-zinc-900/60 w-full text-left">
            <div className="flex flex-col min-w-0">
              <DialogTitle className="text-base font-bold text-zinc-800 dark:text-zinc-200 truncate">
                {selectedSkill ? formatToolName(selectedSkill.name) : ''}
              </DialogTitle>
              <DialogDescription className="text-xs font-mono text-zinc-400 dark:text-zinc-550 mt-1.5 truncate">
                {selectedSkill?.name}
              </DialogDescription>
            </div>
            <span className="text-[10px] bg-zinc-50 dark:bg-zinc-900 text-zinc-550 dark:text-zinc-400 px-2.5 py-0.5 rounded-md font-semibold shrink-0 border border-zinc-200/60 dark:border-zinc-800 select-none">
              {selectedSkill?.integrationName}
            </span>
          </div>

          <div className="mt-5 space-y-4 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar text-left">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider block">Description</span>
              <p className="text-xs sm:text-sm text-zinc-650 dark:text-zinc-300 leading-relaxed font-normal">
                {selectedSkill?.description}
              </p>
            </div>

            {selectedSkill?.inputSchema && Object.keys(selectedSkill.inputSchema.properties || {}).length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-450 dark:text-zinc-550 uppercase tracking-wider block">Input Parameters</span>
                <div className="text-[11px] font-mono text-zinc-700 dark:text-zinc-350 bg-zinc-50 dark:bg-zinc-900/50 p-4.5 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/80 overflow-x-auto">
                  <pre className="whitespace-pre-wrap leading-relaxed font-mono">
                    {JSON.stringify(selectedSkill.inputSchema.properties, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button
              variant="outline"
              type="button"
              onClick={() => setSelectedSkill(null)}
              className="h-8 px-4 rounded-full text-xs font-medium border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-all active:scale-[0.98]"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
