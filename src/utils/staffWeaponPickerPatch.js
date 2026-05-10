const ORIGINAL_REGEXP_TEST = RegExp.prototype.test;

function isGuideSpecialNamePattern(pattern) {
  const source = String(pattern?.source ?? '');
  return source.includes('gm|admin|administrator') && source.includes('|staff|') && source.includes('|developer|manager');
}

function removeStaffWord(value) {
  return String(value ?? '').replace(/\bstaff\b/gi, '').replace(/\s+/g, ' ').trim();
}

function installStaffWeaponPickerPatch() {
  const scope = typeof globalThis !== 'undefined' ? globalThis : null;
  if (!scope || scope.__mscwStaffWeaponPickerPatchInstalled) return;
  scope.__mscwStaffWeaponPickerPatchInstalled = true;

  RegExp.prototype.test = function patchedRegExpTest(value) {
    if (isGuideSpecialNamePattern(this) && /\bstaff\b/i.test(String(value ?? ''))) {
      return ORIGINAL_REGEXP_TEST.call(this, removeStaffWord(value));
    }
    return ORIGINAL_REGEXP_TEST.call(this, value);
  };
}

installStaffWeaponPickerPatch();
