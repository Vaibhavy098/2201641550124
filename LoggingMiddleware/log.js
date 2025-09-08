const VALID_STACKS = ['backend', 'frontend'];
const VALID_LEVELS = ['debug', 'info', 'warn', 'error', 'fatal'];
const VALID_PACKAGES = {
    backend: ['cache', 'controller', 'cron_job', 'db', 'domain', 'handler', 'repository', 'route', 'service', 'auth', 'config', 'middleware', 'utils'],
    frontend: ['api', 'component', 'hook', 'page', 'state', 'style', 'auth', 'config', 'middleware', 'utils']
};

const DEFAULT_TOKEN = 'assessment-token';
function validateLogParams(stack, level, pkg, message) {
    if (!VALID_STACKS.includes(stack.toLowerCase())) {
        return { isValid: false, error: `Invalid stack. Must be one of: ${VALID_STACKS.join(', ')}` };
    }

    if (!VALID_LEVELS.includes(level.toLowerCase())) {
        return { isValid: false, error: `Invalid level. Must be one of: ${VALID_LEVELS.join(', ')}` };
    }

    const stackLower = stack.toLowerCase();
    const validPackagesForStack = VALID_PACKAGES[stackLower] || [];
    if (!validPackagesForStack.includes(pkg.toLowerCase())) {
        return { isValid: false, error: `Invalid package '${pkg}' for stack '${stack}'. Valid packages: ${validPackagesForStack.join(', ')}` };
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return { isValid: false, error: 'Message must be a non-empty string' };
    }

    return { isValid: true };
}

export async function Log(stack, level, pkg, message, token = DEFAULT_TOKEN) {
    const url = "http://20.244.56.144/evaluation-service/logs";
    
    const validation = validateLogParams(stack, level, pkg, message);
    if (!validation.isValid) {
        const errorMsg = `Logging validation failed: ${validation.error}`;
        console.error(errorMsg);
        return { error: errorMsg, success: false };
    }

    const payload = {
        stack: stack.toLowerCase(),
        level: level.toLowerCase(),
        package: pkg.toLowerCase(),
        message: message.trim()
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (process.env.NODE_ENV === 'development') {
            console.log("Log sent successfully:", { 
                logId: data.logId, 
                message: data.message,
                payload: payload 
            });
        }
        
        return { ...data, success: true };

    } catch (error) {
        const errorMsg = `Failed to send log: ${error.message}`;
        console.error(errorMsg, {
            originalPayload: payload,
            error: error.toString()
        });
        
        return { 
            error: errorMsg, 
            success: false, 
            originalPayload: payload 
        };
    }
}

export const Logger = {
    debug: (pkg, message, token) => Log('frontend', 'debug', pkg, message, token),
    info: (pkg, message, token) => Log('frontend', 'info', pkg, message, token),
    warn: (pkg, message, token) => Log('frontend', 'warn', pkg, message, token),
    error: (pkg, message, token) => Log('frontend', 'error', pkg, message, token),
    fatal: (pkg, message, token) => Log('frontend', 'fatal', pkg, message, token)
};

export function getValidPackages() {
    return VALID_PACKAGES.frontend;
}

export default Log;
