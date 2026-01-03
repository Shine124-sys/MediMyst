import { NextResponse } from "next/server";
export async function POST(req:Request) {
  try {
    const body = await req.json();
    const response = await fetch("/api/ai", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt })
});

const data = await response.json();
    return NextResponse.json({ result: data });
  } 
  catch (error) {
    return NextResponse.json(
      { error: "AI API failed" },
      { status: 500 }
    );
  }
}
