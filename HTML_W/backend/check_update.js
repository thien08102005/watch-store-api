const loginUrl = 'http://localhost:5000/api/auth/login';
const productsUrl = 'http://localhost:5000/api/products';

(async () => {
  try {
    const loginRes = await fetch(loginUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@chronos.local', password: '123' })
    });
    const loginData = await loginRes.json();
    console.log('loginRes', loginRes.status, loginData);
    if (!loginRes.ok) return;
    const token = loginData.token;
    const productsRes = await fetch(productsUrl, { headers: { Authorization: `Bearer ${token}` } });
    const productsData = await productsRes.json();
    console.log('productsRes', productsRes.status, productsData.success, Array.isArray(productsData.data) ? productsData.data.length : 'no data');
    const product = Array.isArray(productsData.data) ? productsData.data[0] : null;
    if (!product) return;
    console.log('sample id', product._id);
    const updateRes = await fetch(`${productsUrl}/${product._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: product.name + ' TEST', brand: product.brand || 'Omega', price: product.price, category: product.category || 'Nam', stock: product.stock ?? 0, imageUrl: product.imageUrl || 'Image/test.jpg', size: product.size || '', description: product.description || '', rating: product.rating ?? 5 })
    });
    const updateData = await updateRes.json();
    console.log('updateRes', updateRes.status, updateData);
  } catch (err) {
    console.error(err);
  }
})();
