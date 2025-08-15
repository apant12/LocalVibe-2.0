# LocalVibe Setup Instructions

## 🚀 Getting Started

### 1. Ticketmaster API Setup (Required for Map Events)
1. Go to [Ticketmaster Developer Portal](https://developer-acct.ticketmaster.com/user/login)
2. Sign up for a free account
3. Create a new application
4. Copy your API key
5. Create a `.env` file in the `client` folder with:
   ```
   VITE_TICKETMASTER_API_KEY=your_api_key_here
   ```

### 2. Start the Application
```bash
# Terminal 1: Start the backend server
npm start

# Terminal 2: Start the frontend (in client folder)
cd client
npm run dev
```

## 🗺️ Map Features

### Interactive Event Map
- **Real-time events** from Ticketmaster API
- **City-based filtering** - events load based on your current city
- **Interactive markers** - click to see event details
- **Smart positioning** - events are placed on a grid map
- **Event details** - see pricing, ratings, and descriptions

### Event Information
- **Event titles** and descriptions
- **Location data** with venue information
- **Pricing** (free vs paid events)
- **Ratings** and popularity metrics
- **Tags** for easy categorization

## 🧠 AI Picks Feature

### Smart Recommendations
- **Personalized suggestions** based on your preferences
- **Category matching** using event tags
- **Price range filtering** for budget-conscious users
- **Rating-based scoring** for quality assurance
- **Location relevance** for city-specific events
- **Trending detection** for popular experiences

### How It Works
1. **User Preferences**: Tracks your interests and preferences
2. **Event Analysis**: Analyzes all available events
3. **Scoring Algorithm**: Uses multiple factors to rank events
4. **Personalization**: Adapts to your behavior over time
5. **Confidence Scoring**: Shows how well each recommendation matches

## 🎯 Key Features Fixed

✅ **Map Viewing**: Interactive map with Ticketmaster events
✅ **AI Picks**: Smart recommendation engine
✅ **Event Loading**: Real-time event data from API
✅ **City Filtering**: Events load based on current city
✅ **Interactive Markers**: Click to see event details
✅ **Responsive Design**: Works on all devices
✅ **Error Handling**: Graceful fallbacks when API is unavailable

## 🔧 Troubleshooting

### If events don't load:
1. Check your Ticketmaster API key in `.env`
2. Ensure the server is running (`npm start`)
3. Check browser console for errors
4. Verify your city is set in the location context

### If map doesn't show:
1. Refresh the page
2. Check if you have location permissions
3. Ensure the EventsMap component is rendering

## 🌟 Demo Mode

If you don't have a Ticketmaster API key, the app will show demo events with:
- Sample music festivals
- Food & wine expos
- Realistic pricing and locations
- Interactive map functionality

## 🎉 Ready to Use!

Your LocalVibe app now has:
- **Beautiful interactive map** with real events
- **Smart AI recommendations** for personalized experiences
- **Real-time event data** from Ticketmaster
- **Responsive design** that works everywhere
- **Professional UI** with smooth animations

Enjoy exploring local events with LocalVibe! 🎊
