async function getAuthToken() {
  const response = await fetch('https://chat.openai.com/api/auth/session');
  const data = await response.json();
  return data.accessToken;
}

export async function patchConversationTitle(conversationId, newTitle) {
  const authToken = await getAuthToken();
  const response = await fetch(
    `https://chat.openai.com/backend-api/conversation/${conversationId}`,
    {
      headers: {
        authorization: `Bearer ${authToken}`,
        'content-type': 'application/json',
      },
      referrer: `https://chat.openai.com/chat/${conversationId}`,
      referrerPolicy: 'same-origin',
      body: JSON.stringify({ title: newTitle }),
      method: 'PATCH',
      mode: 'cors',
      credentials: 'include',
    }
  );
  const data = await response.json();
  return data;
}

export async function fetchConversationsWithinRange(offset = 0, limit = 20) {
  const authToken = await getAuthToken();
  const response = await fetch(
    `https://chat.openai.com/backend-api/conversations?offset=${offset}&limit=${limit}`,
    {
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      referrer: 'https://chat.openai.com/chat',
      referrerPolicy: 'same-origin',
      body: null,
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
    }
  );
  const data = await response.json();
  return data;
}

export async function fetchMostRecentConversation() {
  const { items: convos } = await fetchConversationsWithinRange(0, 20);
  return convos[0];
}

export async function fetchAllConversations() {
  let allConvos = [];
  let currentOffset = 0;
  const limit = 20;
  while (true) {
    const { items: convos, total } = await fetchConversationsWithinRange(
      currentOffset,
      limit
    );
    allConvos = [...allConvos, ...convos];
    if (currentOffset + convos.length >= total) {
      break;
    } else {
      currentOffset += limit;
    }
  }

  return allConvos;
}

export async function fetchConversationContent(conversationId) {
  const authToken = await getAuthToken();
  const response = await fetch(
    `https://chat.openai.com/backend-api/conversation/${conversationId}`,
    {
      headers: {
        authorization: `Bearer ${authToken}`,
      },
      referrer: `https://chat.openai.com/chat/${conversationId}`,
      referrerPolicy: 'same-origin',
      body: null,
      method: 'GET',
      mode: 'cors',
      credentials: 'include',
    }
  );
  const data = await response.json();
  return data;
}
