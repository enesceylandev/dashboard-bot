import { InstagramManager } from "./instagram-manager";

export async function runTool(toolName: string, input: string, ctx: any) {
    console.log(`[ToolRunner] Running ${toolName} with input: "${input}"`);

    if (toolName === "tool-1") {
        try {
            const result = await InstagramManager.handleCommand(input);
            if (!result) return { summary: "", full: { ignored: true } };
            return result;
        } catch (error: any) {
            console.error("InstagramManager Error:", error);
            return {
                summary: `❌ Bir hata oluştu: ${error.message || error}`,
                full: { error: String(error) }
            };
        }
    }

    // Simulate processing time
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
        summary: `Processed by ${toolName || 'default'}: ${input.slice(0, 200)}`,
        full: {
            input,
            toolName,
            ctx,
            processedAt: new Date().toISOString()
        }
    };
}
