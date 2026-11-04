import { mkdir, writeFile, readdir, lstat, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { CUSTOM_CAPABILITIES, CUSTOM_RUNTIME_VERSION } from './contracts.js';
import { encode, sha256 } from './identity.js';
import { decodeCustom, validateCustomPointer } from './validate.js';
export function compileManifest(registry, config, revision, minimum = CUSTOM_RUNTIME_VERSION) {
    if (!/^[a-f0-9]{40}$/.test(revision))
        throw Error('Publication requires an explicit full source commit');
    const manifest = { kind: 'custom-registry', manifest_version: { major: 1, minor: 0 }, registry_id: registry.registry_id,
        source: { repository: config.repository ?? config.registry_id, revision }, minimum_nosey_version: minimum,
        required_capabilities: [...CUSTOM_CAPABILITIES], registry };
    const bytes = Buffer.from(encode(manifest)), digest = sha256(bytes);
    const pointer = { kind: 'custom-registry', pointer_version: 1, manifest_version: manifest.manifest_version,
        registry_id: registry.registry_id, source_revision: revision, artifact: { path: 'manifests/sha256-' + digest + '.json', sha256: digest, size_bytes: bytes.length } };
    return { manifest, bytes, digest, pointer };
}
export async function verifyDistribution(path, inventory, version = CUSTOM_RUNTIME_VERSION) {
    const read = async (file) => {
        const target = join(path, file), parts = file.split('/');
        let cursor = path;
        if ((await lstat(path)).isSymbolicLink())
            throw Error('Symlinked distribution');
        for (const part of parts) {
            cursor = join(cursor, part);
            if ((await lstat(cursor)).isSymbolicLink())
                throw Error('Symlinked distribution file');
        }
        const info = await lstat(target);
        if (!info.isFile() || info.size > 10 * 1024 * 1024)
            throw Error('Invalid distribution artifact');
        return readFile(target);
    };
    const pointer = await validateCustomPointer(JSON.parse((await read('latest.json')).toString('utf8')));
    const manifest = await read(pointer.artifact.path);
    if (manifest.length !== pointer.artifact.size_bytes)
        throw Error('Distribution byte count mismatch');
    const decoded = await decodeCustom(manifest, inventory, version, { registryId: pointer.registry_id, revision: pointer.source_revision, digest: pointer.artifact.sha256 });
    if (decoded.manifest_version.minor !== pointer.manifest_version.minor)
        throw Error('Distribution pointer/envelope version mismatch');
    for (const name of await readdir(join(path, 'manifests'))) {
        if (!/^sha256-[a-f0-9]{64}\.json$/.test(name))
            throw Error('Unexpected immutable artifact ' + name);
        const bytes = await read('manifests/' + name);
        if (sha256(bytes) !== name.slice(7, -5))
            throw Error('Historical artifact digest mismatch');
        await decodeCustom(bytes, inventory, version, { registryId: pointer.registry_id });
    }
    return pointer;
}
export async function stagePublication(path, manifest, inventory, options) {
    for (const directory of [path, join(path, 'manifests')])
        try {
            const info = await lstat(directory);
            if (info.isSymbolicLink() || !info.isDirectory())
                throw Error('Unsafe publication directory');
        }
        catch (error) {
            if (error.code !== 'ENOENT')
                throw error;
        }
    const decoded = await decodeCustom(manifest, inventory, CUSTOM_RUNTIME_VERSION);
    if (decoded.source.revision !== options.revision || decoded.source.repository !== options.repository)
        throw Error('Publication source identity mismatch');
    let previous;
    try {
        previous = await verifyDistribution(path, inventory);
    }
    catch (error) {
        if (error.code !== 'ENOENT')
            throw error;
    }
    if (previous && previous.registry_id !== decoded.registry_id)
        throw Error('Publication registry identity changed');
    if (previous && previous.source_revision === options.revision && previous.artifact.sha256 !== sha256(manifest))
        throw Error('Same revision cannot publish different content');
    if (previous && previous.source_revision !== options.revision && (!options.isAncestor || !await options.isAncestor(previous.source_revision, options.revision)))
        throw Error('Stale or unrelated publication revision rejected');
    const digest = sha256(manifest), pointer = { kind: 'custom-registry', pointer_version: 1, manifest_version: decoded.manifest_version,
        registry_id: decoded.registry_id, source_revision: decoded.source.revision, artifact: { path: 'manifests/sha256-' + digest + '.json', sha256: digest, size_bytes: manifest.length } };
    await mkdir(join(path, 'manifests'), { recursive: true });
    const artifact = join(path, pointer.artifact.path);
    try {
        await writeFile(artifact, manifest, { flag: 'wx' });
    }
    catch (error) {
        if (error.code !== 'EEXIST' || !manifest.equals(await readFile(artifact)))
            throw error;
    }
    // Validate candidate with a temporary pointer before promoting latest atomically.
    const { rename } = await import('node:fs/promises');
    const temp = join(path, '.latest.' + randomUUID() + '.tmp');
    await writeFile(temp, encode(pointer), { flag: 'wx' });
    await rename(temp, join(path, 'latest.json'));
    await verifyDistribution(path, inventory);
    return pointer;
}
