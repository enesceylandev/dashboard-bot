import { checkInstagramUser } from "./instagram";

export async function runTool(toolName: string, input: string, ctx: any) {
    console.log(`[ToolRunner] Running ${toolName} with input: "${input}"`);
    if (toolName === "tool-1") {
        const trimmedInput = input.trim();

        // Handle commands
        if (trimmedInput === "/start" || trimmedInput === "/help") {
            return {
                summary: "Instagram Bot'a Hoşgeldiniz! \n\nKullanım:\n- Kullanıcı adını doğrudan yazın (örn: `instagram`)\n- veya `/check kullanıcı_adı` komutunu kullanın.",
                full: {
                    status: "OK",
                    description: "Help message sent",
                    processedAt: new Date().toISOString(),
                }
            };
        }

        let username = trimmedInput;
        if (trimmedInput.startsWith("/check ")) {
            username = trimmedInput.replace("/check ", "").trim();
        }

        if (!username) {
            return {
                summary: "Lütfen bir kullanıcı adı girin.",
                full: { error: "Empty username" }
            };
        }

        const result = await checkInstagramUser(username);

        return {
            summary: `Kontrol Sonucu (${result.username}): ${result.status}\n${result.description}`,
            full: {
                ...result,
                processedAt: new Date().toISOString(),
            },
        };
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
