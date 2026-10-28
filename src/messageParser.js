const kannadaProductAliases = {
  maggi: ["ಮ್ಯಾಗಿ", "ಮ್ಯಾಗಿ ಪ್ಯಾಕೆಟ್", "ಮ್ಯಾಗಿ ಪ್ಯಾಕೆಟ್‌ಗಳು"],
  milk: ["ಹಾಲು", "ಹಾಲಿನ ಪ್ಯಾಕೆಟ್"],
  rice: ["ಅಕ್ಕಿ", "ಅಕ್ಕಿ ಚೀಲ", "ಅಕ್ಕಿ ಚೀಲಗಳು"],
  oil: ["ಅಡುಗೆ ಎಣ್ಣೆ", "ಎಣ್ಣೆ"],
  biscuits: ["ಬಿಸ್ಕತ್ತು", "ಬಿಸ್ಕತ್ತುಗಳು", "ಬಿಸ್ಕೆಟ್"],
  sugar: ["ಸಕ್ಕರೆ"],
  atta: ["ಗೋಧಿ ಹಿಟ್ಟು", "ಆಟಾ"],
  "toor-dal": ["ತೊಗರಿ ಬೇಳೆ", "ತೊಗರಿ"],
  "chana-dal": ["ಕಡಲೆ ಬೇಳೆ"],
  salt: ["ಉಪ್ಪು"],
  tea: ["ಚಹಾ ಪುಡಿ", "ಟೀ ಪುಡಿ", "ಚಹಾ"],
  coffee: ["ಕಾಫಿ"],
  soap: ["ಸ್ನಾನದ ಸಾಬೂನು", "ಸಾಬೂನು"],
  shampoo: ["ಶಾಂಪೂ"],
  toothpaste: ["ಟೂತ್‌ಪೇಸ್ಟ್", "ಟೂತ್ಪೇಸ್ಟ್"],
  detergent: ["ವಾಷಿಂಗ್ ಪೌಡರ್", "ಡಿಟರ್ಜೆಂಟ್", "ಸರ್ಫ್"],
  bread: ["ಬ್ರೆಡ್"],
  eggs: ["ಮೊಟ್ಟೆ", "ಮೊಟ್ಟೆಗಳು"],
  noodles: ["ನೂಡಲ್ಸ್"],
  ghee: ["ತುಪ್ಪ"],
  turmeric: ["ಅರಿಶಿನ ಪುಡಿ", "ಅರಿಶಿನ"],
  "chilli-powder": ["ಮೆಣಸಿನ ಪುಡಿ", "ಖಾರದ ಪುಡಿ"],
  onion: ["ಈರುಳ್ಳಿ"],
  potato: ["ಆಲೂಗಡ್ಡೆ", "ಆಲೂಗಡ್ಡ"],
  water: ["ನೀರಿನ ಬಾಟಲಿ", "ನೀರು"],
};

const kannadaNumbers = {
  "ಸೊನ್ನೆ": 0, "ಒಂದು": 1, "ಒಂದ": 1, "ಎರಡು": 2, "ಮೂರು": 3, "ನಾಲ್ಕು": 4,
  "ಐದು": 5, "ಆರು": 6, "ಏಳು": 7, "ಎಂಟು": 8, "ಒಂಬತ್ತು": 9, "ಹತ್ತು": 10,
  "ಹನ್ನೊಂದು": 11, "ಹನ್ನೆರಡು": 12, "ಹದಿಮೂರು": 13, "ಹದಿನಾಲ್ಕು": 14,
  "ಹದಿನೈದು": 15, "ಹದಿನಾರು": 16, "ಹದಿನೇಳು": 17, "ಹದಿನೆಂಟು": 18,
  "ಹತ್ತೊಂಬತ್ತು": 19, "ಇಪ್ಪತ್ತು": 20,
};

