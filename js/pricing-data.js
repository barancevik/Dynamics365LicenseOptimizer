/* ============================================================
   D365 License Optimizer - Pricing data
   ------------------------------------------------------------
   Single source of truth for every price the calculator uses.
   A JSON mirror lives in /data/pricing.json.

   UK-first: GBP is the default currency. USD is one click away.

   GBP prices are Microsoft's official United Kingdom list
   prices (annual commitment, excluding VAT), not a currency
   conversion. Sales Professional and Sales Enterprise were
   read directly from microsoft.com/en-gb; the remaining GBP
   values are corroborated by UK partner price lists and should
   be re-verified against the official en-gb pages before each
   release.
   ============================================================ */

const PRICING = {
  meta: {
    priceType: "list",
    source: "Microsoft Dynamics 365 Licensing Guide + microsoft.com regional pricing pages"
  },

  currencies: {
    gbp: {
      code: "GBP",
      symbol: "\u00A3",
      locale: "en-GB",
      label: "UK",
      badge: "Currency: GBP, UK list price (ex VAT)",
      verified: null
    },
    usd: {
      code: "USD",
      symbol: "$",
      locale: "en-US",
      label: "Global",
      badge: "Currency: USD, global list price",
      verified: null
    }
  },

  defaultCurrency: "gbp",

  apps: {
    sales: {
      name: "Sales",
      pro: { label: "Sales Professional", price: { usd: 65, gbp: 50.00 } },
      ent: { label: "Sales Enterprise", price: { usd: 105, gbp: 80.70 } }
    },
    cs: {
      name: "Customer Service",
      pro: { label: "Customer Service Professional", price: { usd: 50, gbp: 38.40 } },
      ent: { label: "Customer Service Enterprise", price: { usd: 105, gbp: 80.70 } }
    },
    fs: {
      name: "Field Service",
      ent: { label: "Field Service", price: { usd: 105, gbp: 80.70 } }
    }
  },

  teamMemberPrice: { usd: 8, gbp: 6.20 },
  attachPrice: { usd: 20, gbp: 15.40 },

  /* Notes shown on the Pricing Data page (amounts are injected per currency) */
  priceRowNotes: {
    salesPro: "Can't be mixed with Enterprise in the same environment",
    salesEnt: "Qualifying base for attach licenses",
    csPro: "Can't be mixed with Enterprise in the same environment",
    csEnt: "Qualifying base for attach licenses",
    fs: "Single tier",
    tm: "No custom app access, 15-entity limit",
    attach: "Only on top of a qualifying base"
  }
};
