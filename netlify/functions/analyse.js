// Netlify Function: proxies image to Mistral Pixtral API for font identification + pair suggestions
// Requires environment variable MISTRAL_API_KEY (get free key at https://console.mistral.ai)

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'MISTRAL_API_KEY is not set in Netlify environment variables.' })
    };
  }

  try {
    const { image, mimeType } = JSON.parse(event.body);

    if (!image) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'No image provided.' })
      };
    }

    const prompt = `You are a professional type director with deep knowledge of typography.

Analyse the typeface visible in the image and identify it.

Respond ONLY with a valid JSON object in this exact shape (no extra text, no markdown):

{
  "identified": {
    "name": "Name of the typeface (use the Google Fonts equivalent name if one exists; otherwise the closest commercial name)",
    "description": "One short sentence in English about the character of this typeface"
  },
  "pairs": [
    {
      "heading_font": "Exact Google Fonts family name",
      "heading_weight": "400",
      "body_font": "Exact Google Fonts family name",
      "body_weight": "300",
      "rationale": "One short sentence in English explaining why this pair works"
    }
  ]
}

Rules:
- Provide EXACTLY 6 pairs in the "pairs" array
- IMPORTANT: Order pairs from MOST SUITABLE (best match for the identified typeface) to alternative options. The first pair should be the strongest, most harmonious match.
- ALL fonts must be FREE Google Fonts (https://fonts.google.com)
- Weights must be strings, valid for the chosen Google Fonts family (e.g. "300", "400", "500", "700")
- Suggest professional, diverse pairings: mix serif and sans-serif, vary weights and styles
- Rationales should be specific (mention contrast, mood, era, structural compatibility — not generic praise)
- If no clear typeface is visible, infer from any text-like shapes; still return 6 well-composed Google Fonts pairs
- Return ONLY the JSON object, no markdown fences, no explanation`;

    const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        model: 'pixtral-12b-2409',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: `data:${mimeType || 'image/jpeg'};base64,${image}` }
          ]
        }],
        response_format: { type: 'json_object' },
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!mistralResponse.ok) {
      const errText = await mistralResponse.text();
      console.error('Mistral error:', mistralResponse.status, errText);
      let userMessage = 'AI is temporarily unavailable. Try again in a minute.';
      if (mistralResponse.status === 429) {
        userMessage = 'Rate limit hit (free tier: 2 req/min). Wait ~30 seconds.';
      } else if (mistralResponse.status === 400) {
        userMessage = 'Could not process this image. Try another one.';
      } else if (mistralResponse.status === 401) {
        userMessage = 'Invalid API key. Check MISTRAL_API_KEY in Netlify settings.';
      }
      return {
        statusCode: mistralResponse.status,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: userMessage })
      };
    }

    const data = await mistralResponse.json();
    const rawText = data?.choices?.[0]?.message?.content || '{}';

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch (e) {
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('AI returned an invalid response.');
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(parsed)
    };
  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal error.' })
    };
  }
};
