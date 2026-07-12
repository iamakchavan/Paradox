export function formatToolName(name: string) {
  return name
    .replace(/^__+|__+$/g, '')
    .replace(/[_-]+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
