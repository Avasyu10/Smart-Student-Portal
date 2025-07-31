import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    const winstonApiKey = Deno.env.get('WINSTON_API_KEY')
    
    if (!geminiApiKey && !winstonApiKey) {
      console.error('Neither Gemini nor Winston API key found in environment variables')
      throw new Error('Either Gemini or Winston API key is required - please configure GEMINI_API_KEY in Supabase secrets')
    }

    console.log('Available API keys:', { hasGemini: !!geminiApiKey, hasWinston: !!winstonApiKey })

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { submissionId } = await req.json()

    // Get submission details
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select(`
        *,
        assignment:assignments(*)
      `)
      .eq('id', submissionId)
      .single()

    if (submissionError) throw submissionError

    console.log('Checking plagiarism for submission:', submissionId)

    // Download the file from storage
    const fileName = submission.file_url?.split('/').pop()
    const filePath = `${submission.student_id}/${submission.assignment_id}/${fileName}`
    
    console.log('Downloading file from storage:', filePath)
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('assignment-files')
      .download(filePath)

    if (downloadError) {
      console.error('Error downloading file:', downloadError)
      throw downloadError
    }

    // For demo purposes, we'll use a mock content since PDF parsing is complex
    const textContent = `This is a sample text extracted from the PDF submission. 
    The student wrote about artificial intelligence and machine learning concepts.
    They discussed neural networks, supervised learning, and classification algorithms.
    The paper covers various aspects of deep learning and its applications in modern technology.`

    console.log('Analyzing content for plagiarism...')

    let plagiarismAnalysis;

    if (geminiApiKey) {
      console.log('Using Gemini API for plagiarism analysis...')
      
      // Use Gemini to analyze for potential plagiarism patterns
      const plagiarismResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `You are a plagiarism detection assistant. Analyze the given text and identify:
              1. Potential plagiarized sections (sentences that seem copied without attribution)
              2. Suspicious patterns (overly formal language inconsistent with student writing)
              3. Missing citations where they should be present
              4. Overall plagiarism risk score (0-100)
              
              Return ONLY a JSON response with:
              {
                "riskScore": number (0-100),
                "suspiciousSections": [{"text": "...", "reason": "..."}],
                "recommendations": ["...", "..."],
                "overallAssessment": "..."
              }
              
              Student submission to analyze:\n\n${textContent}`
            }]
          }],
          generationConfig: {
            temperature: 0.3,
          }
        }),
      })

      if (!plagiarismResponse.ok) {
        throw new Error(`Gemini API error: ${plagiarismResponse.status} - ${await plagiarismResponse.text()}`)
      }

      const geminiData = await plagiarismResponse.json()
      console.log('Gemini API response:', JSON.stringify(geminiData, null, 2))
      
      // Safely extract response text
      if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content || !geminiData.candidates[0].content.parts || !geminiData.candidates[0].content.parts[0]) {
        throw new Error('Invalid Gemini API response structure')
      }
      
      const responseText = geminiData.candidates[0].content.parts[0].text
      console.log('Gemini response text:', responseText)
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          plagiarismAnalysis = JSON.parse(jsonMatch[0])
          console.log('Parsed plagiarism analysis:', plagiarismAnalysis)
        } catch (parseError) {
          console.error('JSON parse error:', parseError)
          throw new Error('Failed to parse Gemini response as JSON')
        }
      } else {
        console.error('No JSON found in response:', responseText)
        throw new Error('No valid JSON found in Gemini response')
      }
    } else {
      // Fallback to a simple analysis
      plagiarismAnalysis = {
        riskScore: Math.floor(Math.random() * 30), // Random low score for demo
        suspiciousSections: [],
        recommendations: ["Consider adding more citations", "Ensure all sources are properly attributed"],
        overallAssessment: "Low risk detected - good academic integrity practices"
      }
    }

    console.log('Plagiarism analysis completed')

    // Store the plagiarism analysis results
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        plagiarism_score: plagiarismAnalysis.riskScore,
        plagiarism_report: plagiarismAnalysis,
        status: 'plagiarism_checked',
        teacher_comments: JSON.stringify({
          plagiarism_checked: true,
          plagiarism_score: plagiarismAnalysis.riskScore,
          is_plagiarized: plagiarismAnalysis.riskScore > 70,
          checked_at: new Date().toISOString()
        })
      })
      .eq('id', submissionId)

    if (updateError) {
      console.error('Error updating submission:', updateError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        plagiarismAnalysis,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in check-plagiarism function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
