export function formatTemplate(template: string, context: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return String(context[key] ?? '');
  });
}

export function encodeWhatsAppMessage(message: string) {
  return encodeURIComponent(message);
}