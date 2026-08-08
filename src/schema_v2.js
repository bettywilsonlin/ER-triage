export function validateContentV2(c) {
  const errors = [];
  const need = (path, cond) => { if (!cond) errors.push(path); };
  need("version", typeof c?.version === "string");
  need("locale", typeof c?.locale === "string");
  need("prepost.items(3)", Array.isArray(c?.prepost?.items) && c.prepost.items.length === 3);
  for (const k of ["demo", "faded", "solo"]) need(`part2.${k}`, c?.part2?.[k] && typeof c.part2[k] === "object");
  need("part3.junctions(5)", Array.isArray(c?.part3?.junctions) && c.part3.junctions.length === 5);
  return { ok: errors.length === 0, errors };
}
