const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: "dummy", httpOptions: { baseUrl: "http://127.0.0.1:8080/_api/gemini" } });
console.log(ai.options);
