// Entry point: loads the Arabic message dictionary (side effect) and exposes the translator
import './messages-data';
import './messages-toasts';
import './messages-plans';
import './messages-labels';
import './messages-screens';
export { translateMessageToArabic, registerMessages } from './messages-registry';
