import { constants } from 'node:fs';
import { open, lstat, readdir, realpath } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { parseDocument } from 'yaml';
import { REGISTRY_LIMITS } from './contracts.js';
import { safePath, compare, sha256, identity } from './identity.js';
/** No partial walk: every asset is a bounded regular file. No file extension filters. */
export async function readRegistryFile(root, path, limit = REGISTRY_LIMITS.file) {
    if (!safePath(path))
        throw Error(path + ': unsafe path');
    let cursor = root;
    for (const part of path.split('/')) {
        cursor = resolve(cursor, part);
        if ((await lstat(cursor)).isSymbolicLink())
            throw Error(path + ': symlink refused');
    }
    const file = await open(cursor, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK);
    try {
        const info = await file.stat(), current = await lstat(cursor);
        const actual = await realpath(process.platform === 'linux' ? '/proc/self/fd/' + file.fd : cursor), rel = relative(root, actual);
        if (!info.isFile() || info.size > limit || current.isSymbolicLink() || info.ino !== current.ino || info.dev !== current.dev || rel === '..' || rel.startsWith('..' + sep))
            throw Error(path + ': unsafe file or file byte limit');
        const bytes = Buffer.alloc(info.size + 1);
        let offset = 0;
        while (offset < bytes.length) {
            const n = await file.read(bytes, offset, bytes.length - offset, offset);
            if (!n.bytesRead)
                break;
            offset += n.bytesRead;
        }
        if (offset !== info.size)
            throw Error(path + ': file changed during read');
        return bytes.subarray(0, offset);
    }
    finally {
        await file.close();
    }
}
export function skillMetadata(bytes, path) {
    let text;
    try {
        text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    }
    catch {
        throw Error(path + ': invalid UTF-8');
    }
    const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)([\s\S]*)$/.exec(text);
    if (!match)
        throw Error(path + ': required YAML frontmatter is missing');
    const doc = parseDocument(match[1], { uniqueKeys: true, schema: 'core', resolveKnownTags: false });
    if (doc.errors.length || doc.warnings.length)
        throw Error(path + ': invalid YAML: ' + (doc.errors[0] ?? doc.warnings[0]).message);
    const data = doc.toJS({ maxAliasCount: 0 });
    if (!data || typeof data.name !== 'string' || data.name.length > 64 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.name))
        throw Error(path + ': name must be 1–64 lowercase letters, digits, and single hyphens');
    if (typeof data.description !== 'string' || !data.description.trim() || data.description.length > 1024)
        throw Error(path + ': description must be a nonempty string of at most 1024 characters');
    if (!match[2].trim())
        throw Error(path + ': skill Markdown body is empty');
    return { name: data.name, description: data.description };
}
async function entries(root, path) {
    if (!safePath(path))
        throw Error(path + ': unsafe directory');
    let cursor = root;
    for (const part of path.split('/')) {
        cursor = resolve(cursor, part);
        if ((await lstat(cursor)).isSymbolicLink())
            throw Error(path + ': symlink refused');
    }
    const file = await open(cursor, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
    try {
        const actual = await realpath(process.platform === 'linux' ? '/proc/self/fd/' + file.fd : cursor), rel = relative(root, actual);
        const current = await lstat(cursor), info = await file.stat();
        if (rel === '..' || rel.startsWith('..' + sep) || current.isSymbolicLink() || info.ino !== current.ino || info.dev !== current.dev)
            throw Error(path + ': changed directory');
        return (await readdir(process.platform === 'linux' ? '/proc/self/fd/' + file.fd : cursor, { withFileTypes: true })).sort((a, b) => compare(a.name, b.name));
    }
    finally {
        await file.close();
    }
}
export function subtreeHash(files) {
    return identity([...files].sort((a, b) => compare(a.path, b.path)).map(f => [f.path, f.bytes.length, sha256(f.bytes)]));
}
export async function readSubtree(root, path) {
    const result = [];
    let total = 0;
    async function walk(dir, depth) {
        if (depth > REGISTRY_LIMITS.depth)
            throw Error(dir + ': directory depth limit');
        for (const entry of await entries(root, dir)) {
            const full = dir + '/' + entry.name;
            if (['metadata.json', '.git', '__pycache__', '__pypackages__'].includes(entry.name))
                throw Error(full + ': unsupported reserved installer asset');
            if (entry.isSymbolicLink())
                throw Error(full + ': symlink refused');
            if (entry.isDirectory())
                await walk(full, depth + 1);
            else if (entry.isFile()) {
                if (result.length >= REGISTRY_LIMITS.files)
                    throw Error(path + ': file count limit');
                const bytes = await readRegistryFile(root, full);
                total += bytes.length;
                if (total > REGISTRY_LIMITS.snapshot)
                    throw Error(path + ': snapshot byte limit');
                result.push({ path: full.slice(path.length + 1), bytes });
            }
            else
                throw Error(full + ': unsupported file type');
        }
    }
    await walk(path, 0);
    return result;
}
export async function discoverSkills(root, registryId) {
    const result = [];
    const assets = new Map();
    let total = 0, visited = 0, fileCount = 0;
    async function walk(dir, depth) {
        if (depth > REGISTRY_LIMITS.depth || ++visited > REGISTRY_LIMITS.files)
            throw Error(dir + ': discovery limit');
        const list = await entries(root, dir);
        if (list.some(e => e.name === 'SKILL.md')) {
            const files = await readSubtree(root, dir), metadata = skillMetadata(files.find(f => f.path === 'SKILL.md').bytes, dir + '/SKILL.md');
            total += files.reduce((n, f) => n + f.bytes.length, 0);
            fileCount += files.length;
            if (fileCount > REGISTRY_LIMITS.files || total > REGISTRY_LIMITS.snapshot)
                throw Error('Registry snapshot byte limit');
            const id = registryId + '/skills/' + dir.slice(7);
            result.push({ id, ...metadata, path: dir, content_sha256: subtreeHash(files) });
            assets.set(id, files);
            return;
        }
        for (const entry of list) {
            if (entry.isSymbolicLink())
                throw Error(dir + '/' + entry.name + ': symlink refused');
            if (entry.isDirectory())
                await walk(dir + '/' + entry.name, depth + 1);
            else if (!entry.isFile())
                throw Error(dir + '/' + entry.name + ': unsupported file type');
        }
    }
    try {
        await lstat(resolve(root, 'skills'));
    }
    catch (error) {
        if (error.code === 'ENOENT')
            return { skills: result, assets };
        throw error;
    }
    await walk('skills', 0);
    return { skills: result, assets };
}
