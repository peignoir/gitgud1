// Quick check of what's in localStorage
console.log('=== localStorage contents ===');
Object.keys(localStorage).forEach(key => {
  console.log(`${key}:`, localStorage.getItem(key)?.substring(0, 100));
});
