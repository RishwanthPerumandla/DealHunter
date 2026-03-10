import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    // --- UPDATED: Using the 2.5 Flash model from your list ---
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
  Analyze this image (menu, flyer, or poster). 
  Extract details for ANY promotional offer, discount, happy hour, or special event.
  
  Return ONLY raw JSON:
  {
    "title": "A short, exciting title for the offer (e.g. '50% Off Burgers')",
    "restaurant_name": "The venue name",
    "description": "Details of what is included",
    "start_time": "HH:MM (24hr) or empty",
    "end_time": "HH:MM (24hr) or empty",
    "days_active": [1,2,3...] (Integers 1=Mon...7=Sun)
  }
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: file.type,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    const cleanedText = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleanedText);

    return NextResponse.json(data);

  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to analyze image" 
    }, { status: 500 });
  }
}