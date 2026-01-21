// Backend API (Node.js/Express) for Stripe Integration
// Install: npm install stripe express cors dotenv

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// Create Stripe Checkout Session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // Create this in Stripe Dashboard
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/cancel`,
      customer_email: req.body.email,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Webhook to handle subscription events
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      // Grant user Pro access in your database
      console.log('Subscription created:', session.customer);
      break;
    
    case 'customer.subscription.deleted':
      // Remove Pro access
      console.log('Subscription cancelled');
      break;
    
    case 'customer.subscription.updated':
      // Handle subscription changes
      console.log('Subscription updated');
      break;
  }

  res.json({ received: true });
});

// Check subscription status
app.get('/subscription-status/:customerId', async (req, res) => {
  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: req.params.customerId,
      status: 'active',
      limit: 1,
    });

    res.json({ 
      isPro: subscriptions.data.length > 0,
      subscription: subscriptions.data[0] 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create Customer Portal session (for managing subscription)
app.post('/create-portal-session', async (req, res) => {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: req.body.customerId,
      return_url: process.env.CLIENT_URL,
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

/* 
=== SETUP INSTRUCTIONS ===

1. Create .env file with:
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_PRICE_ID=price_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   CLIENT_URL=http://localhost:5173
   PORT=3000

2. In Stripe Dashboard (stripe.com):
   - Create a Product: "CallTrack Pro"
   - Set price: $5/month recurring
   - Copy the Price ID to STRIPE_PRICE_ID
   
3. Set up webhook:
   - Go to Developers > Webhooks in Stripe
   - Add endpoint: https://yourdomain.com/webhook
   - Select events: 
     * checkout.session.completed
     * customer.subscription.deleted
     * customer.subscription.updated
   - Copy webhook secret to STRIPE_WEBHOOK_SECRET

4. Update your frontend handleStripeCheckout function:

   const handleStripeCheckout = async () => {
     const response = await fetch('https://your-backend.com/create-checkout-session', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ 
         email: 'user@example.com' // Get from user auth
       })
     });
     const { url } = await response.json();
     window.location.href = url; // Redirect to Stripe
   };

5. After successful payment, Stripe redirects to /success
   - Store customer ID in your database
   - Set isPro = true for that user

=== DEPLOYMENT OPTIONS ===

Backend hosting:
- Vercel (serverless functions)
- Railway.app (free tier)
- Render.com (free tier)
- Heroku
- AWS Lambda

Database (to store user/subscription data):
- Supabase (free)
- Firebase (free tier)
- MongoDB Atlas (free)
- PlanetScale (free)

*/