const GMS83_EQUIPMENT_ID_OVERRIDES = {
  // CMS item id: GMS v83 item id
  // Most classic equipment IDs are shared between CMS and GMS83.
  // Add only true mismatches here, for example:
  // '01302085': '01302085',
};

function normalizeItemId(value) {
  const raw = String(value ?? '').replace(/\.0$/, '').replace(/\D+/g, '');
  return raw ? raw.padStart(8, '0') : '';
}

function toNumberId(value) {
  const normalized = normalizeItemId(value);
  if (!normalized) return null;
  const numeric = Number(normalized.replace(/^0+/, ''));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

export function getGms83EquipmentId(item) {
  const explicit = item?.gms83Id ?? item?.gms83_id ?? item?.gmsId ?? item?.gms_id;
  if (explicit) return toNumberId(explicit);

  const cmsId = normalizeItemId(item?.id ?? item?.itemId ?? item?.item_id ?? item?.code);
  if (!cmsId) return null;

  const mapped = GMS83_EQUIPMENT_ID_OVERRIDES[cmsId] ?? GMS83_EQUIPMENT_ID_OVERRIDES[cmsId.replace(/^0+/, '')];
  return toNumberId(mapped ?? cmsId);
}

export function getGms83EquipmentIdString(item) {
  const numeric = getGms83EquipmentId(item);
  return numeric ? String(numeric).padStart(8, '0') : '';
}
