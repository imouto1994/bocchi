console.log('This is the background page.');
console.log('Put the background scripts here.');

async function cookieAuthTokenHandler(sendResponse) {
  const cookie = await chrome.cookies.getAll({
    domain: 'chat.openai.com',
    name: '__Secure-next-auth.session-token',
  });
  sendResponse({ data: cookie });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === 'cookie_auth_token') {
    cookieAuthTokenHandler(sendResponse);
    return true;
  }
});
