<p align="center">
  <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/extension_icon%20(4)-6Wye0wySEvOe9CE7mSoAVG5mEWUqc7.png" width="100" height="100" alt="Paradox Logo">
</p>

<div align="center">

# Paradox

A minimalistic AI chat interface that combines the power of Google's Gemini and Perplexity's Sonar APIs to provide intelligent conversations with web search, coding and reasoning capabilities.

[![Deploy your own](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fiamakchavan%2Fparadox)

</div>

## Features

### Multiple AI Models & Voice Integration
- **Gemini Pro** - For general chat and image analysis
- **Perplexity** - For web search and reasoning capabilities
- **Developer Mode** - Specialized coding assistant with enhanced technical capabilities
- **ElevenLabs Voice Agent** - Interactive voice conversations with AI
  - Real-time voice input and response
  - Custom voice selection
  - Smooth animations and visual feedback

### User Interface
- **Modern Design**
  - Clean, minimalist interface with dark/light theme support
  - Responsive layout optimized for desktop and mobile
  - Smooth animations and transitions
  - Visual feedback for AI interactions
  - Customizable theme preferences (Light/Dark/System)

### Core Capabilities
- **Image Support** 
  - Upload and analyze multiple images
  - Inline preview with drag-and-drop support
  - Image analysis with Gemini Pro Vision
  - Support for multiple image formats
  - Real-time image processing
  - Size limit of 20MB per image

- **Document Analysis**
  - PDF document support with 10MB size limit
  - Multiple file upload capability
  - Document preview and management
  - Integrated file handling
  - Inline PDF preview in conversations
  - Seamless PDF context integration with AI models

- **Data Export & Analysis**
  - CSV export for tabular data
  - One-click table downloads
  - Clean data formatting
  - Automatic number alignment
  - Preserves data structure in exports

- **Web Search & Reasoning** 
  - Real-time internet search capabilities
  - Clean presentation of search results
  - Integration with Perplexity API
  - Advanced reasoning mode with DeepSeek R1
  - Step-by-step thinking process visualization

- **Voice Interaction**
  - Real-time voice conversations
  - Custom voice agent support
  - Visual feedback during conversations
  - Smooth transition animations
  - Connection status indicators

- **Developer Mode** 
  - Specialized mode for coding and technical tasks
  - Syntax-highlighted code blocks
  - Best practices and code quality focus
  - Technical documentation integration
  - Enhanced reasoning for coding tasks

- **Performance Monitoring**
  - Integrated Speed Insights
  - Performance metrics tracking
  - Real-time analytics
  - User interaction monitoring

### Advanced Features
- **Streaming Responses** 
  - Real-time response streaming
  - Visible thinking process
  - Smooth animations and transitions
  - Progressive content loading
  - Expandable thinking process view
  - Step-by-step reasoning display

- **Rich Text Support**
  - Beautiful syntax highlighting for code blocks
  - Full markdown support with remark-gfm
  - Custom styling for different content types
  - Responsive typography

- **Accessibility**
  - Keyboard navigation support
  - Screen reader compatibility
  - Responsive design
  - High contrast modes

## Getting Started

### Prerequisites

- Node.js (Latest LTS version recommended)
- API Keys:
  - Google Gemini API key
  - Perplexity Sonar API key
  - ElevenLabs API key (for voice features)

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

3. Create a `.env.local` file with your API keys:
```env
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_PERPLEXITY_API_KEY=your_perplexity_api_key
NEXT_PUBLIC_ELEVENLABS_API_KEY=your_elevenlabs_api_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Configuration

1. Click the settings icon in the top right corner
2. Configure your API keys:
   - Google Gemini API key
   - Perplexity Sonar API key
   - ElevenLabs API key
3. Optional: Set up voice agent:
   - Create a voice on ElevenLabs Voice Lab
   - Add your Voice Agent ID in settings
4. Choose your preferred theme (Light/Dark/System)

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

## Voice Agent Setup

To use the voice agent feature:

1. Create an account on [ElevenLabs](https://elevenlabs.io)
2. Navigate to Voice Lab and create a custom voice
3. Copy your API key and Voice Agent ID
4. Add them in the Paradox settings dialog under the "ElevenLabs" tab
5. Click "Paradox Live" in the top navigation to access the voice interface
6. Use the Start/Stop buttons to control voice conversations
7. Monitor connection status and voice activity through the visual interface

The voice agent features:
- Real-time voice input and response
- Visual feedback for connection status
- Speaking/listening state indicators
- Automatic reconnection handling
- Custom voice settings (stability and similarity boost)
- Error handling and status messages

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
