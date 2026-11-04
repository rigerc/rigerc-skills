import { realpath } from 'node:fs/promises';
import { readRegistryFile, discoverSkills } from './skills.js';
import { validateSchema, validateRegistry } from './validate.js';
import { compare, encode } from './identity.js';
const sorted = (rows, get) => [...rows].sort((a, b) => compare(get(a), get(b)));
const ids = (rows) => [...new Set(rows)].sort(compare);
export async function compileRegistry(path, inventory, overrides = {}) {
    const root = await realpath(path);
    const read = async (file, schema) => validateSchema(schema, overrides[file] ?? JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(await readRegistryFile(root, file))), file);
    const config = await read('registry.config.json', 'registry-config');
    const mappings = await read('data/mappings.json', 'registry-mappings');
    const rules = await read('data/technology-detection-rules.json', 'registry-rules');
    const { skills, assets } = await discoverSkills(root, config.registry_id);
    const mapped = new Map();
    for (const row of mappings.technologies ?? []) {
        if (mapped.has(row.technology_id))
            throw Error('data/mappings.json: duplicate technology ' + row.technology_id);
        mapped.set(row.technology_id, row.skill_ids);
    }
    for (const id of mapped.keys())
        if (!rules.technologies.some(t => t.id === id))
            throw Error('data/mappings.json: unknown custom technology ' + id + '; built-ins require augmentations');
    const aug = new Map();
    for (const row of mappings.augmentations ?? []) {
        if (aug.has(row.technology_id))
            throw Error('data/mappings.json: duplicate augmentation ' + row.technology_id);
        aug.set(row.technology_id, { ...row, signals: [] });
    }
    const seen = new Set();
    for (const row of rules.augmentations ?? []) {
        if (seen.has(row.technology_id))
            throw Error('data/technology-detection-rules.json: duplicate augmentation ' + row.technology_id);
        seen.add(row.technology_id);
        aug.set(row.technology_id, { ...row, skill_ids: aug.get(row.technology_id)?.skill_ids ?? [] });
    }
    const registry = { schema_version: 1, registry_id: config.registry_id, skills: sorted(skills, s => s.id),
        technologies: sorted(rules.technologies, t => t.id).map(t => ({ ...t, skill_ids: ids(mapped.get(t.id) ?? []) })),
        augmentations: sorted([...aug.values()], a => a.technology_id).map(a => ({ ...a, skill_ids: ids(a.skill_ids) })),
        combinations: sorted(mappings.combinations ?? [], c => c.id).map(c => ({ ...c, requires: ids(c.requires), skill_ids: ids(c.skill_ids) })),
        frontend_essentials: ids(mappings.frontend_essentials ?? []), always_recommend: ids(mappings.always_recommend ?? []) };
    await validateRegistry(registry, inventory);
    return { registry, config, assets, text: encode(registry) };
}
export async function validateLocal(path, inventory) {
    const compiled = await compileRegistry(path, inventory);
    const text = (await readRegistryFile(await realpath(path), 'registry.json', 10 * 1024 * 1024)).toString('utf8');
    if (text !== compiled.text)
        throw Error('registry.json: generated output is stale; run npm run build');
    return compiled;
}
