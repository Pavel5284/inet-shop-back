/**
 * Приёмочный тест API: проходит по всему пользовательскому сценарию через GraphQL.
 * Запуск:  npm run e2e        (бэкенд должен быть запущен, БД — свежая, с seed)
 * Свежая БД: docker compose down -v  →  docker compose up -d db  →  запустить бэкенд (он сам применит миграции и seed).
 * Другой адрес API:  $env:API_URL="http://localhost:3000/graphql"; npm run e2e   (PowerShell)
 * Внимание: тест оформляет и отменяет заказ, меняет профиль демо-пользователя и в конце намеренно упирается
 * в rate limit (после него подождите минуту). Поэтому для повторного запуска сбрасывайте БД.
 * Выводит PASS/FAIL по каждой проверке; код выхода 1, если есть FAIL.
 */
const URL = process.env.API_URL ?? 'http://localhost:3000/graphql';
let token = '';
async function gql(query, variables = {}, tok = token) {
  const r = await fetch(URL, { method: 'POST', headers: { 'content-type': 'application/json', ...(tok ? { authorization: `Bearer ${tok}` } : {}) }, body: JSON.stringify({ query, variables }) });
  return r.json();
}
let failed = 0;
const ok = (name, cond, extra = '') => { if (!cond) { failed++; process.exitCode = 1; } console.log((cond ? 'PASS' : 'FAIL') + '  ' + name + (extra && !cond ? '  -> ' + extra : '')); };

let r = await gql('{ categories { id name slug icon productsCount } }');
ok('categories', r.data?.categories?.length === 8, JSON.stringify(r.data?.categories?.[0]) + (r.errors ? JSON.stringify(r.errors) : ''));

r = await gql('query($f: ProductsFilterInput,$s: ProductSort,$p:Int){ products(filter:$f, sort:$s, page:$p, pageSize:5){ total totalPages page items{ id slug title price oldPrice discountPercent rating reviewsCount stock images category{ slug name } } } }', { f: { categorySlug: 'electronics' }, s: 'PRICE_ASC', p: 1 });
ok('products filter+sort', r.data?.products?.items?.length === 5 && r.data.products.total === 8, `total=${r.data?.products?.total} first=${r.data?.products?.items?.[0]?.title} ${r.data?.products?.items?.[0]?.price} disc=${r.data?.products?.items?.[0]?.discountPercent}` + (r.errors ? JSON.stringify(r.errors) : ''));
const slug = r.data.products.items[0].slug;

r = await gql('{ products(filter:{search:"смартфон"}){ total items{title} } }');
ok('search', r.data?.products?.total === 2, JSON.stringify(r.data?.products?.items?.map(i => i.title)));
r = await gql('{ products(filter:{minPrice:20000, maxPrice:30000, inStock:true}){ total } }');
ok('price filter', r.data?.products?.total > 0, 'total=' + r.data?.products?.total);

r = await gql('query($s:String!){ product(slug:$s){ id title description category{name} } }', { s: slug });
ok('product by slug', !!r.data?.product?.id, r.data?.product?.title);
const pid0 = r.data.product.id;
r = await gql('{ products(filter:{inStock:true}, sort:PRICE_ASC, pageSize:1){ items{ id slug stock } } }');
const pid = r.data.products.items[0].id; const stock0 = r.data.products.items[0].stock; const slugIn = r.data.products.items[0].slug;
r = await gql('mutation($id:ID!){ addToCart(productId:$id){ totalCount } }', { id: pid0 }, token || (await gql('mutation{ login(input:{email:"demo@example.com", password:"Demo12345!"}){ accessToken } }')).data.login.accessToken);
ok('out-of-stock product rejected in cart', !!r.errors, r.errors?.[0]?.message);
r = await gql('query($s:String!){ product(slug:$s){ id } }', { s: 'nope' });
ok('product 404 error', !!r.errors, r.errors?.[0]?.message + ' code=' + r.errors?.[0]?.extensions?.code);
r = await gql('query($id:ID!){ reviews(productId:$id){ rating text authorName createdAt } }', { id: pid });
ok('reviews query', Array.isArray(r.data?.reviews), 'n=' + r.data?.reviews?.length);

