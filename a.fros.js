const frosServer = require('frosServer')

frosServer({
  type: 'POST',
  url: `/api/post/[id]/comments?id=[cid]&time=${time}`
}, async function (__fros__context) {
  const __fros__req = __fros__context.__fros__req,
        x = __fros__req.x;
  return '123' + x;
})