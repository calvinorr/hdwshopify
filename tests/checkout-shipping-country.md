# Test: Checkout Shipping Country Selector

> Verifies that shipping rates are filtered by customer's selected country (US12.5)

## URL
http://localhost:3000/checkout

## Prerequisites
- At least one item in cart
- Shipping zones configured in database

## Steps
1. Add an item to cart (navigate to a product page, add to cart)
2. Navigate to /checkout
3. Verify "Shipping Destination" section exists with country dropdown
4. Verify checkout button is disabled until country selected
5. Select "United Kingdom" from dropdown
6. Verify checkout button becomes enabled
7. Take screenshot

## Verify
- [ ] Country selector dropdown is visible
- [ ] Dropdown shows grouped countries (UK, Ireland, Europe, International)
- [ ] Button disabled state: "Select shipping destination to continue"
- [ ] After selecting country: "Proceed to Payment" button enabled
- [ ] No console errors

## Console
- Errors allowed: none
