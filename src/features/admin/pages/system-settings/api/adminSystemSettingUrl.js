export const adminSystemSettingsUrl = "/admin/system-settings";

export const adminSystemSettingUrl = (key) =>
  `/admin/system-settings/${encodeURIComponent(key)}`;
