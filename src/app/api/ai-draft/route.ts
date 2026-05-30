import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Agent selector — picks the right agent based on inquiry context
function selectAgent(agents: any[], inquiryType: string, pipelineStage: string): any {
  const type = (inquiryType || '').toLowerCase();
  const stage = (pipelineStage || '').toLowerCase();

  // Kasey handles new leads and form submissions
  if (stage.includes('new') || type.includes('form') || type.includes('inquiry')) {
    const kasey = agents.find(a => a.Name?.toLowerCase() === 'kasey');
    if (kasey) return kasey;
  }

  // Kaison handles active/booked projects
  if (stage.includes('booked') || stage.includes('signed') || stage.includes('active') || stage.includes('contract')) {
    const kaison = agents.find(a => a.Name?.toLowerCase() === 'kaison');
    if (kaison) return kaison;
  }

  // Chris handles everything else (admin / general)
  const chris = agents.find(a => a.Name?.toLowerCase() === 'chris');
  if (chris) return chris;

  // Fall back to the first active agent
  return agents[0];
}

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'GEMINI_API_KEY is not configured. Add it to your environment variables.' }, { status: 500 });
    }

    const { inquiryId } = await req.json();
    if (!inquiryId) {
      return NextResponse.json({ success: false, error: 'inquiryId is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Fetch the inquiry with contact info and pipeline stage
    const { data: inquiry, error: inqError } = await supabase
      .from('Inquiries')
      .select(`
        Inquiry_ID,
        Service_Type,
        Pipeline_Stage,
        Event_Date,
        Contacts!inner ( Name, Email )
      `)
      .eq('Inquiry_ID', inquiryId)
      .single();

    if (inqError || !inquiry) {
      return NextResponse.json({ success: false, error: 'Inquiry not found' }, { status: 404 });
    }

    const contact = (inquiry as any).Contacts;

    // 2. Fetch last 10 messages in the thread for context
    const { data: thread } = await supabase
      .from('Communications')
      .select('Last_Contact_By, Last_Contact_Date, Message')
      .eq('Inquiry_ID', inquiryId)
      .order('Last_Contact_Date', { ascending: false })
      .limit(10);

    const threadContext = (thread || [])
      .reverse()
      .map(m => `[${m.Last_Contact_By} — ${new Date(m.Last_Contact_Date).toLocaleDateString()}]:\n${m.Message}`)
      .join('\n\n---\n\n');

    // 3. Fetch active agents
    const { data: agents, error: agentsError } = await supabase
      .from('Agents')
      .select('*')
      .eq('Is_Active', true);

    if (agentsError || !agents || agents.length === 0) {
      return NextResponse.json({ success: false, error: 'No active agents found. Please configure your team in the Team page.' }, { status: 400 });
    }

    // 4. Select best agent for this inquiry
    const agent = selectAgent(agents, (inquiry as any).Service_Type, (inquiry as any).Pipeline_Stage);

    // 5. Build Gemini prompt
    const systemPrompt = agent.System_Instructions;

    const userPrompt = `You are responding to a client email on behalf of your studio.

CLIENT INFO:
- Name: ${contact.Name}
- Email: ${contact.Email}
- Service: ${(inquiry as any).Service_Type || 'Photography'}
- Pipeline Stage: ${(inquiry as any).Pipeline_Stage || 'New Inquiry'}
${(inquiry as any).Event_Date ? `- Event Date: ${new Date((inquiry as any).Event_Date).toLocaleDateString()}` : ''}

CONVERSATION THREAD (most recent at the bottom):
${threadContext || 'No previous messages — this is a new inquiry or first contact.'}

TASK:
Write a professional, warm email reply to the most recent client message. 
- Match the persona and tone from your instructions above
- Keep it concise (2-4 short paragraphs max)
- Use the client's first name
- Do NOT include a subject line in the body
- End with your name and role as the sign-off

Reply only with the email body — no subject line, no extra commentary.`;

    // 6. Call Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(userPrompt);
    const draftBody = result.response.text();

    const clientFirstName = contact.Name?.split(' ')[0] || contact.Name;
    const subject = `Re: ${(inquiry as any).Service_Type || 'Your Inquiry'} — ${clientFirstName}`;

    // 7. Save draft to database
    const { data: draft, error: draftError } = await supabase
      .from('Email_Drafts')
      .insert({
        Inquiry_ID: inquiryId,
        Agent_ID: agent.Agent_ID,
        Subject: subject,
        Body: draftBody,
        Status: 'draft',
      })
      .select()
      .single();

    if (draftError) throw draftError;

    return NextResponse.json({ success: true, draft });
  } catch (error: any) {
    console.error('AI Draft Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
