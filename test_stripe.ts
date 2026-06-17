import Stripe from "stripe";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";

if (!stripeSecret) {
  console.log("❌ STRIPE_SECRET_KEY is missing in .env.local");
  process.exit(1);
}

const stripe = new Stripe(stripeSecret, {
  apiVersion: "2024-06-20", // or whatever the latest supported version is
});

async function testStripe() {
  try {
    console.log("Testing Stripe API Connection...");
    // Just fetch the account info to see if the key is valid
    const account = await stripe.accounts.retrieve();
    console.log("✅ Stripe Account Authenticated!");
    console.log(`Account ID: ${account.id}`);
    console.log(`Business Name: ${account.business_profile?.name || "N/A"}`);
    console.log(`Country: ${account.country}`);

    // Test creating a checkout session
    console.log("\\nTesting Checkout Session Creation...");
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Zyeute Test Pack",
            },
            unit_amount: 100, // $1.00
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "http://localhost:5173/success",
      cancel_url: "http://localhost:5173/cancel",
    });

    console.log("✅ Checkout Session Created Successfully!");
    console.log(`Session ID: ${session.id}`);
    console.log(`Checkout URL: ${session.url}`);

  } catch (error: any) {
    console.error("❌ Stripe Test Failed:", error.message);
  }
}

testStripe();
