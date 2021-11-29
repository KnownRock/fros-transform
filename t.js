const {
  getServerCodeMeta,
  getClientCode
} = require('./index.js');

const fs = require('fs');

const code = 
`
import fros from 'fros'
fros(async function(){
  return '123' + x
})
`
const meta = getServerCodeMeta(code, {
  calleeName: 'frosServer'
}) 
fs.writeFileSync(
  'a' + '.fros.js',
  "const frosServer = require('frosServer')\n\n" +
  meta.serverCodes.join('\n\n'),
  'utf8')

console.log(getClientCode(code));