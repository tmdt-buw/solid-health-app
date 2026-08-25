// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// @inrupt/solid-client uses undici in Jest. jsdom on the supported Node
// versions does not expose these Web Platform encoders globally.
import { TextDecoder, TextEncoder } from "util";

Object.assign(globalThis, { TextDecoder, TextEncoder });