r = await gql('{ cart { totalPrice } }');
ok('cart w/o auth rejected', !!r.errors, r.errors?.[0]?.message + ' code=' + r.errors?.[0]?.extensions?.code);

r = await gql('mutation{ login(input:{email:"demo@example.com", password:"wrong"}){ accessToken } }');
ok('login wrong pass', !!r.errors, r.errors?.[0]?.message);
r = await gql('mutation{ login(input:{email:"Demo@Example.com", password:"Demo12345!"}){ accessToken user{ id email firstName } } }');
ok('login demo (case-insens. email)', !!r.data?.login?.accessToken, r.data?.login?.user?.email);
token = r.data.login.accessToken;

r = await gql('{ me { email firstName lastName phone address } }');
ok('me', r.data?.me?.email === 'demo@example.com', JSON.stringify(r.data?.me));
r = await gql('{ me { passwordHash } }');
ok('passwordHash not exposed', !!r.errors, r.errors?.[0]?.message?.slice(0, 60));

r = await gql('{ cart { totalCount totalPrice totalDiscount items{ id quantity lineTotal product{ title price category{ name } } } } }');
ok('seeded cart', r.data?.cart?.items?.length === 2, JSON.stringify({ c: r.data?.cart?.totalCount, p: r.data?.cart?.totalPrice, d: r.data?.cart?.totalDiscount }) + (r.errors ? JSON.stringify(r.errors) : ''));

r = await gql('mutation($id:ID!){ addToCart(productId:$id, quantity:2){ totalCount items{ quantity product{ id } } } }', { id: pid });
ok('addToCart', !!r.data?.addToCart, 'totalCount=' + r.data?.addToCart?.totalCount + (r.errors ? JSON.stringify(r.errors) : ''));
r = await gql('mutation($id:ID!){ setCartItemQuantity(productId:$id, quantity:1){ totalCount } }', { id: pid });
ok('setCartItemQuantity', r.data?.setCartItemQuantity?.totalCount === 4, 'totalCount=' + r.data?.setCartItemQuantity?.totalCount);
r = await gql('mutation($id:ID!){ setCartItemQuantity(productId:$id, quantity:0){ totalCount items{id} } }', { id: pid });
ok('setCartItemQuantity 0 removes', r.data?.setCartItemQuantity?.items?.length === 2);

r = await gql('{ favoriteIds favorites{ title } }');
ok('favorites seeded', r.data?.favorites?.length === 4 && r.data.favoriteIds.length === 4);
r = await gql('mutation($id:ID!){ toggleFavorite(productId:$id) }', { id: pid });
const on = r.data?.toggleFavorite;
r = await gql('mutation($id:ID!){ toggleFavorite(productId:$id) }', { id: pid });
ok('toggleFavorite on/off', on === true && r.data?.toggleFavorite === false);

r = await gql('mutation($id:ID!){ createReview(input:{productId:$id, rating:5, text:"Отличная вещь!"}){ id authorName rating } }', { id: pid });
ok('createReview', r.data?.createReview?.authorName === 'Демо П.', JSON.stringify(r.data?.createReview) + (r.errors ? JSON.stringify(r.errors) : ''));
r = await gql('mutation($id:ID!){ createReview(input:{productId:$id, rating:4, text:"Ещё раз"}){ id } }', { id: pid });
ok('duplicate review rejected', !!r.errors, r.errors?.[0]?.message);
r = await gql('mutation($id:ID!){ createReview(input:{productId:$id, rating:9, text:"x"}){ id } }', { id: pid });
ok('review validation message', !!r.errors, r.errors?.[0]?.message);
r = await gql('query($s:String!){ product(slug:$s){ rating reviewsCount } }', { s: slugIn });
ok('product rating recalculated', r.data?.product?.reviewsCount >= 1, JSON.stringify(r.data?.product));

