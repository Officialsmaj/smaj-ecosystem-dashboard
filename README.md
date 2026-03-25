
# SMAJ Ecosystem Dashboard

A dynamic, AI-powered worldwide dashboard for the SMAJ Ecosystem. This platform integrates 13 diverse services—including E-commerce, Jobs, Health, and Finance—into a unified, blockchain-ready interface designed for the Pi Network community.

## Key Features

- **13 Integrated Platforms**: Unified access to SMAJ Store, Food, Jobs, Health, Edu, Transport, Agro, Energy, Charity, Housing, Events, Swap, and the native SMAJ Token.
- **AI-Powered KYC**: Advanced identity verification using Google Gemini for liveness checks (blink detection, head movement) and document clarity analysis.
- **SMAJ AI Assistant**: A context-aware chatbot that understands user data, transaction history, and ecosystem philosophy to provide personalized guidance.
- **Financial Intelligence**: Real-time Pi balance tracking with GCV ($314,159) valuation and interactive transaction analytics using Chart.js.
- **Global Ready**: Supports 10+ languages and 50+ fiat currencies with automated localization.
- **Modern UI/UX**: Responsive "White Favor" design philosophy built with Tailwind CSS, featuring dark mode and high-performance animations.

## Tech Stack

- **Frontend**: Vanilla JavaScript, Tailwind CSS, Boxicons.
- **AI/ML**: Google Gemini 1.5 Flash (via Generative AI SDK).
- **Data Visualization**: Chart.js.
- **Image Processing**: Cropper.js.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deployment

1. **Setup File Structure**: Ensure your `deploy.yml` is moved to `.github/workflows/deploy.yml` in your repository.
2. **GitHub Secrets**: Go to your repo **Settings > Secrets and variables > Actions** and add a New Repository Secret:
   - Name: `GEMINI_API_KEY`
   - Value: `YOUR_ACTUAL_GOOGLE_AI_STUDIO_KEY`
3. **Enable Actions**: Go to **Settings > Pages** and set "Source" to **GitHub Actions**.
3. **Push**: Pushing to the `main` branch will now trigger the `deploy.yml` workflow automatically.

**Note:** The app requires Camera access for the AI KYC feature. Ensure you grant permission when prompted by the browser.

## Future Enhancements

- **Live Pi Network Integration**: Implement the Pi SDK to transition from simulated data to real Mainnet transactions and wallet authentication.
- **PWA Support**: Transform the dashboard into a Progressive Web App for offline access and a native mobile experience.
- **Advanced Merchant Tools**: Add a dedicated portal for vendors to manage inventory across SMAJ Store and SMAJ Food.
- **Predictive Analytics**: Use AI to provide users with spending insights and ecosystem growth forecasts.
- **Decentralized Governance**: Integrate voting mechanisms for SMAJ Token holders to influence ecosystem development.
- **Real-time Notifications**: Web-socket based alerts for order updates, job messages, and security events.
