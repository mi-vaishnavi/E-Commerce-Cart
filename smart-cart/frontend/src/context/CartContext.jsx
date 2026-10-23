import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import { useToast } from './ToastContext';
import { formatMoney } from '../utils/format';

const CartContext = createContext(null);
const EMPTY_CART = { items: [], itemCount: 0, subtotal: 0 };
const EMPTY_RECOMMENDATION = { recommendation: null, options: [], hint: null };

export function CartProvider({ children }) {
  const toast = useToast();
  const [cart, setCart] = useState(EMPTY_CART);
  const [cartLoading, setCartLoading] = useState(true);
  const [cartError, setCartError] = useState(null);
  const [busy, setBusy] = useState(false);

  // appliedCode is the customer's choice; preview/recommendation always come from the server.
  const [appliedCode, setAppliedCode] = useState(null);
  const [preview, setPreview] = useState(null);
  const [assistant, setAssistant] = useState(EMPTY_RECOMMENDATION);
  const [pricingLoading, setPricingLoading] = useState(false);
  const requestId = useRef(0);

  const loadCart = useCallback(async () => {
    try {
      const { cart: fresh } = await api.getCart();
      setCart(fresh);
      setCartError(null);
    } catch (e) {
      setCartError(e.message);
    } finally {
      setCartLoading(false);
    }
  }, []);

  useEffect(() => { loadCart(); }, [loadCart]);

  // Recalculate authoritative totals + recommendation whenever the cart or applied coupon changes.
  useEffect(() => {
    const id = ++requestId.current;
    if (cart.items.length === 0) {
      setPreview(null);
      setAssistant(EMPTY_RECOMMENDATION);
      setPricingLoading(false);
      if (appliedCode) setAppliedCode(null);
      return;
    }
    setPricingLoading(true);
    (async () => {
      try {
        const [prev, rec] = await Promise.all([
          api.previewCheckout({ couponCode: appliedCode }),
          api.recommendCoupon({ appliedCode }),
        ]);
        if (id !== requestId.current) return; // a newer request superseded this one
        setPreview(prev.breakdown);
        setAssistant(rec);
      } catch (e) {
        if (id !== requestId.current) return;
        if (appliedCode && e.code?.startsWith('COUPON_')) {
          toast.info(`${appliedCode} was removed: ${e.message}`);
          setAppliedCode(null); // effect re-runs without the coupon
          return;
        }
        toast.error(e.message);
      } finally {
        if (id === requestId.current) setPricingLoading(false);
      }
    })();
  }, [cart, appliedCode, toast]);

  const run = useCallback(async (action, successMessage) => {
    setBusy(true);
    try {
      const { cart: next } = await action();
      setCart(next);
      if (successMessage) toast.success(successMessage);
      return true;
    } catch (e) {
      toast.error(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }, [toast]);

  const addItem = useCallback((product, quantity = 1) =>
    run(() => api.addItem({ productId: product.id, quantity }), `${product.name} added to cart`), [run]);
  const updateQuantity = useCallback((productId, quantity) =>
    run(() => api.updateItem(productId, quantity)), [run]);
  const removeItem = useCallback((item) =>
    run(() => api.removeItem(item.productId), `${item.name} removed`), [run]);

  const applyCoupon = useCallback(async (code) => {
    try {
      const result = await api.validateCoupon({ code, appliedCode });
      setAppliedCode(result.coupon.code);
      toast.success(`${result.coupon.code} applied. You save ${formatMoney(result.discountAmount)}.`);
      return { ok: true };
    } catch (e) {
      toast.error(e.message);
      return { ok: false, message: e.message };
    }
  }, [appliedCode, toast]);

  const removeCoupon = useCallback(() => {
    setAppliedCode(null);
    toast.info('Coupon removed');
  }, [toast]);

  const resetAfterOrder = useCallback(() => {
    setCart(EMPTY_CART);
    setAppliedCode(null);
  }, []);

  const value = useMemo(() => ({
    cart, cartLoading, cartError, busy, appliedCode, preview, assistant, pricingLoading,
    addItem, updateQuantity, removeItem, applyCoupon, removeCoupon, resetAfterOrder, reloadCart: loadCart,
  }), [cart, cartLoading, cartError, busy, appliedCode, preview, assistant, pricingLoading,
    addItem, updateQuantity, removeItem, applyCoupon, removeCoupon, resetAfterOrder, loadCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
