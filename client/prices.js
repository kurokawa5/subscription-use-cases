// Fetch price data.
const pricesDiv = document.querySelector('#price-list');
const stripeApiKey = "sk_test_51MRAwhKhZM6vApyYxEFXDjIDxuJ8EF20XvXCaauznJi5OI8CXtAzrztJJsHx4SRtYDrgrshAY8njrdmxUBCQq8zX00h6ke6SlI";
//const stripeApiKey = "pk_test_51MRAwhKhZM6vApyY8gPUikER1zfc8j2kcAqWm4ESsu8Z4U8RodU8UbsaM4tdtTJ8WhmzytPvgU2QqLTHPfcLAODu00CAeWFTcF";
let interval = 'month';
let interval_count = 1;

const showPrices = (interval, interval_count) => {
  const email = sessionStorage.getItem('email');

fetch('/config')
  .then((response) => response.json())
  .then((data) => {
    pricesDiv.innerHTML = '';
    if(!data.prices) {
      pricesDiv.innerHTML = `
        <h3>No prices found</h3>

        <p>This sample requires two prices, one with the lookup_key sample_basic and another with the lookup_key sample_premium</p>

        <p>You can create these through the API or with the Stripe CLI using the provided seed.json fixture file with: <code>stripe fixtures seed.json</code>
      `
    }
    console.log(data);
    const lookupKeys = priceLookup[email];
    const durationPlans = data.prices.filter(price => price.recurring.interval === interval && price.recurring.interval_count === interval_count);
    const filteredPrices = durationPlans.filter(price => lookupKeys.includes(price.lookup_key));

    (async function() {
      const sortedPrices = filteredPrices.sort((a, b) => a.unit_amount - b.unit_amount);
      //const productIds = sortedPrices.map(price => price.product);

      for (const price of sortedPrices) {
        try {
          const response = await fetch(`https://api.stripe.com/v1/products/${price.product.id}`, {
            headers: {
              'Authorization': `Bearer ${stripeApiKey}`,
            },
          });
        //console.log(price);
        const product = await response.json();
        const productName = product.name || '';
        const productDescription = product.description || '';
        console.log(productName);
        pricesDiv.innerHTML += `
        <meta charset="UTF-8">
        <div class="price-box">
          <span class="price-info">
            ${productName} <br>
            ${productDescription} <br>
            <span class="price-amount">￥ ${price.unit_amount.toLocaleString()} / ${price.recurring.interval_count} ${price.recurring.interval} <br> </span>
          </span>
          <button class="price-button" onclick="createSubscription('${price.id}')">Select</button>
        </div>
      `;
    }catch(error) {
        console.error('Error:', error);
      }
    }
    })();
  });
};

/*
    const sortedPrices = data.prices.sort((a, b) => a.unit_amount - b.unit_amount);
    const productIds = sortedPrices.map(price => price.product);


    //let sortedPrices = data.prices.sort((a, b) => a.unit_amount - b.unit_amount);
    console.log("sort後", sortedPrices);
    console.log("sort後", productIds);
    //console.log("sort後", data.prices.product.name);

    sortedPrices.forEach((price) => { //追記2（ここから）
      fetch(`https://api.stripe.com/v1/products/${price.product.id}`, {
        headers: {
          'Authorization': `Bearer ${stripeApiKey}`,
        },
      })
      .then((response) => response.json())
      .then((product) => {
        console.log(price.product)
        //追記（ここから）
        let productName = '';
        if (price.product) {
        productName = product.name;}
        //追記（ここから）
        let productDescription = '';
        if (price.product) {
        productDescription = product.description;}
      //console.log(product)
      //追記（ここまで）
      pricesDiv.innerHTML += `
      <meta charset="UTF-8">
        <div class="price-box">
          <span class="price-info">
            ${productName} <br>
            ${productDescription} <br>
            <span class="price-amount">￥ ${price.unit_amount.toLocaleString()} / ${price.recurring.interval} <br> </span>

          </span>
          <button class="price-button" onclick="createSubscription('${price.id}')">Select</button>
        </div>
      `;
    })
    // 追記2（ここまで）
  })
  .catch((error) => {
    console.error('Error:', error);
  });
});
*/

const createSubscription = (priceId) => {
  return fetch('/create-subscription', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId: priceId,
    }),
  })
    .then((response) => response.json())
    .then((data) => {
      window.sessionStorage.setItem('subscriptionId', data.subscriptionId);
      window.sessionStorage.setItem('clientSecret', data.clientSecret);
      window.sessionStorage.setItem('selectedPriceId', priceId);
      window.location.href = '/subscribe.html';
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  }

window.onload = function() {
    showPrices(interval, interval_count);
};

const priceLookup = {
  'test@example.com': ["entry_plan", "ec_plan_onemonth", "sns_plan_onemonth", "ec_sns_plan_onemonth", "community_plan_onemonth", "ec_sns_community_plan_onemonth",
  "entry_plan_sixmonth", "ec_plan_sixmonth", "sns_plan_sixmonth", "ec_sns_plan_sixmonth", "community_plan_sixmonth", "ec_sns_community_plan_sixmonth",
  "entry_plan_oneyear", "ec_plan_oneyear", "sns_plan_oneyear", "ec_sns_plan_oneyear", "community_plan_oneyear", "ec_sns_community_plan_oneyear"],

  'test2@example.com': ["entry_plan", "ec_plan_onemonth", "sns_plan_onemonth",
  "entry_plan_sixmonth", "ec_plan_sixmonth", "sns_plan_sixmonth",
  "entry_plan_oneyear", "ec_plan_oneyear", "sns_plan_oneyear"],
  // 他のメールアドレスに対する料金プランをここに追加する
};