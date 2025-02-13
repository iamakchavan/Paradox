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

### Deploy on Vercel

The easiest way to deploy Paradox is to use the Vercel Platform.

1. Click the "Deploy with Vercel" button above
2. Connect your GitHub account
3. Set up your environment variables:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   NEXT_PUBLIC_PERPLEXITY_API_KEY=your_perplexity_api_key
   ```
4. Deploy!

### Environment Variables

Create a `.env.local` file in the root directory with:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_PERPLEXITY_API_KEY=your_perplexity_api_key
```

For production deployment, add these environment variables in your Vercel project settings.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
