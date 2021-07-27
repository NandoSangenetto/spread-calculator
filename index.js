const EXCHANGE_PROVIDERS = [
  {
    url: "https://api.exchangerate.host/latest",
    getExchangeRate: (response) => response.rates.BRL / response.rates.USD,
  },
  {
    url: "https://free.currconv.com/api/v7/convert?q=USD_BRL&compact=ultra&apiKey=a668c0818f1c0dd03049",
    getExchangeRate: (response) => response.USD_BRL,
  },
  {
    url: "https://api.exchangeratesapi.io/v1/latest?access_key=4b019f46eea2a6a2e9899aaab704ffd9&symbols=BRL,USD",
    getExchangeRate: (response) => response.rates.BRL / response.rates.USD,
  },
  {
    url: "https://data.fixer.io/api/latest?access_key=7cf3878762d89c7c272a381e04229106&symbols=BRL,USD",
    getExchangeRate: (response) => response.rates.BRL / response.rates.USD,
  },
  {
    url: "https://v6.exchangerate-api.com/v6/53a256e115ecb4ef94fb6b4e/latest/USD",
    getExchangeRate: (response) => response.conversion_rates.BRL,
  },
];

const tableRows = document.querySelectorAll("tbody > tr");
const salaryInputNode = document.getElementById("salary");
const calculatorFormNode = document.getElementById("calculator");
const exchangeRateNode = document.getElementById("exchange-rate");
const loadingNode = document.getElementById("loading");

const formatCurrency = ({
  currency = "USD",
  language = "en-US",
  removeDecimals = true,
  number,
}) => {
  const result = new Intl.NumberFormat(language, {
    style: "currency",
    currency,
  }).format(number);

  return removeDecimals ? result.replace(/(\.|,)[0-9]{2}$/, "") : result;
};

const fetchExchangeRate = async (attempt = 0) => {
  try {
    const exchangeResponse = await fetch(EXCHANGE_PROVIDERS[attempt].url);
    const exchangeData = await exchangeResponse.json();
    return EXCHANGE_PROVIDERS[attempt].getExchangeRate(exchangeData);
  } catch (error) {
    if (attempt < EXCHANGE_PROVIDERS.length - 1) {
      return fetchExchangeRate(attempt + 1);
    }
    alert("An error occured");
    throw new Error(error);
  }
};

calculatorFormNode.addEventListener("submit", async (event) => {
  event.preventDefault();

  loadingNode.classList.toggle("loading-hide");
  const salary = salaryInputNode.value;

  const exchangeRate = await fetchExchangeRate();
  console.log(exchangeRate);
  exchangeRateNode.innerHTML = formatCurrency({
    number: exchangeRate,
    language: "pt-BR",
    currency: "BRL",
    removeDecimals: false,
  });

  tableRows.forEach((row) => {
    const [_, spread, fee, total] = row.querySelectorAll("td");
    const realSpread =
      parseFloat(spread.textContent.replace("%", ""), 10) / 100;
    const integerFee = parseInt(fee.textContent.replace("$", ""), 10);
    const totalDiscount = (salary - integerFee * 12) * realSpread;
    const netPay = salary - totalDiscount;
    total.dataset.total = netPay;
    total.innerHTML = formatCurrency({ number: netPay });
  });

  tableRows.forEach((row) => {
    const [
      _,
      __,
      ___,
      totalNode,
      annuallySavesUSDNode,
      monthlySavesUSDNode,
      annuallySavesBRLNode,
      monthlySavesBRLNode,
    ] = row.querySelectorAll("td");
    const total = totalNode.dataset.total;
    const previousColumnsNode = tableRows[0].querySelectorAll("td");
    const previousTotal = previousColumnsNode[3].dataset.total;
    const annuallySaves = parseInt(total, 10) - parseInt(previousTotal, 10);
    annuallySavesUSDNode.innerHTML = formatCurrency({ number: annuallySaves });
    monthlySavesUSDNode.innerHTML = formatCurrency({
      number: parseInt(annuallySaves / 12, 10),
    });
    const annuallySavesBRL = parseInt(annuallySaves * exchangeRate, 10);
    annuallySavesBRLNode.innerHTML = formatCurrency({
      number: annuallySavesBRL,
      currency: "BRL",
      language: "pt-BR",
    });
    monthlySavesBRLNode.innerHTML = formatCurrency({
      number: parseInt(annuallySavesBRL / 12, 10),
      currency: "BRL",
      language: "pt-BR",
    });
  });

  loadingNode.classList.toggle("loading-hide");
  const hiddenNodes = document.querySelectorAll(".hide");
  hiddenNodes.forEach((el) => el.classList.remove("hide"));
});
