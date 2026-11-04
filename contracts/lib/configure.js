import { readRegistryFile } from './skills.js';
import { writeFile, rename, unlink, open } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { validateSchema } from './validate.js';
import { compileRegistry } from './compiler.js';
import { encode } from './identity.js';
/** Validate the whole candidate before any replacement, roll back failures. */
export async function configureRegistry(root, registryId, inventory) {
    root = resolve(root);
    const old = await validateSchema('registry-config', JSON.parse((await readRegistryFile(root, 'registry.config.json')).toString('utf8')));
    const config = { ...old, registry_id: registryId, ...old.repository === old.registry_id ? { repository: registryId } : {} };
    await validateSchema('registry-config', config);
    const files = ['registry.config.json', 'data/mappings.json'], originals = await Promise.all(files.map(async (f) => (await readRegistryFile(root, f)).toString('utf8')));
    function remap(value) {
        if (typeof value === 'string' && value.startsWith(old.registry_id + '/skills/'))
            return registryId + value.slice(old.registry_id.length);
        if (Array.isArray(value))
            return value.map(remap);
        if (value && typeof value === 'object')
            return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, remap(v)]));
        return value;
    }
    const mappings = remap(JSON.parse(originals[1]));
    await validateSchema('registry-mappings', mappings);
    if (old.registry_id === registryId)
        return { changed: false, registry_id: registryId };
    await compileRegistry(root, inventory, { 'registry.config.json': config, 'data/mappings.json': mappings });
    // Exclusive writer lock. Readers see either a valid cohort or a freshness error.
    const lock = await open(join(root, '.configure.lock'), 'wx');
    const changed = [];
    try {
        for (let i = 0; i < files.length; i++)
            if ((await readRegistryFile(root, files[i])).toString('utf8') !== originals[i])
                throw Error('Authoring files changed during configuration; retry');
        const next = [encode(config), encode(mappings)];
        for (let i = 0; i < files.length; i++) {
            const file = join(root, files[i]), temp = file + '.' + randomUUID() + '.tmp';
            await writeFile(temp, next[i]);
            await rename(temp, file);
            changed.push(i);
        }
        await compileRegistry(root, inventory);
        return { changed: true, registry_id: registryId };
    }
    catch (error) {
        for (const i of changed.reverse())
            await writeFile(join(root, files[i]), originals[i]);
        throw error;
    }
    finally {
        await lock.close();
        await unlink(join(root, '.configure.lock'));
    }
}
