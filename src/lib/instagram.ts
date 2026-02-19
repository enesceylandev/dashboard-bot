import axios from 'axios';
import * as cheerio from 'cheerio';

// Extended User-Agent rotation for stealth
const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    'Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:121.0) Gecko/20100101 Firefox/121.0'
];

// Accept-Language rotation
const ACCEPT_LANGUAGES = [
    'en-US,en;q=0.9',
    'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
    'en-GB,en;q=0.9,en-US;q=0.8',
    'de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7',
    'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7'
];

// Types
export interface CheckResult {
    username: string;
    status: 'AKTIF' | 'BANLI' | 'KISITLI' | 'RATE_LIMIT' | 'HATA' | 'BELIRSIZ';
    description: string;
    retryCount: number;
}

// Proxy configuration from environment
function getProxyConfig() {
    const host = process.env.PROXY_HOST;
    const port = process.env.PROXY_PORT;

    if (!host || !port) return null;

    const config: any = {
        host: host,
        port: parseInt(port)
    };

    const user = process.env.PROXY_USER;
    const pass = process.env.PROXY_PASS;

    if (user && pass) {
        config.auth = { username: user, password: pass };
    }

    return config;
}

const proxyConfig = getProxyConfig();

/**
 * Random delay to avoid detection patterns
 * @param {number} minSec - Minimum seconds
 * @param {number} maxSec - Maximum seconds
 */
