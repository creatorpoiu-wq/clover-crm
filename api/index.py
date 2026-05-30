import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
import asyncio

# Setup FastAPI app
app = FastAPI()

# Supabase setup
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "") # Using anon key for simplicity, assuming RLS allows true for now based on our migration.
if not url or not key:
    print("Warning: Supabase credentials not found in environment.")

supabase: Client | None = None
if url and key:
    supabase = create_client(url, key)

class EmailRequest(BaseModel):
    inquiry_id: int
    text: str
    client_name: str

@app.post("/api/process_email")
async def process_email(req: EmailRequest):
    if not supabase:
        raise HTTPException(status_code=500, detail="Database not configured")

    try:
        # 1. Fetch active agents
        res = supabase.table("Agents").select("*").eq("Is_Active", True).execute()
        agents = res.data

        if not agents:
            raise HTTPException(status_code=400, detail="No active agents found")

        # Due to Vercel Serverless environment constraints, we will simulate the Antigravity SDK call
        # in this boilerplate since installing/compiling binary dependencies in Vercel Python 
        # sometimes requires custom build configurations. 
        # In a real environment, you would use:
        # from google.antigravity import Agent, LocalAgentConfig, types
        # ... setup subagents based on `agents` ...
        
        # Determine best agent via simple heuristic or LLM call (simulated here for deployment safety)
        # We assign it to the first agent found for now.
        selected_agent = agents[0]
        
        # Draft a response (Simulated AI response based on Persona)
        subject = f"Re: Your Inquiry - {req.client_name}"
        draft_body = f"Hello {req.client_name},\n\nThank you for reaching out! I am {selected_agent['Name']}, your {selected_agent['Role']}. \n\nI have received your message:\n> {req.text}\n\nI will review this and get back to you shortly.\n\nBest,\n{selected_agent['Name']} | Your Studio"

        # 2. Write Draft to Database
        draft_res = supabase.table("Email_Drafts").insert({
            "Inquiry_ID": req.inquiry_id,
            "Agent_ID": selected_agent["Agent_ID"],
            "Subject": subject,
            "Body": draft_body,
            "Status": "draft"
        }).execute()

        return {"success": True, "draft": draft_res.data[0]}

    except Exception as e:
        print(f"Error processing email: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Antigravity AI Agent Microservice"}
