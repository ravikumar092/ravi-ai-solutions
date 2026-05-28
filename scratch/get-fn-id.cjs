const { diagnoseSupabasePublic, getProductFileUploadUrl } = require('../src/lib/products.functions.ts');
console.log('diagnoseSupabasePublic url:', diagnoseSupabasePublic.url);
console.log('getProductFileUploadUrl url:', getProductFileUploadUrl.url);

try {
  const { claimFreeProduct } = require('../src/lib/purchases.functions.ts');
  console.log('claimFreeProduct url:', claimFreeProduct.url);
} catch (e) {
  console.log('Error loading purchases.functions:', e.message);
}