function randomDelay(minSec = 2, maxSec = 8) {
    const delay = (Math.random() * (maxSec - minSec) + minSec) * 1000;
    return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Checks Instagram user profile with smart retry on rate limits
 */
export async function checkInstagramUser(username: string, retryCount = 0, enableRetry = true): Promise<CheckResult> {
    const userAgent = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    const acceptLang = ACCEPT_LANGUAGES[Math.floor(Math.random() * ACCEPT_LANGUAGES.length)];
    const profileUrl = `https://www.instagram.com/${username}/`;

    // Random delay before each request to look human
    // Reduced for dashboard responsiveness, but still needed for stealth
    await randomDelay(1, 4);

    try {
        const axiosConfig: any = {
            headers: {
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': acceptLang,
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
                'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
                'Sec-Ch-Ua-Mobile': '?0',
                'Sec-Ch-Ua-Platform': '"Windows"',
                'Cache-Control': 'max-age=0',
                'Referer': 'https://www.google.com/',
                'Cookie': 'ig_did=; ig_nrcb=1; csrftoken=missing;'
            },
            timeout: 20000,
            maxRedirects: 5,
            validateStatus: (status: number) => status >= 200 && status < 500
        };

        // Add proxy if configured
        if (proxyConfig) {
            axiosConfig.proxy = proxyConfig;
        }

        const response = await axios.get(profileUrl, axiosConfig);

        // Check HTTP status
        if (response.status === 404) {
            return {
                username,
                status: 'BANLI',
                description: 'Hesap bulunamadı (404)',
                retryCount
            };
        }

        if (response.status === 403 || response.status === 429) {
            // Rate limit detected - retry with exponential backoff (only if enabled)
            if (enableRetry && retryCount < 3) {
                const waitTime = Math.pow(2, retryCount) * 60 * 1000; // 1min, 2min, 4min
                console.log(`[RETRY] ${username} - Rate limit, waiting ${waitTime / 1000 / 60} minutes...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return checkInstagramUser(username, retryCount + 1, enableRetry);
            }

            return {
                username,
                status: 'RATE_LIMIT',
                description: enableRetry ? `Rate limit - ${retryCount} deneme sonrası başarısız` : 'Rate limit algılandı',
                retryCount
            };
        }

        if (response.status !== 200) {
            return {
                username,
                status: 'HATA',
                description: `HTTP ${response.status}`,
                retryCount
            };
        }

        // Parse HTML
        const html = response.data as string;
        const $ = cheerio.load(html);

        const title = $('title').text();
        const ogTitle = $('meta[property="og:title"]').attr('content');
        const ogDescription = $('meta[property="og:description"]').attr('content');
        const metaDescription = $('meta[name="description"]').attr('content') || '';
        const hasUsernameInJSON = html.includes(`"username":"${username}"`);
        const hasOGData = !!(ogTitle && ogDescription);
        const hasFollowText = html.includes('"Follow"') || html.includes('"Takip Et"');
        const hasPostData = html.includes('edge_owner_to_timeline_media') || html.includes('followed_by');

        // Log title for debugging
        console.log(`[CHECK] ${username} | Status: ${response.status} | Title: "${title.trim().substring(0, 50)}"`);

        // POSITIVE INDICATORS: Active account
        if (hasOGData || hasUsernameInJSON || hasPostData || hasFollowText ||
            (metaDescription && (metaDescription.includes('Followers') || metaDescription.includes('Takipçi')))) {
            return {
                username,
                status: 'AKTIF',
                description: 'Hesap aktif',
                retryCount
            };
        }

        // NEGATIVE INDICATORS: Explicit not-found messages
        if (html.includes("Sorry, this page isn't available") ||
            html.includes("Sayfa Bulunamadı") ||
            html.includes("Page Not Found") ||
            html.includes("broken link") ||
            html.includes("Go back to Instagram") ||
            title.includes("Page Not Found") ||
            title.includes("Sayfa Bulunamadı")) {
            return {
                username,
                status: 'BANLI',
                description: 'Hesap bulunamadı',
                retryCount
            };
        }

        if (html.includes("Restricted profile") ||
            html.includes("Kısıtlanmış profil")) {
            return {
                username,
                status: 'KISITLI',
                description: 'Profil kısıtlanmış',
                retryCount
            };
        }

        // SOFT 404 / LOGIN WALL CHECK
        // If title is generic and no positive data found -> Instagram blocked the request OR account doesn't exist
        const isGenericTitle = title.trim() === 'Instagram' || title.trim() === '' || title.includes('Login');
        if (isGenericTitle && !hasOGData && !hasUsernameInJSON && !hasFollowText) {
            const finalUrl = (response.request as any)?.res?.responseUrl || '';
            const isLoginRedirect = finalUrl.includes('/accounts/login/');

            if (isLoginRedirect || isGenericTitle) {
                // Generic page = Instagram blocked our request (rate limit / bot detection)
                // We cannot confirm if account exists or not
                if (enableRetry && retryCount < 2) {
                    const waitTime = Math.pow(2, retryCount) * 30 * 1000; // 30s, 60s
                    console.log(`[RETRY] ${username} - Blocked request, retrying in ${waitTime / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    return checkInstagramUser(username, retryCount + 1, enableRetry);
                }
                return {
                    username,
                    status: 'RATE_LIMIT',
                    description: 'Instagram isteği engelledi - Tekrar deneyin',
                    retryCount
                };
            }
        }

        // Final fallback
        console.log(`[FALLBACK] ${username} - Title: "${title.trim()}" | hasOGData: ${hasOGData} | hasUsernameInJSON: ${hasUsernameInJSON}`);
        return {
            username,
            status: 'RATE_LIMIT',
            description: 'Durum belirlenemedi - Instagram isteği kısıtlıyor olabilir',
            retryCount
        };

    } catch (error: any) {
        if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
            if (enableRetry && retryCount < 3) {
                const waitTime = Math.pow(2, retryCount) * 60 * 1000;
                console.log(`[RETRY] ${username} - Timeout, waiting ${waitTime / 1000 / 60} minutes...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return checkInstagramUser(username, retryCount + 1, enableRetry);
            }

            return {
                username,
                status: 'HATA',
                description: 'Zaman aşımı',
                retryCount
            };
        }

        return {
            username,
            status: 'HATA',
            description: `Hata: ${error.message}`,
            retryCount
        };
    }
}
