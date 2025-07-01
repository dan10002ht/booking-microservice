// Helper để chuẩn hóa device info và request info

export function normalizeDeviceInfo(device_info = {}) {
  return {
    device_hash: device_info.device_hash || 'unknown',
    device_name: device_info.device_name || 'Unknown Device',
    device_type: device_info.device_type || 'unknown',
    browser: device_info.browser || 'unknown',
    browser_version: device_info.browser_version || 'unknown',
    os: device_info.os || 'unknown',
    os_version: device_info.os_version || 'unknown',
    screen_resolution: device_info.screen_resolution || 'unknown',
    timezone: device_info.timezone || 'UTC',
    language: device_info.language || 'en-US',
    location_data: device_info.location_data || {},
    fingerprint_data: device_info.fingerprint_data || {},
  };
}

export function normalizeRequestInfo(ip_address, user_agent) {
  return {
    ip_address: ip_address || 'unknown',
    user_agent: user_agent || 'unknown',
  };
}