const numberWords = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
  eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
  fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
  nineteen: 19, twenty: 20,
};
const units = "ಪ್ಯಾಕೆಟ್‌ಗಳು|ಪ್ಯಾಕೆಟ್|ಪ್ಯಾಕೆಟುಗಳು|ಚೀಲಗಳು|ಚೀಲ|ಬಾಟಲಿಗಳು|ಬಾಟಲಿ|ಕೆಜಿಗಳು|ಕೆಜಿ|ಕಿಲೋ|ಕಿಲೋಗ್ರಾಂ|ರೂಪಾಯಿಗಳು|ರೂಪಾಯಿ|ರುಪಾಯಿ|ಮೊಟ್ಟೆಗಳು|ಮೊಟ್ಟೆ|ಪ್ಯಾಕ್|packets?|packet|bags?|bag|bottles?|bottle|kg|kilos?|units?|pieces?|pcs?";
const kannadaDigits = { "೦": "0", "೧": "1", "೨": "2", "೩": "3", "೪": "4", "೫": "5", "೬": "6", "೭": "7", "೮": "8", "೯": "9" };
export const hasKannada = (text) => /[\u0C80-\u0CFF]/.test(text);
const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function replaceNumberWords(message) {
  let text = message.replace(/[೦-೯]/g, (digit) => kannadaDigits[digit]);
  const allNumbers = { ...kannadaNumbers, ...numberWords };
  for (const [word, number] of Object.entries(allNumbers).sort(([left], [right]) => right.length - left.length)) {
    const boundary = /^[a-z]+$/i.test(word)
      ? "\\b"
      : "(?<![\\p{L}\\p{M}])";
    const endBoundary = /^[a-z]+$/i.test(word) ? "\\b" : "(?![\\p{L}\\p{M}])";
    text = text.replace(new RegExp(`${boundary}${escapeRegex(word)}${endBoundary}`, "giu"), String(number));
  }
  return text;
}

function productAliases(products) {
  return products
    .flatMap((product) => [product.name, ...(kannadaProductAliases[product.id] || [])]
      .map((alias) => ({ product, alias })))
    .sort((left, right) => right.alias.length - left.alias.length);
}

function findProductMentions(text, products) {
  const mentions = [];
  for (const { product, alias } of productAliases(products)) {
    const escaped = escapeRegex(alias);
    const englishBoundary = /^[\p{L}\p{N} ]+$/u.test(alias) && !hasKannada(alias)
      ? "(?<![\\p{L}\\p{N}])" + escaped + "(?![\\p{L}\\p{N}])"
      : escaped;
    const matcher = new RegExp(englishBoundary, "giu");
    for (const match of text.matchAll(matcher)) {
      const start = match.index;
      const end = start + match[0].length;
      if (!mentions.some((mention) => start < mention.end && end > mention.start)) {
        mentions.push({ product, start, end });
      }
    }
  }
  return mentions.sort((left, right) => left.start - right.start);
}

