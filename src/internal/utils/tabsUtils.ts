export async function getActiveTab(): Promise<chrome.tabs.Tab> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

export async function getAllTabs(): Promise<chrome.tabs.Tab[]> {
  const tabs = await chrome.tabs.query({ status: 'complete' });
  return tabs;
}
