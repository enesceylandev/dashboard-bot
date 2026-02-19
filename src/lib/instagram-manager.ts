import { supabase } from "./supabase";
import { checkInstagramUser } from "./instagram";

export class InstagramManager {

    static async handleCommand(input: string): Promise<{ summary: string, full: any }> {
        const trimmedInput = input.trim();
        const command = trimmedInput.split(' ')[0].toLowerCase();
        const arg = trimmedInput.split(' ').slice(1).join(' ');

        if (command === "/start" || command === "/help") {
            return this.getHelpMessage();
        }

        if (command === "/adduser") {
            return this.addUser(arg);
        }

        if (command === "/listusers") {
            return this.listUsers();
        }

        if (command === "/clearusers") {
            return this.clearUsers();
        }

        if (command === "/check") {
            return this.checkUser(arg, true); // commands usually force a fresh check or adhere to cooldowns, but we'll do fresh for now
        }

        // Default: specific username check without /check prefix
        // If input is just a username
        if (!command.startsWith("/")) {
            return this.checkUser(trimmedInput, true);
        }

        return {
            summary: "❌ Bilinmeyen komut. Yardım için /help yazın.",
            full: { error: "Unknown command" }
        };
    }

    private static getHelpMessage() {
        const lines = [
            '╔═══════════════════════╗',
            '║  💖 INSTAGRAM BOT 💖  ║',
            '╚═══════════════════════╝',
            '',
            '✨ Komutlar:',
            '━━━━━━━━━━━━━━━━━━━━━',
            '➕ /adduser kullanici_adi',
            '   → Listeye kullanici ekle',
            '',
            '🔍 /check kullanici_adi',
            '   → Anlik kontrol (5dk cooldown)',
            '',
            '📋 /listusers',
            '   → Tum kullanicilari listele',
            '',
            '🗑️ /clearusers',
            '   → Listeyi temizle',
            '',
            '━━━━━━━━━━━━━━━━━━━━━',
            '⚙️ Arka Plan: Her 2 saatte 1 kullanici',
            '📊 Gunluk Rapor: 21:00',
            '',
            '💡 Ornek Kullanim:',
            '/adduser riseinweb3',
            '/check cristiano',
            '',
            '━━━━━━━━━━━━━━━━━━━━━',
            '💕 Developed by @codedbyelif'
        ];
        return {
            summary: lines.join('\n'),
            full: { type: 'help' }
        };
    }

    private static async addUser(username: string) {
        const cleanUsername = username.trim();
        if (!cleanUsername) {
            return { summary: "❌ Kullanim: /adduser kullanici_adi", full: { error: "Missing username" } };
        }

        // Check if exists
        const { data: existing } = await supabase
            .from('instagram_users')
            .select('username')
            .eq('username', cleanUsername)
            .single();

        if (existing) {
            return { summary: `⚠️ "${cleanUsername}" zaten listede.`, full: { error: "Already exists" } };
        }

        const { error } = await supabase
            .from('instagram_users')
            .insert([{ username: cleanUsername, status: 'pending' }]);

        if (error) {
            return { summary: `❌ Hata oluştu: ${error.message}`, full: { error } };
        }

        // Get count
        const { count } = await supabase.from('instagram_users').select('*', { count: 'exact', head: true });

        return {
            summary: `✅ Eklendi!\n\n👤 Kullanici: ${cleanUsername}\n🔗 Link: https://www.instagram.com/${cleanUsername}/\n📊 Toplam: ${count} kullanici`,
            full: { action: 'added', username: cleanUsername }
        };
    }

    private static async listUsers() {
        const { data: users, error } = await supabase
            .from('instagram_users')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) {
            return { summary: `❌ Liste alınamadı: ${error.message}`, full: { error } };
        }

        if (!users || users.length === 0) {
            return { summary: "📝 Liste bos.", full: { count: 0 } };
        }

        const statusIcon: Record<string, string> = {
            'AKTIF': '✅', 'BANLI': '🚫', 'KISITLI': '⚠️',
            'RATE_LIMIT': '⏸️', 'pending': '⏳', 'HATA': '❌', 'BELIRSIZ': '❔'
        };

        let msg_text = '╔═══════════════════════╗\n';
        msg_text += '║   📋 KULLANICI LISTESI   ║\n';
        msg_text += '╚═══════════════════════╝\n\n';

        users.forEach((u, i) => {
            const icon = statusIcon[u.status] || '❓';
            msg_text += `${i + 1}. ${icon} ${u.username}\n   └─ ${u.status}\n\n`;
        });

        msg_text += `━━━━━━━━━━━━━━━━━━━━━\n📊 Toplam: ${users.length} kullanici`;

        return { summary: msg_text, full: { count: users.length, users } };
    }

    private static async clearUsers() {
        const { error } = await supabase
            .from('instagram_users')
            .delete()
            .neq('id', 0); // Delete all

        if (error) {
            return { summary: `❌ Temizleme hatası: ${error.message}`, full: { error } };
        }

        return { summary: "🗑️ Liste temizlendi.", full: { action: 'cleared' } };
    }

    private static async checkUser(username: string, isCommand = false) {
        const cleanUsername = username.trim();
        if (!cleanUsername) {
            return { summary: "❌ Kullanim: /check kullanici_adi", full: { error: "Missing username" } };
        }

        // Perform check
        const result = await checkInstagramUser(cleanUsername);

        // Update DB if exists in list
        const { data: existing } = await supabase
            .from('instagram_users')
            .select('id')
            .eq('username', cleanUsername)
            .single();

        if (existing) {
            await supabase
                .from('instagram_users')
                .update({
                    status: result.status,
                    last_checked: new Date().toISOString()
                })
                .eq('id', existing.id);
        }

        const statusEmoji: Record<string, string> = {
            'AKTIF': '✅', 'BANLI': '🚫', 'KISITLI': '⚠️',
            'RATE_LIMIT': '⏸️', 'HATA': '❌', 'BELIRSIZ': '❔'
        };
        const emoji = statusEmoji[result.status] || '❓';
        const timeStr = new Date().toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' });

        let resultMsg = '╔═══════════════════════╗\n';
        resultMsg += '║     📊 KONTROL SONUCU     ║\n';
        resultMsg += '╚═══════════════════════╝\n\n';
        resultMsg += `👤 Kullanici: ${result.username}\n`;
        resultMsg += `🔗 Link: https://www.instagram.com/${result.username}/\n`;
        resultMsg += `${emoji} Durum: ${result.status}\n\n`;
        resultMsg += `📝 Aciklama:\n${result.description}\n\n`;
        resultMsg += '━━━━━━━━━━━━━━━━━━━━━\n';
        resultMsg += `🕒 ${timeStr}`;

        return {
            summary: resultMsg,
            full: { ...result, processedAt: new Date().toISOString() }
        };
    }
}
