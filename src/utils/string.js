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
