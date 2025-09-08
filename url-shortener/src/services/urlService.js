import { Logger } from './logger.js';

class URLService {
    constructor() {
        this.urls = this.loadFromStorage();
        this.baseUrl = 'http://localhost:3000';
        Logger.info('service', 'URLService initialized with stored URLs', 'assessment-token');
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('shortenedUrls');
            const urls = stored ? JSON.parse(stored) : {};
            Logger.debug('service', `Loaded ${Object.keys(urls).length} URLs from storage`, 'assessment-token');
            return urls;
        } catch (error) {
            Logger.error('service', `Failed to load URLs from storage: ${error.message}`, 'assessment-token');
            return {};
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem('shortenedUrls', JSON.stringify(this.urls));
            Logger.debug('service', `Saved ${Object.keys(this.urls).length} URLs to storage`, 'assessment-token');
        } catch (error) {
            Logger.error('service', `Failed to save URLs to storage: ${error.message}`, 'assessment-token');
        }
    }

    generateShortcode(length = 6) {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    isValidUrl(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    isValidShortcode(shortcode) {
        return /^[a-zA-Z0-9]{1,10}$/.test(shortcode);
    }

    isShortcodeAvailable(shortcode) {
        return !this.urls.hasOwnProperty(shortcode);
    }

    createShortUrl(originalUrl, customShortcode = null, validityMinutes = 30) {
        Logger.info('service', `Creating short URL for: ${originalUrl}`, 'assessment-token');
        
        if (!this.isValidUrl(originalUrl)) {
            const error = 'Invalid URL format provided';
            Logger.warn('service', error, 'assessment-token');
            throw new Error(error);
        }

        let shortcode = customShortcode;
        if (customShortcode) {
            if (!this.isValidShortcode(customShortcode)) {
                const error = `Invalid shortcode format: ${customShortcode}`;
                Logger.warn('service', error, 'assessment-token');
                throw new Error(error);
            }
            if (!this.isShortcodeAvailable(customShortcode)) {
                const error = `Shortcode already in use: ${customShortcode}`;
                Logger.warn('service', error, 'assessment-token');
                throw new Error(error);
            }
        } else {
            do {
                shortcode = this.generateShortcode();
            } while (!this.isShortcodeAvailable(shortcode));
        }

        const createdAt = new Date();
        const expiresAt = new Date(createdAt.getTime() + validityMinutes * 60000);

        const urlData = {
            id: Date.now().toString(),
            originalUrl,
            shortcode,
            shortUrl: `${this.baseUrl}/${shortcode}`,
            createdAt: createdAt.toISOString(),
            expiresAt: expiresAt.toISOString(),
            validityMinutes,
            clicks: [],
            totalClicks: 0
        };

        this.urls[shortcode] = urlData;
        this.saveToStorage();

        Logger.info('service', `Short URL created successfully: ${shortcode}`, 'assessment-token');
        return urlData;
    }

    getUrlByShortcode(shortcode) {
        const urlData = this.urls[shortcode];
        if (!urlData) {
            Logger.warn('service', `Shortcode not found: ${shortcode}`, 'assessment-token');
            return null;
        }

        if (new Date() > new Date(urlData.expiresAt)) {
            Logger.warn('service', `Shortcode expired: ${shortcode}`, 'assessment-token');
            return null;
        }

        return urlData;
    }

    recordClick(shortcode, source = 'direct', location = 'Unknown') {
        const urlData = this.urls[shortcode];
        if (!urlData) {
            Logger.error('service', `Attempted to record click for non-existent shortcode: ${shortcode}`, 'assessment-token');
            return false;
        }

        const clickData = {
            timestamp: new Date().toISOString(),
            source,
            location
        };

        urlData.clicks.push(clickData);
        urlData.totalClicks++;
        
        this.saveToStorage();
        
        Logger.info('service', `Click recorded for ${shortcode} from ${source}`, 'assessment-token');
        return true;
    }

    getAllUrls() {
        const urls = Object.values(this.urls);
        Logger.debug('service', `Retrieved ${urls.length} total URLs`, 'assessment-token');
        return urls;
    }

    getActiveUrls() {
        const now = new Date();
        const activeUrls = Object.values(this.urls).filter(url => 
            new Date(url.expiresAt) > now
        );
        Logger.debug('service', `Retrieved ${activeUrls.length} active URLs`, 'assessment-token');
        return activeUrls;
    }

    cleanupExpiredUrls() {
        const now = new Date();
        const beforeCount = Object.keys(this.urls).length;
        
        Object.keys(this.urls).forEach(shortcode => {
            if (new Date(this.urls[shortcode].expiresAt) <= now) {
                delete this.urls[shortcode];
            }
        });

        const afterCount = Object.keys(this.urls).length;
        const deletedCount = beforeCount - afterCount;
        
        if (deletedCount > 0) {
            this.saveToStorage();
            Logger.info('service', `Cleaned up ${deletedCount} expired URLs`, 'assessment-token');
        }
        
        return deletedCount;
    }

    getStatistics() {
        const urls = this.getAllUrls();
        const activeUrls = this.getActiveUrls();
        const totalClicks = urls.reduce((sum, url) => sum + url.totalClicks, 0);
        
        const stats = {
            totalUrls: urls.length,
            activeUrls: activeUrls.length,
            expiredUrls: urls.length - activeUrls.length,
            totalClicks
        };
        
        Logger.debug('service', `Generated statistics: ${JSON.stringify(stats)}`, 'assessment-token');
        return stats;
    }
}

const urlService = new URLService();
export default urlService;
