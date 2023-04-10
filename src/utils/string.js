const RANDOM_CHAR_SET =
  '-_abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function getRandomString(numChars) {
  let randomString = '';
  for (let i = 0; i < numChars; i++) {
    const randomIndex = Math.floor(Math.random() * RANDOM_CHAR_SET.length);
    const randomChar = RANDOM_CHAR_SET.charAt(randomIndex);
    randomString += randomChar;
  }
  return randomString;
}

export function getOrdinalNumberString(num) {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) {
    return num + 'st';
  }
  if (j === 2 && k !== 12) {
    return num + 'nd';
  }
  if (j === 3 && k !== 13) {
    return num + 'rd';
  }
  return num + 'th';
}
