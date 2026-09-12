const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function test() {
  try {
     const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: "The domain is 'adgaurd.mailboy.org'. What is the name of the software or service being hosted? Return ONLY the clean, properly capitalized app name. If you don't know, just format the subdomain cleanly."
     });
     console.log("Gemini says:", response.text);
  } catch (err) {
     console.error(err);
  }
}
test();
