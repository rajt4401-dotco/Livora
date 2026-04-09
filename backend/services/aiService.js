const axios = require('axios');

const AI_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
const TIMEOUT = 5000; // 5 seconds

// ─── Fallback keyword-based classifier ───────────────────────────────────────
const fallbackClassify = (text) => {
  const t = text.toLowerCase();
  
  // 🚨 Emergency Category (Highest Priority)
  if (/(fire|smoke|accident|emergency|medical|ambulance|hospital|injury|bleeding|hurt|unconscious)/.test(t))
    return { category: 'Emergency', priority: 'High', confidence: 0.9, source: 'fallback' };

  if (/(water|pipe|leak|drain|tap|flush)/.test(t))
    return { category: 'Plumbing', priority: 'High', confidence: 0.7, source: 'fallback' };
  if (/(wifi|internet|network|connection|router)/.test(t))
    return { category: 'Network', priority: 'High', confidence: 0.7, source: 'fallback' };
  if (/(light|fan|ac|electric|switch|power|wiring|short|circuit|shock)/.test(t))
    return { category: 'Electrical', priority: 'High', confidence: 0.7, source: 'fallback' };


  if (/(food|mess|meal|canteen|cook|taste)/.test(t))
    return { category: 'Mess', priority: 'Medium', confidence: 0.65, source: 'fallback' };
  if (/(chair|table|bed|cupboard|mirror|furniture|broken)/.test(t))
    return { category: 'Furniture', priority: 'Medium', confidence: 0.65, source: 'fallback' };
  if (/(clean|dirty|sweep|mop|garbage|trash|hygiene)/.test(t))
    return { category: 'Housekeeping', priority: 'Low', confidence: 0.65, source: 'fallback' };
  if (/(noise|loud|sound|disturb|party)/.test(t))
    return { category: 'Noise', priority: 'Medium', confidence: 0.65, source: 'fallback' };
  if (/(security|lock|door|gate|theft|stolen|key)/.test(t))
    return { category: 'Security', priority: 'High', confidence: 0.7, source: 'fallback' };
  return { category: 'General', priority: 'Low', confidence: 0.5, source: 'fallback' };
};

// ─── Fallback sentiment analysis ─────────────────────────────────────────────
const fallbackSentiment = (text) => {
  const t = text.toLowerCase();
  const positiveWords = ['good','great','excellent','improved','happy','satisfied','clean','nice','better','helpful','thank','wonderful','love'];
  const negativeWords = ['bad','broke','broken','dirty','not working','leaking','problem','issue','terrible','worst','disgusting','urgent','failed','doesn\'t work'];
  const pos = positiveWords.filter((w) => t.includes(w)).length;
  const neg = negativeWords.filter((w) => t.includes(w)).length;
  if (pos > neg) return { sentiment: 'positive', score: pos / (pos + neg + 1) };
  if (neg > pos) return { sentiment: 'negative', score: neg / (pos + neg + 1) };
  return { sentiment: 'neutral', score: 0.5 };
};

// ─── AI Service calls (with fallback) ────────────────────────────────────────

/**
 * Analyze complaint text — calls Python AI service, falls back to keyword classifier
 */
const analyzeComplaint = async (text) => {
  try {
    const res = await axios.post(
      `${AI_URL}/analyze`,
      { text },
      { timeout: TIMEOUT }
    );
    return { ...res.data, source: 'ai' };
  } catch {
    console.warn('[AI] Complaint analysis service unavailable — using fallback');
    return fallbackClassify(text);
  }
};

/**
 * Analyze sentiment of text
 */
const analyzeSentiment = async (text) => {
  try {
    const res = await axios.post(
      `${AI_URL}/sentiment`,
      { text },
      { timeout: TIMEOUT }
    );
    return { ...res.data, source: 'ai' };
  } catch {
    console.warn('[AI] Sentiment service unavailable — using fallback');
    return fallbackSentiment(text);
  }
};

/**
 * Predict if a student will default on fees — calls Python ML model
 */
const predictFeeDefault = async (studentData) => {
  try {
    const res = await axios.post(
      `${AI_URL}/predict-fee`,
      studentData,
      { timeout: TIMEOUT }
    );
    return res.data;
  } catch {
    // Fallback heuristic: if student has unpaid fees from last semester
    return {
      riskLevel: studentData.unpaidCount > 1 ? 'High' : 'Low',
      probability: studentData.unpaidCount > 1 ? 0.75 : 0.2,
      source: 'fallback',
    };
  }
};

/**
 * Auto room allocation — calls Python optimizer, falls back to simple assignment
 */
const autoAllocateRooms = async (students, rooms) => {
  try {
    const res = await axios.post(
      `${AI_URL}/room-allocation`,
      { students, rooms },
      { timeout: TIMEOUT }
    );
    return res.data;
  } catch {
    console.warn('[AI] Room allocation service unavailable — using fallback');
    const available = rooms.filter((r) => r.status === 'Available' && r.occupied < r.capacity);
    const unassigned = students.filter((s) => !s.room);
    const assignments = [];
    let ri = 0;
    for (const student of unassigned) {
      if (ri >= available.length) break;
      assignments.push({ studentId: student._id, roomId: available[ri]._id, roomNumber: available[ri].number });
      ri++;
    }
    return { assignments, source: 'fallback' };
  }
};

module.exports = { analyzeComplaint, analyzeSentiment, predictFeeDefault, autoAllocateRooms };
