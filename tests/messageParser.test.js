import assert from "node:assert/strict";
import test from "node:test";
import { customerDocumentId, normalizeKannadaMessage } from "../src/messageParser.js";

const products = [
  { id: "maggi", name: "Maggi" },
  { id: "milk", name: "Milk" },
  { id: "rice", name: "Rice" },
  { id: "oil", name: "Cooking Oil" },
];

test("normalizes Kannada sale with multiple products and Kannada number words", () => {
  assert.equal(normalizeKannadaMessage("ಮೂರು ಮ್ಯಾಗಿ ಮತ್ತು ಎರಡು ಹಾಲು ಮಾರಿದೆ", products), "sold 3 Maggi and 2 Milk");
});

test("matches Kannada action, products, and quantities regardless of sentence order", () => {
  assert.equal(normalizeKannadaMessage("ಇವತ್ತು ಮ್ಯಾಗಿ 3 ಮಾರಾಟ ಮಾಡಿದೆ", products), "sold 3 Maggi");
  assert.equal(normalizeKannadaMessage("ಅಕ್ಕಿ 20 ಚೀಲ ಸ್ವೀಕರಿಸಿದೆ", products), "received 20 Rice");
  assert.equal(normalizeKannadaMessage("2 ಎಣ್ಣೆ ಬಾಟಲಿ ಹಾಳಾಗಿದೆ", products), "damaged 2 Cooking Oil");
  assert.equal(normalizeKannadaMessage("ನಾನು ಮ್ಯಾಗಿ ಮಾರಿದೆ ಮೂರು", products), "sold 3 Maggi");
});

test("matches English stock keywords when action comes after the products", () => {
  assert.equal(normalizeKannadaMessage("Maggi sold 3, milk sold 2", products), "sold 3 Maggi and 2 Milk");
  assert.equal(normalizeKannadaMessage("rice 20 bags received today", products), "received 20 Rice");
  assert.equal(normalizeKannadaMessage("I sold 3 packets of Maggi and gave out 2 milk packets", products), "sold 3 Maggi and 2 Milk");
});

test("normalizes Kannada numerals and received quantities", () => {
  assert.equal(normalizeKannadaMessage("೨೦ ಅಕ್ಕಿ ಚೀಲ ಬಂದಿದೆ", products), "received 20 Rice");
});

test("normalizes credit messages with Kannada customer names", () => {
  assert.equal(normalizeKannadaMessage("ರಮೇಶ್ 2 ಅಕ್ಕಿ ಸಾಲವಾಗಿ ತೆಗೆದುಕೊಂಡರು", products), "ರಮೇಶ್ took 2 Rice on credit");
  assert.equal(customerDocumentId("ರಮೇಶ್"), "ರಮೇಶ್");
});

test("normalizes mixed-language credit and Kannada currency payments", () => {
  assert.equal(normalizeKannadaMessage("ರಮೇಶ್ took 2 ಅಕ್ಕಿ on credit", products), "ರಮೇಶ್ took 2 Rice on credit");
  assert.equal(normalizeKannadaMessage("2 ಅಕ್ಕಿ ರಮೇಶ್‌ಗೆ ಸಾಲವಾಗಿ ಕೊಟ್ಟೆ", products), "ರಮೇಶ್ took 2 Rice on credit");
  assert.equal(normalizeKannadaMessage("2 ಅಕ್ಕಿ ರಮೇಶ್ ಗೆ ಸಾಲವಾಗಿ ಕೊಟ್ಟೆ", products), "ರಮೇಶ್ took 2 Rice on credit");
  assert.equal(normalizeKannadaMessage("ರಮೇಶ್ ₹200 ಕೊಟ್ಟರು", products), "ರಮೇಶ್ paid 200");
  assert.equal(normalizeKannadaMessage("paid ₹200 from Ramesh", products), "Ramesh paid 200");
});

test("leaves unrecognized Kannada text unchanged for a helpful error", () => {
  assert.equal(normalizeKannadaMessage("ನಮಸ್ಕಾರ", products), "ನಮಸ್ಕಾರ");
});
