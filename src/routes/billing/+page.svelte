<script>
  import { loadStripe } from '@stripe/stripe-js';

  let stripe;
  onMount(async () => {
    stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
  });

  const checkout = async (priceId) => {
    const { error } = await stripe.redirectToCheckout({
      lineItems: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      successUrl: `${location.origin}/dashboard?success`,
      cancelUrl: location.href
    });
  };
</script>
