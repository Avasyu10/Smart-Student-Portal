import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { studentId, feedbackText } = await req.json();

    if (!studentId || !feedbackText) {
      throw new Error('Missing studentId or feedbackText');
    }

    console.log('Analyzing feedback sentiment for student:', studentId);

    // Use Gemini to analyze teacher feedback sentiment
    const sentimentResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a feedback sentiment analyzer for educational purposes. Analyze the following teacher feedback and provide insights for the student.

Teacher Feedback: "${feedbackText}"

Provide ONLY a JSON response with the following structure:
{
  "sentiment": "positive" | "neutral" | "negative",
  "confidenceScore": number (0-100),
  "keyThemes": ["theme1", "theme2", "theme3"],
  "focusAreas": ["specific area to improve", "another area"],
  "encouragements": ["positive point 1", "positive point 2"],
  "personalizedMessage": "A direct, encouraging message to the student with specific actionable advice like 'focus more on logic next time' or 'work on your argument structure'",
  "emotionalTone": "constructive" | "critical" | "supportive" | "neutral",
  "improvementPriority": "high" | "medium" | "low"
}

Be specific and actionable in your analysis. Focus on what the student can do better next time.`
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      }),
    });

    if (!sentimentResponse.ok) {
      throw new Error(`Gemini API error: ${sentimentResponse.status} - ${await sentimentResponse.text()}`);
    }

    const geminiData = await sentimentResponse.json();
    console.log('Gemini sentiment analysis response received');

    const aiResponse = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    // Parse AI response to extract structured data
    let sentimentAnalysis;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        sentimentAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback analysis
      sentimentAnalysis = createFallbackAnalysis(feedbackText);
    }

    // Store the sentiment analysis in the database
    const { data: analysisRecord, error: insertError } = await supabase
      .from('student_feedback_analysis')
      .upsert({
        student_id: studentId,
        sentiment_analysis: sentimentAnalysis,
        feedback_count: 1,
        analyzed_at: new Date().toISOString()
      }, {
        onConflict: 'student_id'
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing sentiment analysis:', insertError);
    }

    console.log('Sentiment analysis completed and stored');

    return new Response(
      JSON.stringify({
        success: true,
        sentimentAnalysis,
        analysisId: analysisRecord?.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('Error in sentiment analysis:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function createFallbackAnalysis(feedbackText: string) {
  const text = feedbackText.toLowerCase();
  
  // Simple keyword-based sentiment analysis
  const positiveWords = ['good', 'excellent', 'great', 'well done', 'impressive', 'clear', 'strong'];
  const negativeWords = ['poor', 'weak', 'unclear', 'needs improvement', 'lacking', 'insufficient'];
  const improvementWords = ['improve', 'focus', 'work on', 'develop', 'strengthen', 'enhance'];
  
  const posCount = positiveWords.filter(word => text.includes(word)).length;
  const negCount = negativeWords.filter(word => text.includes(word)).length;
  const impCount = improvementWords.filter(word => text.includes(word)).length;
  
  const sentiment = posCount > negCount ? 'positive' : negCount > posCount ? 'negative' : 'neutral';
  const confidenceScore = Math.min(Math.max((posCount + negCount) * 20, 30), 85);
  
  return {
    sentiment,
    confidenceScore,
    keyThemes: ['Academic Writing', 'Content Quality', 'Structure'],
    focusAreas: impCount > 0 ? ['Focus on areas mentioned for improvement'] : ['Continue current approach'],
    encouragements: posCount > 0 ? ['Teacher noted positive aspects'] : ['Room for growth identified'],
    personalizedMessage: sentiment === 'positive' 
      ? "Your teacher provided positive feedback! Keep up the good work and focus on maintaining this quality."
      : sentiment === 'negative'
      ? "Your teacher identified areas for improvement. Focus more on the specific points mentioned to enhance your work."
      : "Your teacher provided balanced feedback. Focus on strengthening the areas mentioned while maintaining your current approach.",
    emotionalTone: posCount > negCount ? 'supportive' : impCount > 0 ? 'constructive' : 'neutral',
    improvementPriority: negCount > 1 ? 'high' : impCount > 0 ? 'medium' : 'low'
  };
}
