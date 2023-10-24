const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const CODE_LENGTH = 6

export function genRoomCode() {
  let code = ''
  while (code.length < CODE_LENGTH) {
    code += CHARACTERS[Math.floor(Math.floor(Math.random() * CHARACTERS.length))]
  }
  return code
}
