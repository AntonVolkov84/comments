export function validateHtmlText(input) {
  const allowedTags = ["a", "code", "i", "strong"];
  const tagPattern = /<\/?([a-z]+)(\s[^>]*)?>/gi;
  const stack = [];

  let match;
  let cleanedInput = input;

  while ((match = tagPattern.exec(input)) !== null) {
    const fullMatch = match[0];
    const tagName = match[1].toLowerCase();
    const isClosingTag = fullMatch.startsWith("</");

    if (!allowedTags.includes(tagName)) {
      return { valid: false, error: `Tag <${tagName}> is not allowed.` };
    }

    if (!isClosingTag) {
      if (tagName === "a") {
        const attrs = match[2] || "";
        const hasHref = /href\s*=\s*["'][^"']*["']/.test(attrs);
        const hasTitle = /title\s*=\s*["'][^"']*["']/.test(attrs);
        if (!hasHref || !hasTitle) {
          return { valid: false, error: `<a> tag must include href and title attributes.` };
        }
      }
      stack.push(tagName);
    } else {
      const lastTag = stack.pop();
      if (lastTag !== tagName) {
        return { valid: false, error: `Mismatched closing tag </${tagName}>.` };
      }
    }
    cleanedInput = cleanedInput.replace(fullMatch, "");
  }
  if (stack.length > 0) {
    return { valid: false, error: `Unclosed tag <${stack[stack.length - 1]}>.` };
  }
  const hasUnexpectedTags = /<[^>]+>/.test(cleanedInput);
  if (hasUnexpectedTags) {
    return { valid: false, error: `Input contains unexpected or malformed tags.` };
  }
  return { valid: true };
}
