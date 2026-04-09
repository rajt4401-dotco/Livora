import api from './api';

// Complaint Analysis (Category + Priority + Sentiment)
export const analyzeComplaint = async (text) => {
  try {
    const res = await api.post('/ai/analyze-complaint', { text });
    const { result } = res.data;
    // Map categories to emojis for UI
    const emojiMap = {
      'Plumbing': '🔧',
      'Network': '📡',
      'Electrical': '⚡',
      'Mess': '🍽️',
      'Furniture': '🪑',
      'Housekeeping': '🧹',
      'Noise': '🔊',
      'Security': '🔒',
      'General': '📝',
      'Emergency': '🚨'
    };
    return { ...result, emoji: emojiMap[result.category] || '📝' };
  } catch (error) {
    console.error('AI Analysis failed:', error);
    return { category: 'General', priority: 'Low', emoji: '📝', source: 'error' };
  }
};

// Sentiment Analysis only
export const analyzeSentiment = async (text) => {
  try {
    const res = await api.post('/ai/sentiment', { text });
    return res.data.result.sentiment;
  } catch (error) {
    console.error('Sentiment Analysis failed:', error);
    return 'neutral';
  }
};

// Auto Room Allocation
export const autoAssignRoom = async (students, rooms) => {
  try {
    const res = await api.post('/ai/room-allocation', { students, rooms });
    return res.data.result.assignments;
  } catch (error) {
    console.error('Room Allocation failed:', error);
    return [];
  }
};

// Predict Fee Delinquency
export const predictFeeDelinquency = async (studentData) => {
  try {
    const res = await api.post('/ai/predict-fee', studentData);
    return res.data.result;
  } catch (error) {
    console.error('Fee Prediction failed:', error);
    return { riskLevel: 'Low', probability: 0, source: 'error' };
  }
};

/**
 * Chatbot Responses 🤖
 * These are simple responses for common hostel queries.
 * In a real-world scenario, this could be connected to an AI model.
 */
export const BOT_REPLIES = {
  'mess timing': '🍽️ Mess is open: Breakfast 7–9 AM, Lunch 12–2 PM, Dinner 7–9 PM.',
  'mess timings': '🍽️ Mess is open: Breakfast 7–9 AM, Lunch 12–2 PM, Dinner 7–9 PM.',
  'fee': '💰 Hostel fees are due on the 1st of every semester. You can view your status in the Fees section.',
  'fees': '💰 Hostel fees are due on the 1st of every semester. You can view your status in the Fees section.',
  'complaint': '📝 You can submit a complaint from the Complaints page. Our team typically responds within 48 hours.',
  'leave': '🏖️ Apply for leave from the Leave page. Approval is granted by the warden within 24 hours.',
  'wifi': '📡 For WiFi issues, please raise a complaint. Credentials: SSID: HostelNet, Password: hostel@2024.',
  'password': '🔑 Default WiFi password is hostel@2024. Contact admin to reset your account password.',
  'laundry': '👕 Laundry service is available Mon, Wed, Fri. Drop clothes at the ground floor counter by 9 AM.',
  'gym': '💪 The gym is open 6–8 AM and 5–8 PM on all days except Sunday.',
  'library': '📚 Library timings: 9 AM – 10 PM (Mon–Sat), 10 AM – 6 PM (Sunday)',
  'warden': '👨‍💼 Warden office hours: 10 AM – 5 PM (Mon–Sat). Room No: Admin Block, Ground Floor.',
  'hello': '👋 Hello! I\'m LivoraBot 🤖. Ask me about mess timings, fees, complaints, leave, wifi, or anything hostel-related!',
  'hi': '👋 Hi there! How can I help you today?',
  'help': '🆘 I can help with: mess timings, fee info, complaints, leave rules, wifi, laundry, gym, library, and more!',
};

export const getBotReply = (input) => {
  const t = input.toLowerCase().trim();
  for (const key of Object.keys(BOT_REPLIES)) {
    if (t.includes(key)) return BOT_REPLIES[key];
  }
  return "🤔 I'm not sure about that. Try asking about: mess timings, fees, complaints, leave, or wifi.";
};