function findAdjacentQuantity(text, mentions, index) {
  const mention = mentions[index];
  const previousEnd = index > 0 ? mentions[index - 1].end : Math.max(0, mention.start - 48);
  const nextStart = index < mentions.length - 1 ? mentions[index + 1].start : Math.min(text.length, mention.end + 48);
  const left = text.slice(previousEnd, mention.start)
    .replace(new RegExp(`(?:(?:${units})(?:\\s+of)?|and|&|ಮತ್ತು|ಹಾಗೂ|ಇನ್ನೂ|sold|sell|sale|ಮಾರಾಟ|ಮಾರಿದೆವು|ಮಾರಿದರು|ಮಾರಿದೆ|ಮಾರಿದ|ಮಾರಿ|ಮಾಡಿದೆ|ಮಾಡಿದ|ಮಾಡಿದರು)\\s*$`, "iu"), "")
    .trimEnd();
  const right = text.slice(mention.end, nextStart)
    .replace(new RegExp(`^\\s*(?:(?:${units})\\s*(?:of\\s*)?)?(?:(?:sold|sell|sale|received|restocked|damaged|returned|return|ಮಾರಾಟ|ಮಾರಿದೆವು|ಮಾರಿದರು|ಮಾರಿದೆ|ಮಾರಿದ|ಮಾರಿ|ಮಾಡಿದೆ|ಮಾಡಿದ|ಮಾಡಿದರು|ಸ್ವೀಕರಿಸಿ|ಸ್ವೀಕರಿಸಿದ|ಸ್ವೀಕರಿಸಿದೆ|ಪಡೆದರು|ಪಡೆದಿದೆ|ಬಂದಿದೆ|ತಂದರು|ಹಾಳಾಗಿದೆ|ಹಾನಿಯಾಗಿದೆ|ಒಡೆದಿದೆ|ಹಿಂತಿರುಗಿಸಿದರು|ವಾಪಸ್|ಸಾಲ|ಉಧಾರ|ಉದಾರ|ಕ್ರೆಡಿಟ್|ತೆಗೆದುಕೊಂಡರು|ತಗೊಂಡರು)\\s*)*`, "iu"), "")
    .trimStart();
  const numberPattern = "(\\d+)";
  const leftMatch = left.match(new RegExp(`(?:^|[\\s,])${numberPattern}\\s*$`, "u"));
  const rightMatch = right.match(new RegExp(`^${numberPattern}(?=$|[\\s,])`, "u"));
  const quantity = Number(leftMatch?.[1] || rightMatch?.[1] || 0);
  const quantityStart = leftMatch ? mention.start - leftMatch[0].length : rightMatch ? mention.end : mention.end;
  const quantityEnd = leftMatch ? mention.start : rightMatch ? mention.end + rightMatch[0].length : mention.end;
  return { quantity, quantityStart, quantityEnd };
}

function detectAction(text) {
  if (/ಸಾಲ|ಉಧಾರ|ಉದಾರ|ಕ್ರೆಡಿಟ್|\bcredit\b|\bon credit\b/iu.test(text)) return "credit";
  if (/ಹಾಳಾ|ಹಾನಿ|ಒಡೆದ|ಕೆಟ್ಟ|\bdamaged?\b/iu.test(text)) return "damaged";
  if (/ಹಿಂತಿರುಗ|ವಾಪಸ್|ಮರಳಿಸಿದ|\breturned?\b/iu.test(text)) return "returned";
  if (/ಸ್ವೀಕರ|ಪಡೆದ|ಬಂದ|ತಂದ|\breceived\b|\brestocked\b|\bgot\b/iu.test(text)) return "received";
  if (/ಮಾರಾಟ|ಮಾರಿದ|ಮಾರಿದೆ|ಮಾರಿದರು|ಮಾರಿದೆವು|ಮಾರಿ|\bsold\b|\bsell\b|\bsale\b/iu.test(text)) return "sold";
  return "";
}

