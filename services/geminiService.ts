
import { GoogleGenAI, Type } from "@google/genai";
import type { Level } from "../types";

export const generateLevel = async (prompt: string): Promise<Partial<Level>> => {
  // Initialize the Gemini client
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemInstruction = `
    You are a creative level designer for a 2D platformer game called "Jungle Gem".
    
    **Coordinate System:**
    - Top-left is (0,0).
    - +Y is down.
    - Ground level is typically around y=1000.
    - Player jumps ~250px high and ~300px far.
    - **CRITICAL**: All solid platforms MUST have a minimum height (h) of 40. Never generate platforms with h < 40 or the renderer will glitch (invisible entity bug).
    - Do not overlap platforms significantly.
    
    **Assets:**
    - Platform Styles: 'jungle_floor', 'ancient_stone', 'treetop_branch', 'brick', 'girder'.
    - Enemy Types: 'patrol' (ground walker), 'flyer' (flying bee), 'klaptrap' (ground chomper).
    - Collectibles: 'coin'.
    
    **Objective:**
    - Create a level layout based on the user's prompt.
    - Ensure the player (starts at x=100, y=800) can reach the finish zone (usually x > 3000).
    - Add platforms to traverse gaps or climb heights.
    - Place enemies and coins to make it fun.
    
    **Response:**
    - Return strictly valid JSON matching the schema.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "A creative title for the level" },
          subtitle: { type: Type.STRING, description: "A short flavor text" },
          background: { type: Type.STRING, enum: ['JUNGLE_BEACH', 'JUNGLE_CANOPY', 'JUNGLE_TEMPLE', 'JUNGLE_NIGHT', 'W2_OVERWORLD', 'W2_UNDERGROUND'] },
          bounds: {
             type: Type.OBJECT,
             properties: {
                 right: { type: Type.NUMBER, description: "Level width, e.g. 4000" },
                 bottom: { type: Type.NUMBER, description: "Level height, e.g. 2000" }
             }
          },
          platforms: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
                w: { type: Type.NUMBER },
                h: { type: Type.NUMBER, description: "Height must be >= 40" },
                style: { type: Type.STRING },
                type: { type: Type.STRING, enum: ['solid', 'oneway'] },
              }
            }
          },
          enemies: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['patrol', 'flyer', 'klaptrap'] },
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
                variant: { type: Type.STRING, enum: ['green', 'red', 'blue', 'yellow', 'purple'], nullable: true },
              }
            }
          },
          collectibles: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['coin'] },
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
              }
            }
          },
          finishZone: {
              type: Type.OBJECT,
              properties: {
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  w: { type: Type.NUMBER },
                  h: { type: Type.NUMBER },
              }
          }
        },
        required: ["name", "platforms", "finishZone", "bounds"]
      },
    },
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  return JSON.parse(text) as Partial<Level>;
};
