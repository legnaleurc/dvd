import { applyCommand, getStreamUrl } from "./api";
import { loadActionMap } from "./storage";

export async function callExternal(id: string, name: string, mimeType: string) {
  if (!id || !name || !mimeType) {
    return;
  }
  const actionMap = loadActionMap();
  const [category] = mimeType.split("/");
  const command = actionMap[category];
  if (!command) {
    return;
  }
  const url = getStreamUrl(id, name);
  if (isXCallbackUrl(command)) {
    const callbackUrl = formatXCallbackUrl(command, url);
    window.open(callbackUrl, "_blank");
  } else {
    await applyCommand(command, {
      url,
    });
  }
}

function isXCallbackUrl(command: string) {
  return command.indexOf("x-callback://") >= 0;
}

function formatXCallbackUrl(command: string, url: string): string {
  const callbackUrl = command.replace(/\{(url)\}/g, (m0, m1) => {
    if (m1 === "url") {
      return encodeURIComponent(url);
    }
    return m0;
  });
  return callbackUrl;
}
