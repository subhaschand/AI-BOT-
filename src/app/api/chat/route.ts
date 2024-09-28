import { GoogleGenerativeAI } from '@google/generative-ai';
import { google } from 'googleapis';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');
const customSearch = google.customsearch('v1');

const systemInstruction = `You are an AI assistant specialized in providing information about wildlife sanctuaries, national parks, and animals. 
Only answer questions related to these topics. If a question is not about wildlife sanctuaries, national parks, or animals, 
politely inform the user that you can only provide information on these subjects. Try to answer questions in point-wise format with line by line with one line space.`;

const predefinedData = {
  "Yellowstone National Park": {
    "Gray Wolf": 123,
    "Grizzly Bear": 728,
    "Bison": 5450,
  },
  "Serengeti National Park": {
    "Lion": 3000,
    "Elephant": 5000,
    "Wildebeest": 1500000,
  },
};

async function searchGoogle(query: string) {
  try {
    const res = await customSearch.cse.list({
      auth: process.env.GOOGLE_CSE_API_KEY,
      cx: process.env.GOOGLE_CSE_ID,
      q: query,
      num: 5,
    });
    return res.data.items?.map((item) => ({ title: item.title, snippet: item.snippet })) || [];
  } catch (error) {
    console.error('Error searching Google:', error);
    return [];
  }
}


export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const lastMessage = messages[messages.length - 1].content;
    let additionalInfo = '';

    if (lastMessage.toLowerCase().includes('population') && lastMessage.toLowerCase().includes('in')) {
      const match = lastMessage.match(/(\w+)\s+population\s+in\s+(.+)/i);
      if (match) {
        const [, animal, sanctuary] = match;
        const populationInfo = await getAnimalPopulation(sanctuary, animal);
        if (typeof populationInfo === 'number') {
          additionalInfo = `\n\nThe population of ${animal} in ${sanctuary} is approximately ${populationInfo}.`;
        } else if (Array.isArray(populationInfo)) {
          additionalInfo = `\n\nI couldn't find exact population data, but here’s some relevant information:\n`;
          populationInfo.forEach((item) => {
            additionalInfo += `- ${item.title}: ${item.snippet}\n`;
          });
        }
      }
    }

    const prompt = `${systemInstruction}\n\nHuman: ${lastMessage}\nAI: Let me provide you with the information you're looking for.${additionalInfo}\n`;
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    return new Response(JSON.stringify({ result: text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    return new Response(JSON.stringify({ error: 'An error occurred during the chat process' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
