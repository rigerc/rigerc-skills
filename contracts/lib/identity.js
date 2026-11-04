import { createHash } from 'node:crypto';
export const sha256 = (value) => createHash('sha256').update(value).digest('hex');
export const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
export const encode = (value) => JSON.stringify(value, null, 2) + '\n';
/** Locale-independent key ordering; arrays retain semantic order. */
export function canonical(value) {
    if (Array.isArray(value))
        return '[' + value.map(canonical).join(',') + ']';
    if (value && typeof value === 'object')
        return '{' + Object.keys(value).sort(compare)
            .map(key => JSON.stringify(key) + ':' + canonical(value[key])).join(',') + '}';
    return JSON.stringify(value);
}
export const identity = (value) => sha256(canonical(value));
export function snapshotIdentity(sources, settings = {}) {
    return identity({ sources: [...sources].sort((a, b) => b.priority - a.priority || compare(a.id, b.id)), settings });
}
export function safePath(path) {
    return path.length > 0 && path.length <= 512 && !path.startsWith('/') && !path.includes('\\') &&
        path.split('/').every(p => p !== '' && p !== '.' && p !== '..' && /^[A-Za-z0-9_.@-]+$/.test(p));
}