r = await gql('mutation{ createOrder(input:{recipientName:"Демо", phone:"abc", address:"Москва", paymentMethod:CARD}){ id } }');
ok('order validation (phone)', !!r.errors, r.errors?.[0]?.message);
r = await gql('mutation{ createOrder(input:{recipientName:"Демо Пользователь", phone:"+7 900 000-00-00", address:"Москва, Тверская 1", paymentMethod:CARD, comment:"Позвонить"}){ id number status totalPrice paymentMethod items{ title quantity price lineTotal productSlug } } }');
ok('createOrder', r.data?.createOrder?.status === 'NEW' && r.data.createOrder.items.length === 2, JSON.stringify({ n: r.data?.createOrder?.number, t: r.data?.createOrder?.totalPrice, s: r.data?.createOrder?.status }) + (r.errors ? JSON.stringify(r.errors) : ''));
const oid = r.data.createOrder.id;
r = await gql('{ cart { totalCount } }');
ok('cart emptied after order', r.data?.cart?.totalCount === 0);
r = await gql('mutation($id:ID!){ payOrder(id:$id){ status } }', { id: oid });
ok('payOrder', r.data?.payOrder?.status === 'PAID');
r = await gql('mutation($id:ID!){ cancelOrder(id:$id){ status } }', { id: oid });
ok('cancelOrder', r.data?.cancelOrder?.status === 'CANCELLED');
r = await gql('mutation($id:ID!){ cancelOrder(id:$id){ status } }', { id: oid });
ok('cancel twice rejected', !!r.errors, r.errors?.[0]?.message);
r = await gql('{ orders { number status totalPrice createdAt items{ title } } }');
ok('orders list (3 seeded + 1)', r.data?.orders?.length === 4, r.data?.orders?.map(o => `#${o.number}:${o.status}`).join(' '));
r = await gql('query($id:ID!){ order(id:$id){ number } }', { id: oid });
ok('order by id', !!r.data?.order?.number);

r = await gql('mutation{ updateProfile(input:{phone:"+7 999 111-22-33", address:""}){ phone address } }');
ok('updateProfile', r.data?.updateProfile?.phone === '+7 999 111-22-33' && r.data.updateProfile.address === null, JSON.stringify(r.data?.updateProfile));

const email = `user${Date.now()}@test.com`;
r = await gql(`mutation{ register(input:{email:"${email}", password:"short", firstName:"Иван", lastName:"Петров"}){ accessToken } }`, {}, '');
ok('register short pwd rejected', !!r.errors, r.errors?.[0]?.message);
r = await gql(`mutation{ register(input:{email:"${email}", password:"password123", firstName:"Иван", lastName:"Петров"}){ accessToken user{ email } } }`, {}, '');
ok('register', !!r.data?.register?.accessToken, r.data?.register?.user?.email);
const t2 = r.data.register.accessToken;
r = await gql(`mutation{ register(input:{email:"${email}", password:"password123", firstName:"Иван", lastName:"Петров"}){ accessToken } }`, {}, '');
ok('register duplicate rejected', !!r.errors, r.errors?.[0]?.message);
r = await gql('{ me { email } cart { totalCount } favoriteIds }', {}, t2);
ok('new user empty state', r.data?.me?.email === email && r.data.cart.totalCount === 0 && r.data.favoriteIds.length === 0);
r = await gql('{ me { email } }', {}, 'garbage.token.here');
ok('bad token rejected', !!r.errors, r.errors?.[0]?.message);
r = await gql('{ __typename }', {}, '');
ok('graphql up', r.data?.__typename === 'Query');

r = await gql('query($s:String!){ product(slug:$s){ stock } }', { s: slugIn });
ok('stock unchanged after order+cancel (restored)', r.data?.product?.stock === stock0, `${stock0} -> ${r.data?.product?.stock}`);
let limited = false;
for (let i = 0; i < 14; i++) { const x = await gql('mutation{ login(input:{email:"a@b.co", password:"x"}){ accessToken } }', {}, ''); if (/too many/i.test(JSON.stringify(x.errors ?? ''))) limited = true; }
ok('auth rate limit kicks in', limited);

console.log(failed ? `\nПровалено проверок: ${failed}` : '\nВсе проверки пройдены ✅');
