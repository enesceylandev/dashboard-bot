import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"

export default async function ChatPage({
    params,
}: {
    params: Promise<{ toolId: string }>
}) {
    const { toolId } = await params

    return (
        <div className="flex h-full flex-col space-y-4">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight capitalize">
                    {toolId.replace("-", " ")} Chat
                </h2>
            </div>
            <Card className="flex flex-1 flex-col overflow-hidden">
                <CardHeader className="border-b px-6 py-4">
                    <CardTitle>Chat Session</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-0">
                    <ScrollArea className="h-full p-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-muted">
                                Welcome to {toolId.replace("-", " ")}! How can I assist you today?
                            </div>
                            <div className="ml-auto flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm bg-primary text-primary-foreground">
                                I need help with...
                            </div>
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="border-t p-4">
                    <form className="flex w-full items-center gap-2">
                        <Input placeholder="Type your message..." className="flex-1" />
                        <Button type="submit" size="icon">
                            <Send className="h-4 w-4" />
                            <span className="sr-only">Send</span>
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
    )
}