function stripCustomerContext(text, mentions, quantities) {
  const ranges = [
    ...mentions.map((mention) => ({ start: mention.start, end: mention.end })),
    ...quantities.map((quantity) => ({ start: quantity.quantityStart, end: quantity.quantityEnd })),
  ].filter((range) => range.start < range.end).sort((left, right) => right.start - left.start);
  let customer = text;
  for (const range of ranges) {
    customer = `${customer.slice(0, range.start)} ${customer.slice(range.end)}`;
  }
  return customer
    .replace(/[\d,₹]+/gu, " ")
    .replace(/(?:packets?|packet|bags?|bag|bottles?|bottle|kg|kilos?|units?|pieces?|pcs?|ಪ್ಯಾಕೆಟ್‌ಗಳು|ಪ್ಯಾಕೆಟ್|ಚೀಲಗಳು|ಚೀಲ|ಬಾಟಲಿಗಳು|ಬಾಟಲಿ|ಕೆಜಿಗಳು|ಕೆಜಿ|ಕಿಲೋ|ಪ್ಯಾಕ್|ರೂಪಾಯಿಗಳು|ರೂಪಾಯಿ|ರುಪಾಯಿ)/giu, " ")
    .replace(/(?:ನಾನು|ನಾವು|ಇಂದು|ಇಲ್ಲಿ|ಗ್ರಾಹಕ|ಅವರು|ಇವರು|ಅವನು|ಗೆ|ನಿಂದ|ಮತ್ತು|ಹಾಗೂ|ಮಾಡಿ|ಮಾಡಿದ|ಮಾಡಿದೆ|ಮಾಡಿದರು|ಮಾಡಿದೆವು|ಮಾರಾಟ|ಮಾರಿದ|ಮಾರಿದೆ|ಮಾರಿದರು|ಮಾರಿದೆವು|ಮಾರಿ|ಸ್ವೀಕರಿಸಿ|ಸ್ವೀಕರಿಸಿದ|ಸ್ವೀಕರಿಸಿದೆ|ಪಡೆದರು|ಪಡೆದಿದೆ|ಬಂದಿದೆ|ತಂದರು|ಹಾಳಾಗಿದೆ|ಹಾನಿಯಾಗಿದೆ|ಒಡೆದಿದೆ|ಹಿಂತಿರುಗಿಸಿದರು|ವಾಪಸ್|ಸಾಲವಾಗಿ|ಸಾಲ|ಉಧಾರ|ಉದಾರ|ಕ್ರೆಡಿಟ್|ತೆಗೆದುಕೊಂಡರು|ತಗೊಂಡರು|ಕೊಟ್ಟರು|ಕೊಟ್ಟೆ|ಕೊಟ್ಟ|ಪಾವತಿಸಿದ|ಪಾವತಿಸಿದರು|ತೀರಿಸಿದ|ತೀರಿಸಿದರು)/giu, " ")
    .replace(/\b(?:on|for|by|from|to|customer|paid|payed|pay|payment|took|bought|credit|sold|sell|sale|received|restocked|damaged|returned|return|got)\b/giu, " ")
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, " ")
    .trim();
}

export function customerDocumentId(name) {
  return name.trim().normalize("NFC").toLocaleLowerCase().replace(/[^\p{L}\p{M}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
}

export function normalizeKannadaMessage(message, products) {
  const text = replaceNumberWords(message);
  const action = detectAction(text);

  const explicitPaymentAction = /ಪಾವತಿಸಿದ|ಪಾವತಿಸಿದರು|ತೀರಿಸಿದ|ತೀರಿಸಿದರು|\bpaid\b|\bpayed\b|\bpayment\b|\bpay\b/iu.test(text);
  const informalPaymentAction = /ಕೊಟ್ಟ/iu.test(text);
  const amount = [...text.matchAll(/[\d,]+/gu)].at(-1);
  const hasProducts = findProductMentions(text, products).length > 0;
  if ((explicitPaymentAction || (informalPaymentAction && action !== "credit" && !hasProducts)) && amount) {
    const customer = stripCustomerContext(text, [], [{ quantityStart: amount.index, quantityEnd: amount.index + amount[0].length }]);
    return customer ? `${customer} paid ${amount[0].replace(/,/g, "")}` : message;
  }

  if (action === "credit" && !hasProducts) return message;
  const mentions = findProductMentions(text, products);
  const found = mentions.map((mention, index) => ({ ...mention, ...findAdjacentQuantity(text, mentions, index) }))
    .filter((mention) => mention.quantity > 0);
  if (!found.length) return message;

  const items = found.map((mention) => `${mention.quantity} ${mention.product.name}`).join(" and ");
  if (action === "credit") {
    const customer = stripCustomerContext(text, found, found);
    return customer ? `${customer} took ${items} on credit` : message;
  }
  if (action) return `${action} ${items}`;
  return message;
}

export function speechRecognitionError(code) {
  const messages = {
    "not-allowed": "Microphone access is blocked. Allow microphone permission for this website in your browser, then try again.",
    "service-not-allowed": "Your browser blocked its speech service. Allow speech recognition or type your message instead.",
    "language-not-supported": "Kannada speech recognition is not available in this browser. Try the latest Chrome or Edge, or type the message.",
    "no-speech": "I didn’t hear speech. Check your microphone and try speaking a little closer to it.",
    network: "The browser’s speech service could not connect. Check your internet connection and try again.",
    aborted: "Voice input stopped. Tap the microphone to try again.",
  };
  return messages[code] || `Voice input error (${code}). Check microphone permission or type your message instead.`;
}
