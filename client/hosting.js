export const staticHosting = import.meta.env?.VITE_STATIC_HOSTING === 'true';
export const basePath = import.meta.env?.BASE_URL || '/';
export const hostingNotice = 'This is the LeadNest website preview. Sign-in, CRM data and payments will be available after the application server is connected.';
export const assetUrl = path => basePath + path.replace(/^\//, '');
export const routeUrl = path => staticHosting ? basePath + '#' + path : path;
export function currentPath() {
  return staticHosting ? (location.hash.slice(1).split('?')[0] || '/') : location.pathname;
}
