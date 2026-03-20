# Geesun Crafts - Project Setup

## 1) UI/UX Direction Summary
- Primary visual direction: beige luxury palette, olive CTA, serif-led typography, gallery spacing.
- Competitor synthesis:
- `Artociti`: minimal framing and clean sections work well for premium art discovery.
- `BestOfBharat`: stronger emotional storytelling, founder/artisan narrative increases trust.
- `Vaaree`: filtering depth and category discoverability reduce browsing friction.
- `Vibecrafts`: simplified merchandising blocks and fast category entry.
- Risks observed across these patterns:
- Overloaded nav/category density can reduce premium feel.
- Long checkout without clear step framing drops conversion.
- Weak artist context makes products feel generic.

## 2) Implemented Structure
```txt
app/
  (store)/
    layout.tsx
    page.tsx
    shop/page.tsx
    shop/[slug]/page.tsx
    cart/page.tsx
    checkout/page.tsx
    wishlist/page.tsx
    about/page.tsx
    contact/page.tsx
    account/page.tsx
  (auth)/
    layout.tsx
    login/page.tsx
    register/page.tsx
  api/
    products/route.ts
    cart/route.ts
    users/route.ts
    orders/route.ts
    payments/create-order/route.ts
    payments/verify/route.ts
components/
  auth/
  cart/
  checkout/
  commerce/
  layout/
  product/
  providers/
  shop/
  ui/
lib/
  env.ts
  mock-data.ts
  types.ts
  utils.ts
  events/trigger-event.ts
  supabase/client.ts
  supabase/server.ts
supabase/schema.sql
```

## 3) Supabase Setup
1. Create project in Supabase.
2. Run SQL from `supabase/schema.sql`.
3. Enable Email/Password auth in Authentication settings.
4. Upload artwork images in Supabase Storage bucket (optional if replacing Unsplash).
5. Add env vars from `.env.example`.

## 4) Event-Driven + n8n-Ready Design
- Central event function: `lib/events/trigger-event.ts`
- Event types currently used:
- `order_created`
- `user_registered`
- `payment_success`
- `cart_updated`
- Logs saved to `event_logs`.
- Future automation switch:
- `ENABLE_AUTOMATION=true`
- `AUTOMATION_WEBHOOK_URL=https://<your-n8n-webhook>`

## 5) Razorpay Wiring
- Create order endpoint: `POST /api/payments/create-order`
- Verify payment endpoint: `POST /api/payments/verify`
- Set:
- `RAZORPAY_KEY`
- `RAZORPAY_SECRET`

## 6) Vercel Deployment
1. Push project to GitHub.
2. Import repository in Vercel.
3. Add environment variables from `.env.example`.
4. Keep `ENABLE_AUTOMATION=false` initially.
5. Deploy.

## 7) Next Build Steps
- Replace mock product data in `lib/mock-data.ts` with Supabase reads.
- Connect checkout payment step to Razorpay modal + verify API.
- Add admin dashboard route group for products/orders/events.
- Add coupons and artist profile detail pages.
