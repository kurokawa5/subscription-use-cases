//const stripeApiKey = "pk_test_51MRAwhKhZM6vApyY8gPUikER1zfc8j2kcAqWm4ESsu8Z4U8RodU8UbsaM4tdtTJ8WhmzytPvgU2QqLTHPfcLAODu00CAeWFTcF";
const stripeApiKey = "sk_test_51MRAwhKhZM6vApyYxEFXDjIDxuJ8EF20XvXCaauznJi5OI8CXtAzrztJJsHx4SRtYDrgrshAY8njrdmxUBCQq8zX00h6ke6SlI";
const applyCouponButton = document.querySelector('#apply-coupon');
const couponInput = document.querySelector('#coupon');

// helper method for displaying a status message.
const setMessage = (message) => {
  const messageDiv = document.querySelector('#messages');
  messageDiv.innerHTML += "<br>" + message;
}
//（工事中ここから）
/*
// Counpon
applyCouponButton.addEventListener('click', () => {
  const promotion_couponCode = couponInput.value;
  console.log(promotion_couponCode);
  fetch(`https://api.stripe.com/v1/promotion_codes`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${stripeApiKey}`
    }
  })
  .then(response => response.json())
  .then(data => {
    console.log(data);
    // プロモーションコードの情報を処理するコードをここに書く
    const promotionCode = data.data.find(item => item.code === promotion_couponCode);
    console.log(promotionCode);

    fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Bearer ${stripeApiKey}`
      },
      body: new URLSearchParams({
        items: [{
          id: 'priceId',
          price: priceId,
        }],
        coupon: 'NAVI2023', // 適用するクーポンコード
      }),
    })
    .then(response => response.json())
    .then(subscription => {
      console.log(subscription);
      const newPriceId = subscription.items.data[0].price.id; // 新しい価格IDを取得する
      console.log(newPriceId);
      // 新しい価格IDを使用してサブスクリプションを更新する
      // ...
    })
    .catch(error => console.error(error));
  })
  .catch(error => console.error(error));
});
*/
//（工事中ここまで）

// Fetch public key and initialize Stripe.
let stripe, cardElement;
const selectedPriceId = window.sessionStorage.getItem('selectedPriceId');
console.log("selectedPriceId", selectedPriceId);

fetch('/config')
  .then((resp) => resp.json())
  .then((resp) => {
    stripe = Stripe(resp.publishableKey);

    const elements = stripe.elements();
    cardElement = elements.create('card');
    cardElement.mount('#card-element');

    const selectedPrice = resp.prices.filter((price) => price.id === selectedPriceId)[0];
    console.log("selectedPrice", selectedPrice);

    fetch(`https://api.stripe.com/v1/products/${selectedPrice.product.id}`, {
      headers: {
        'Authorization': `Bearer ${stripeApiKey}`,
      },
    })
    .then((response) => response.json())
    .then((product) => {
      const productName = product.name || '';
      const productDescription = product.description || '';
      const unit_amount = `￥${(selectedPrice.unit_amount / selectedPrice.recurring.interval_count).toLocaleString()} / ${selectedPrice.recurring.interval}`;

      // 確認する
      console.log("productName", productName);
      console.log("productDescription", productDescription);
      console.log("unit_amount", unit_amount);

      // HTMLに表示する
      document.querySelector('#product-name').textContent = productName;
      document.querySelector('#product-description').textContent = productDescription;
      document.querySelector('#price-amount').textContent = unit_amount;

      //(ここから)
      // Counpon
      applyCouponButton.addEventListener('click', () => {
        const promotion_couponCode = couponInput.value;
        console.log(promotion_couponCode);
        fetch(`https://api.stripe.com/v1/promotion_codes`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${stripeApiKey}`
          }
        })
        .then(response => response.json())
        .then(data => {
          // console.log(data);
          // プロモーションコードの情報を処理するコードをここに書く
          const promotionCode = data.data.find(item => item.code === promotion_couponCode);
          console.log("promotionCode", promotionCode);
          //ここから
          console.log("promotionCode.id", promotionCode.id);

          // リクエストのパラメーターを作成する
          const update_subscription_data = {
            subscriptionId: subscriptionId,//sub_1Me6eeKhZM6vApyYhVbusQjo
            selectedPrice: selectedPriceId,//price_1MYi0RKhZM6vApyYkhnsJy8L
            promotionCode: promotionCode.id,//promo_1Mc5NSKhZM6vApyY1GMnPnlx
          };
          console.log(JSON.stringify(update_subscription_data));

          // サブスクリプションを更新する
          fetch('/update-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update_subscription_data),
          })
          .then(response => response.json())
          .then(data => {
            console.log("data", data);
            console.log("data.subscription.id", data.subscription.id);
            //console.log("data.subscription.discount.coupon", data.subscription.discount.coupon);
            //console.log("data.subscription.discount.coupon.percent_off", data.subscription.discount.coupon.percent_off);

            //let discount_rate = (100.0 - data.subscription.discount.coupon.percent_off) / 100.0;
            //console.log("discount_rate", discount_rate);

            let discount_rate = 1.0;
            if (data.subscription.discount.coupon) {
              discount_rate = (100.0 - data.subscription.discount.coupon.percent_off) / 100.0;
              console.log("data.subscription.discount.coupon.percent_off", data.subscription.discount.coupon.percent_off);
              console.log("discount_rate", discount_rate);
            }
            const updated_unit_amount = `￥${((selectedPrice.unit_amount*discount_rate) / selectedPrice.recurring.interval_count).toLocaleString()} / ${selectedPrice.recurring.interval}  ( ${data.subscription.discount.coupon.percent_off}% offです)`;

            // HTMLに表示する
            document.querySelector('#product-name').textContent = productName;
            document.querySelector('#product-description').textContent = productDescription;
            document.querySelector('#price-amount').textContent = updated_unit_amount;
          })
          .catch(error => console.error(error));
        });
      });
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  });

// Extract the client secret query string argument. This is
// required to confirm the payment intent from the front-end.
const subscriptionId = window.sessionStorage.getItem('subscriptionId');
console.log("subscriptionId", subscriptionId);
const clientSecret = window.sessionStorage.getItem('clientSecret');
console.log("clientSecret", clientSecret);

// This sample only supports a Subscription with payment
// upfront. If you offer a trial on your subscription, then
// instead of confirming the subscription's latest_invoice's
// payment_intent. You'll use stripe.confirmCardSetup to confirm
// the subscription's pending_setup_intent.
// See https://stripe.com/docs/billing/subscriptions/trials

// Payment info collection and confirmation
// When the submit button is pressed, attempt to confirm the payment intent
// with the information input into the card element form.
// - handle payment errors by displaying an alert. The customer can update
//   the payment information and try again
// - Stripe Elements automatically handles next actions like 3DSecure that are required for SCA
// - Complete the subscription flow when the payment succeeds
const form = document.querySelector('#subscribe-form');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const nameInput = document.getElementById('name');

  // Create payment method and confirm payment intent.
  stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: cardElement,
      billing_details: {
        name: nameInput.value,
      },
    }
  }).then((result) => {
    if(result.error) {
      setMessage(`Payment failed: ${result.error.message}`);
    } else {
      // Redirect the customer to their account page
      setMessage('Success! Redirecting to your account.');
      window.location.href = '/account.html';
    }
  });
});
