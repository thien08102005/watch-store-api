// Check if buttons are clickable
const buttons = document.querySelectorAll('button');
console.log('Total buttons:', buttons.length);

// Check for modal overlays
const modals = document.querySelectorAll('.auth-modal');
console.log('Active modals:', modals.length);
modals.forEach((m, i) => {
  const isActive = m.classList.contains('active');
  console.log(`Modal ${i}: active=${isActive}, display=${m.style.display}`);
});

// Check z-index blocking
const bodyOverlay = document.querySelector('div.auth-modal.active');
console.log('Body blocked by overlay:', bodyOverlay ? 'YES' : 'NO');

// Test button click
const testBtn = document.querySelector('button.btn-add-cart');
if (testBtn) {
  console.log('Test button found');
  console.log('Button clickable:', testBtn.offsetParent !== null ? 'YES' : 'NO (hidden or display:none)');
}

console.log('Auth object:', typeof window.CHRONOS_AUTH !== 'undefined' ? 'EXISTS' : 'MISSING');
console.log('Script loaded:', 'YES');
