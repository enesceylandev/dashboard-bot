import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import jwt from "jsonwebtoken";
import { runTool } from "@/lib/tool-runner";

const JWT_SECRET = process.env.JWT_SECRET;
const COOKIE_NAME = process.env.COOKIE_NAME || "app_token";

async function verifyAuth(req: NextRequest) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token || !JWT_SECRET) return null;

    try {
        const payload = jwt.verify(token, JWT_SECRET) as { email: string };
        return payload;
    } catch (error) {
        return null;
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ toolId: string }> }
) {
    const user = await verifyAuth(req);
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { toolId } = await params;

    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", toolId)
        .order("created_at", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ toolId: string }> }
) {
    try {
        const user = await verifyAuth(req);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { toolId } = await params;
        let body;
        try {
            body = await req.json();
        } catch (e) {
            return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
        }

        const { content, tool_name, type } = body;

        // Content validation
        if (!content && !tool_name) {
            return NextResponse.json({ error: "Missing 'content' or 'tool_name' in request body" }, { status: 400 });
        }

        const email = user.email;

        // Insert user message
        const { data: inserted, error: insertErr } = await supabase
            .from("messages")
            .insert([
                {
                    room_id: toolId,
                    tool_name: tool_name || null,
                    email,
                    content,
                    type: type || "text",
                },
            ])
            .select()
            .single();

        if (insertErr) {
            return NextResponse.json({ error: insertErr.message }, { status: 500 });
        }

        // If it's a tool request, process in background (or await if simple)
        if ((type && type === "tool_request") || tool_name) {
            // In a real Serverless environment, use `waitUntil` or a queue.
            // Here we await it to ensure it runs, or we can fire and forget but risk termination.
            // For simplicity and reliability in this demo, we await.
            try {
                const result = await runTool(tool_name, content, { email, roomId: toolId });

                await supabase.from("messages").insert([
                    {
                        room_id: toolId,
                        tool_name,
                        email: "system",
                        content: result.summary || null,
                        type: "tool_result",
                        metadata: result,
                    },
                ]);
            } catch (e: any) {
                console.error("Tool execution error DETAILED:", e);
                console.error("Stack:", e.stack);

                await supabase.from("messages").insert([
                    {
                        room_id: toolId,
                        tool_name,
                        email: "system",
                        content: `System Error: ${String(e.message || e)}`,
                        type: "tool_result",
                        metadata: { error: String(e.message || e) },
                    },
                ]);
            }
        }

        return NextResponse.json({ message: inserted });

    } catch (globalError: any) {
        console.error("Critical API Error:", globalError);
        console.error("Stack:", globalError.stack);
        return NextResponse.json(
            { error: "Internal Server Error", message: globalError.message },
            { status: 500 }
        );
    }
}
