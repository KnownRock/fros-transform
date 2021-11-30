import fros from 'fros';
const x = 1;
fros({
  type: 'POST',
  url: `/api/post/[id]/comments?id=[cid]&time=${time}`
}, {
  x: x
});