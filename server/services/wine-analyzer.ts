import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Analyzes a wine list using OpenAI API
 * @param wineListText The text content of the wine list
 * @returns An analysis object containing detected wines and insights
 */
export async function analyzeWineList(wineListText: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API key not provided, wine analysis functionality limited");
      return null;
    }

    const prompt = `
You are a professional sommelier with deep expertise in wine. Analyze the following wine list and extract the following information:
1. Each individual wine mentioned
2. For each wine, identify:
   - Full name (including vintage if mentioned)
   - Varietal/type
   - Region/country of origin
   - Price (if mentioned)
3. Provide a brief summary of the overall wine list

Wine List:
${wineListText}

Format your response as a JSON object with the following structure:
{
  "wines": [
    {
      "name": "Name of wine with vintage",
      "varietal": "Type of wine/grape",
      "region": "Region and country",
      "price": "Price with currency symbol"
    },
    ...more wines
  ],
  "summary": "A brief summary of the overall wine selection"
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are a professional sommelier with deep expertise in wine analysis."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("Empty response from OpenAI");
    }

    const parsedResponse = JSON.parse(content);
    
    return {
      success: true,
      totalWines: parsedResponse.wines.length,
      wines: parsedResponse.wines,
      summary: parsedResponse.summary
    };
  } catch (error) {
    console.error("Error analyzing wine list with OpenAI:", error);
    return null;
  }
}