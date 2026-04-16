/* ══════════════════════════════════════
   Luminos · cart.js
   Cart System — localStorage-based
══════════════════════════════════════ */

const Cart = (() => {
  const CART_KEY = 'luminos_cart';

  function getItems() {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  }

  function saveItems(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateBadge();
  }

  function addItem(product) {
    if (!Auth.isLoggedIn()) {
      // Save intended action and redirect
      sessionStorage.setItem('luminos_redirect_after_login', window.location.href);
      window.location.href = 'login.html';
      return false;
    }
    const items = getItems();
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      items.push({ ...product, qty: 1 });
    }
    saveItems(items);
    showToast(`${product.name} added to cart!`);
    return true;
  }

  function removeItem(productId) {
    const items = getItems().filter(i => i.id !== productId);
    saveItems(items);
  }

  function updateQty(productId, qty) {
    const items = getItems();
    const item = items.find(i => i.id === productId);
    if (item) {
      if (qty <= 0) {
        removeItem(productId);
        return;
      }
      item.qty = qty;
      saveItems(items);
    }
  }

  function getTotal() {
    return getItems().reduce((sum, i) => sum + i.price * i.qty, 0);
  }

  function getCount() {
    return getItems().reduce((sum, i) => sum + i.qty, 0);
  }

  function clear() {
    localStorage.removeItem(CART_KEY);
    updateBadge();
  }

  function updateBadge() {
    const count = getCount();
    document.querySelectorAll('.cart-badge').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  function showToast(message) {
    const existing = document.querySelector('.cart-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.className = 'cart-toast';
    toast.innerHTML = `<i class="fa-solid fa-bag-shopping"></i> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  return { getItems, addItem, removeItem, updateQty, getTotal, getCount, updateBadge, clear };
})();

// Update badge on any page load
document.addEventListener('DOMContentLoaded', () => Cart.updateBadge());
