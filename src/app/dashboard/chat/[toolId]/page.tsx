"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { Send } from "lucide-react"
import { useEffect, useState, useRef } from "react"

interface Message {
    id?: number;
    content: string;
    email: string;
    tool_name?: string;
    type: string;
    created_at?: string;
}

export default function ChatPage({
    params,
}: {
    params: Promise<{ toolId: string }>;
}) {
    const [toolId, setToolId] = useState<string>("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        params.then((p) => {
            setToolId(p.toolId);
            fetchMessages(p.toolId);
        });
    }, [params]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchMessages = async (tid: string) => {
        try {
            const res = await fetch(`/api/chat/${tid}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        const newMessage: Message = {
            content: input,
            email: "me", // Optimistic update
            type: "tool_request",
            tool_name: toolId,
        };

        setMessages((prev) => [...prev, newMessage]);
        setInput("");
        setLoading(true);

        try {
            const res = await fetch(`/api/chat/${toolId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    content: newMessage.content,
                    tool_name: toolId,
                    type: "tool_request",
                }),
            });

            if (res.ok) {
                // Poll for response - fetch multiple times to catch slow tool results
                setTimeout(() => fetchMessages(toolId), 2000);
                setTimeout(() => fetchMessages(toolId), 5000);
                setTimeout(() => fetchMessages(toolId), 10000);
            }
        } catch (error) {
            console.error("Failed to send message", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center justify-between space-y-2 p-6 pb-4">
                <h2 className="text-3xl font-bold tracking-tight capitalize">
                    {toolId.replace("-", " ")} Chat
                </h2>
            </div>
            <div className="flex-1 px-6 pb-6 overflow-hidden flex flex-col">
                <Card className="flex flex-1 flex-col overflow-hidden">
                    <CardHeader className="border-b px-6 py-4">
                        <CardTitle>Chat Session</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                        <div className="flex-1 overflow-y-auto p-6 space-y-4" ref={scrollRef}>
                            {messages.length === 0 && (
                                <div className="flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-muted">
                                    Welcome to {toolId.replace("-", " ")}! <br />
                                    Developed by @codedbyelif
                                </div>
                            )}
                            {messages.map((msg, i) => (
                                <div
                                    key={i}
                                    className={`flex w-fit max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${msg.type === "tool_result" || msg.email === "system"
                                        ? "bg-muted self-start font-mono"
                                        : "bg-primary text-primary-foreground self-end ml-auto"
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="border-t p-4">
                        <form onSubmit={sendMessage} className="flex w-full items-center gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1"
                                disabled={loading}
                            />
                            <Button type="submit" size="icon" disabled={loading}>
                                <Send className="h-4 w-4" />
                                <span className="sr-only">Send</span>
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
