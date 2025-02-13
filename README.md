<p align="center">
  <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/extension_icon%20(4)-6Wye0wySEvOe9CE7mSoAVG5mEWUqc7.png" width="100" height="100" alt="Paradox Logo">
</p>

<div align="center">

# Paradox

A minimalistic AI chat interface that combines the power of Google's Gemini and Perplexity's Sonar APIs to provide intelligent conversations with web search, coding and reasoning capabilities.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fiamakchavan%2Fparadox)

</div>

## Features

### Multiple AI Models
- **Gemini Pro** - For general chat and image analysis
- **Perplexity** - For web search and reasoning capabilities
- **Developer Mode** - Specialized coding assistant with enhanced technical capabilities

### User Interface
- **Modern Design** - Clean, minimalist interface with dark/light theme support
- **Responsive Layout** - Optimized for both desktop and mobile devices

### Core Capabilities
- **Image Support** 
  - Upload and analyze multiple images
  - Inline preview with drag-and-drop support
  - Image analysis with Gemini Pro Vision
- **Web Search** 
  - Real-time internet search capabilities
  - Clean presentation of search results
  - Integration with Perplexity API
- **Advanced Reasoning** 
  - Enhanced reasoning mode using DeepSeek R1
  - Step-by-step thinking process visualization
  - Detailed explanation of reasoning steps
- **Developer Mode** 
  - Specialized mode for coding and technical tasks
  - Syntax-highlighted code blocks
  - Best practices and code quality focus
  - Technical documentation integration
- **Streaming Responses** 
  - Real-time response streaming
  - Visible thinking process
  - Smooth animations and transitions
- **Rich Text Support**
  - Beautiful syntax highlighting for code blocks
  - Full markdown support with remark-gfm
  - Custom styling for different content types

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- API Keys:
  - Google Gemini API key
  - Perplexity Sonar API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/iamakchavan/paradox.git
cd paradox
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Configuration

1. Click the settings icon in the top right corner
2. Enter your API keys:
   - Google Gemini API key
   - Perplexity Sonar API key
3. Save settings to start using the chat interface


## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linting
npm run lint
```

## Deployment

### Deploy on Vercel (Recommended)

The easiest way to deploy Paradox is to use the Vercel Platform from the creators of Next.js.

#### Option 1: One-Click Deploy
1. Click the "Deploy with Vercel" button above
2. Connect your GitHub account
3. Configure your project settings:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: `next build`
   - Output Directory: .next
4. Add the following Environment Variables in the Vercel project settings:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_PERPLEXITY_API_KEY=your_perplexity_api_key
   ```
5. Deploy and visit your new site!

#### Option 2: Deploy with Vercel CLI
1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy the project:
   ```bash
   vercel
   ```

4. Add environment variables:
   ```bash
   vercel env add NEXT_PUBLIC_GEMINI_API_KEY
   vercel env add NEXT_PUBLIC_PERPLEXITY_API_KEY
   ```

### Environment Variables

For local development, create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_PERPLEXITY_API_KEY=your_perplexity_api_key
```

For production deployment:
1. Go to your Vercel project dashboard
2. Navigate to Settings > Environment Variables
3. Add both required environment variables
4. Redeploy your application for the changes to take effect

### Post-Deployment Steps
1. Visit your deployed site (yourapp.vercel.app)
2. Open the settings panel
3. Verify your API keys are working
4. Test the core functionalities:
   - Basic chat
   - Image upload
   - Web search
   - Developer mode

### Troubleshooting Deployment
- If the build fails, check the build logs in Vercel dashboard
- Ensure all environment variables are properly set
- Verify your API keys are valid
- Check if all dependencies are properly installed
- Make sure you're using Node.js 18.x or later

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
