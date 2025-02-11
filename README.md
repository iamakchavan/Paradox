<p align="center">
  <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/extension_icon%20(4)-6Wye0wySEvOe9CE7mSoAVG5mEWUqc7.png" width="100" height="100" alt="Paradox Logo">
</p>

<div align="center">

# Paradox

A minimalistic AI chat interface that combines the power of Google's Gemini and Perplexity's Sonar APIs to provide intelligent conversations with web search and reasoning capabilities.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fiamakchavan%2Fparadox)

</div>

## Features

- 🤖 Dual AI Model Support
  - Google Gemini API integration for advanced conversations
  - Perplexity Sonar API for real-time web search capabilities
  - DeepSeek R1 (US Hosted) reasoning mode for step-by-step analysis
  
- 🎨 Modern User Interface
  - Clean and intuitive chat interface
  - Dark/Light theme support
  - Responsive design for all devices
  - Beautiful animations and transitions
  
- 📱 Advanced Chat Features
  - Image upload and processing
  - Real-time streaming responses
  - Markdown support with code highlighting
  - Conversation history management
  
- ⚡ Technical Features
  - Built with Next.js 13.5
  - TypeScript for type safety
  - Tailwind CSS for styling
  - Radix UI components for accessibility
  - Local storage for API key management

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

## Technology Stack

- **Framework**: Next.js 13.5
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: 
  - Radix UI
  - shadcn/ui
- **Font**: Geist Sans
- **APIs**:
  - Google Generative AI (Gemini)
  - Perplexity Sonar
  
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

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

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

Your application will be built and deployed to a `.vercel.app` domain.

### Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_PERPLEXITY_API_KEY=your_perplexity_api_key
```

For production deployment, add these environment variables in your Vercel project settings.
