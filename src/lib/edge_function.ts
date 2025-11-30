// Setup: import needed libraries (Deno syntax)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai";

// Define CORS headers to allow the browser to talk to this function
const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers":
		"authorization, x-client-info, apikey, content-type",
};
serve(async (req) => {
	// 1. Handle CORS Preflight Request
	if (req.method === "OPTIONS") {
		return new Response("ok", {
			headers: corsHeaders,
		});
	}
	try {
		// 2. Get the request body
		// NOW READING: userTimezone and referenceDate
		const { audioUrl, userTimezone, referenceDate } = await req.json();
		if (!audioUrl) {
			throw new Error("Missing audioUrl");
		}
		// 3. Fetch the audio file from Supabase Storage
		const audioResponse = await fetch(audioUrl);
		if (!audioResponse.ok) throw new Error("Failed to fetch audio file");
		const audioArrayBuffer = await audioResponse.arrayBuffer();
		// Convert ArrayBuffer to Base64 for Gemini
		const base64Audio = btoa(
			new Uint8Array(audioArrayBuffer).reduce(
				(data, byte) => data + String.fromCharCode(byte),
				"",
			),
		);
		// 4. Initialize Google Gemini
		const genAI = new GoogleGenerativeAI(Deno.env.get("GEMINI_API_KEY") || "");
		const model = genAI.getGenerativeModel({
			model: "gemini-flash-latest",
		});
		// 5. Generate Content
		const result = await model.generateContent([
			{
				inlineData: {
					mimeType: "audio/webm",
					data: base64Audio,
				},
			},
			{
				text: `
        You are a smart calendar assistant. 
        
        Current Context:
        - Reference Date (Today): ${referenceDate || new Date().toISOString()}
        - User Timezone: ${userTimezone || "UTC"}

        Instructions:
        1. Transcribe this audio exactly as spoken.
        2. Extract the Event Title and Date (ISO format) from the content.
           - INTERPRET terms like "tomorrow", "next Tuesday", or "in 2 days" relative to the Reference Date provided above.
           - Ensure the year is correct based on the Reference Date.
        
        Return ONLY valid JSON with this structure, no markdown formatting: 
        { 
          "transcription": "text...", 
          "data": { 
            "title": "Event Title", 
            "date": "ISO-Date-String" 
          } 
        }
      `,
			},
		]);
		const responseText = result.response.text();
		const cleanedText = responseText.replace(/```json|```/g, "").trim();
		const parsedData = JSON.parse(cleanedText);
		// 6. Return the result (WITH CORS HEADERS)
		return new Response(JSON.stringify(parsedData), {
			headers: {
				...corsHeaders,
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("Error processing audio:", error);
		return new Response(
			JSON.stringify({
				error: error.message,
			}),
			{
				status: 500,
				headers: {
					...corsHeaders,
					"Content-Type": "application/json",
				},
			},
		);
	}
});
