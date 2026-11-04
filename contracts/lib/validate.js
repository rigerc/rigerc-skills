import { readFile } from 'node:fs/promises';
import { Ajv2020 } from 'ajv/dist/2020.js';
import { Minimatch } from 'minimatch';
import { CUSTOM_CAPABILITIES, REGISTRY_LIMITS } from './contracts.js';
import { safePath, sha256 } from './identity.js';
let validators;
async function schemas() {
    return validators ??= (async () => {
        const ajv = new Ajv2020({ strict: true, allErrors: true, validateFormats: false });
        const names = ['custom-registry', 'custom-manifest', 'custom-latest', 'registry-config', 'registry-mappings', 'registry-rules'];
        for (const name of names)
            ajv.addSchema(JSON.parse(await readFile(new URL('../data/' + name + '.schema.json', import.meta.url), 'utf8')));
        return new Map(names.map(name => [name, ajv.getSchema(name + '.schema.json')]));
    })();
}
export async function validateSchema(name, value, file = name + '.json') {
    const record = value;
    if (record && 'schema_version' in record && record.schema_version !== 1)
        throw Error(file + ': unsupported schema major version ' + record.schema_version);
    if (record && 'manifest_version' in record && record.manifest_version?.major !== 1)
        throw Error(file + ': unsupported manifest major version');
    const validate = (await schemas()).get(name);
    if (!validate)
        throw Error('Unknown schema ' + name);
    if (!validate(value))
        throw Error(file + ': ' + validate.errors.slice(0, 8).map(e => e.instancePath + ' ' + e.message +
            ('additionalProperty' in e.params ? ' (' + e.params.additionalProperty + ')' : '')).join('; '));
    return value;
}
function unique(rows, get, label) {
    const seen = new Set();
    for (const row of rows) {
        const id = get(row);
        if (seen.has(id))
            throw Error(label + ': duplicate ID ' + id);
        seen.add(id);
    }
    return seen;
}
export function validateSignals(signals, field) {
    for (const [index, signal] of signals.entries()) {
        const at = field + '/signals/' + index;
        if (signal.type === 'path' && !safePath(signal.path))
            throw Error(at + ': unsafe path');
        if (signal.type === 'glob' || signal.type === 'content') {
            const glob = signal.type === 'glob' ? signal.pattern : signal.path_glob;
            if (glob.startsWith('/') || glob.includes('\\') || glob.split('/').some(p => p === '..'))
                throw Error(at + ': invalid or escaping glob');
            // Bound brace/extglob expansion before the runtime matcher compiles it.
            if ((glob.match(/[{}()]/g) ?? []).length > 16 || /\{[^}]*\.\.[^}]*\}/.test(glob))
                throw Error(at + ': glob expansion limit');
            let expansions = 1;
            const groups = glob.match(/\{[^{}]*\}/g) ?? [];
            if (/[{}]/.test(glob.replace(/\{[^{}]*\}/g, '')))
                throw Error(at + ': nested or unmatched glob braces');
            for (const group of groups) {
                expansions *= group.split(',').length;
                if (expansions > 256)
                    throw Error(at + ': glob expansion limit');
            }
            if (new Minimatch(glob, { nonegate: true, braceExpandMax: 256 }).set.length > 256)
                throw Error(at + ': glob expansion limit');
        }
        if (signal.type === 'content')
            try {
                new RegExp(signal.regex, signal.case_sensitive === false ? 'i' : '');
            }
            catch {
                throw Error(at + ': invalid regular expression');
            }
    }
}
export async function validateRegistry(value, inventory) {
    const r = await validateSchema('custom-registry', value, 'registry.json');
    if ([...r.technologies, ...r.augmentations].reduce((n, row) => n + row.signals.length, 0) > 4096)
        throw Error('registry.json: total signal count limit');
    const builtSkills = new Set(inventory.skills), builtTech = new Set(inventory.technologies), builtCombo = new Set(inventory.combinations);
    const skills = unique(r.skills, s => s.id, 'registry.json/skills'), tech = unique(r.technologies, t => t.id, 'registry.json/technologies');
    unique(r.combinations, c => c.id, 'registry.json/combinations');
    unique(r.augmentations, a => a.technology_id, 'registry.json/augmentations');
    const refSkill = (id, at) => { if (!skills.has(id) && !builtSkills.has(id))
        throw Error(at + ': unknown skill ' + id); };
    for (const skill of r.skills) {
        const rel = skill.path.slice('skills/'.length);
        if (!safePath(skill.path) || !skill.path.startsWith('skills/') || skill.id !== r.registry_id + '/skills/' + rel || builtSkills.has(skill.id))
            throw Error('registry.json/skills/' + skill.id + ': invalid canonical skill ID or path');
    }
    for (const row of [...r.technologies, ...r.combinations])
        if (!safePath(row.id))
            throw Error('registry.json: noncanonical ID ' + row.id);
    for (const row of r.technologies) {
        if (builtTech.has(row.id))
            throw Error('registry.json/technologies/' + row.id + ': built-in ID is protected; use augmentations');
        validateSignals(row.signals, 'registry.json/technologies/' + row.id);
        row.skill_ids.forEach(id => refSkill(id, 'registry.json/technologies/' + row.id));
    }
    for (const row of r.augmentations) {
        if (!builtTech.has(row.technology_id))
            throw Error('registry.json/augmentations: unknown built-in technology ' + row.technology_id);
        validateSignals(row.signals, 'registry.json/augmentations/' + row.technology_id);
        row.skill_ids.forEach(id => refSkill(id, 'registry.json/augmentations/' + row.technology_id));
    }
    for (const row of r.combinations) {
        if (builtCombo.has(row.id))
            throw Error('registry.json/combinations/' + row.id + ': built-in ID is protected');
        for (const id of row.requires)
            if (!tech.has(id) && !builtTech.has(id))
                throw Error('registry.json/combinations/' + row.id + ': unknown technology ' + id);
        row.skill_ids.forEach(id => refSkill(id, 'registry.json/combinations/' + row.id));
    }
    r.frontend_essentials.forEach(id => refSkill(id, 'registry.json/frontend_essentials'));
    r.always_recommend.forEach(id => refSkill(id, 'registry.json/always_recommend'));
    return r;
}
export function versionAtLeast(actual, minimum) {
    const parse = (s) => { const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(s); if (!m)
        throw Error('Invalid version ' + s); return m; };
    const a = parse(actual), b = parse(minimum);
    for (let i = 1; i <= 3; i++)
        if (Number(a[i]) !== Number(b[i]))
            return Number(a[i]) > Number(b[i]);
    if (!a[4])
        return true;
    if (!b[4])
        return false;
    const ap = a[4].split('.'), bp = b[4].split('.');
    for (let i = 0; i < Math.max(ap.length, bp.length); i++) {
        if (ap[i] === undefined)
            return false;
        if (bp[i] === undefined)
            return true;
        if (ap[i] === bp[i])
            continue;
        const an = /^\d+$/.test(ap[i]), bn = /^\d+$/.test(bp[i]);
        return an && bn ? Number(ap[i]) > Number(bp[i]) : an !== bn ? !an : ap[i] > bp[i];
    }
    return true;
}
export async function decodeCustom(bytes, inventory, version, expected) {
    if (bytes.length > REGISTRY_LIMITS.manifest || expected?.digest && sha256(bytes) !== expected.digest)
        throw Error('Manifest digest/size mismatch');
    const m = await validateSchema('custom-manifest', JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes)));
    if (m.registry_id !== m.registry.registry_id || expected?.registryId && m.registry_id !== expected.registryId || expected?.revision && m.source.revision !== expected.revision)
        throw Error('Manifest registry/revision identity mismatch');
    if (!versionAtLeast(version, m.minimum_nosey_version))
        throw Error('Manifest requires Nosey ' + m.minimum_nosey_version);
    for (const c of m.required_capabilities)
        if (!CUSTOM_CAPABILITIES.includes(c))
            throw Error('Unsupported manifest capability ' + c);
    await validateRegistry(m.registry, inventory);
    return m;
}
export async function validateCustomPointer(value) {
    const p = await validateSchema('custom-latest', value);
    if (p.artifact.path !== 'manifests/sha256-' + p.artifact.sha256 + '.json')
        throw Error('Pointer digest path mismatch');
    return p;
}
