# D365 License Optimizer

**Describe your team. Get the cheapest legitimate Microsoft Dynamics 365 license mix. Free, no sign-up, runs entirely in your browser.**

Live demo: **[barancevik.github.io/Dynamics365LicenseOptimizer](https://barancevik.github.io/Dynamics365LicenseOptimizer/)**

---

## A quick look

**See the cost of getting it wrong before anything else.** The homepage leads with the number nobody shows you: what a full-license-for-everyone approach overpays per year.

![Homepage: the cost of getting licensing wrong, shown first](docs/screen-home.jpg)

**Describe your team, read the receipt.** Groups on the left, an audited breakdown on the right: line-by-line costs, the comparison scenario, and a compliance panel explaining every rule that fired.

![Calculator: user groups on the left, audited receipt with compliance checks on the right](docs/screen-calculator.jpg)

**The rules, in plain language.** Every license with its price, its fit and its restrictions, plus the four rules that explain most invoices.

![License guide: packages, restrictions and the logic behind them](docs/screen-guide.jpg)

**Independent by design.** No affiliation, no sales team, no data collection. Just an open tool that says what it knows and what it doesn't.

![About page: why this tool exists](docs/screen-why.jpg)

---

## The problem

Dynamics 365 licensing is decided by a 60-plus page guide that almost nobody reads end to end. Base and attach relationships, Team Member restrictions, the Professional and Enterprise mixing ban, tier rules that apply environment-wide rather than per person. The rules are real, they are enforced, and they are scattered.

The result is predictable. Companies buy full licenses for users who only read reports and approve records, and quietly overpay every month. Or they buy the cheap license for the wrong user and hit an access wall, because Microsoft enforces these restrictions technically, not on trust. Since November 2025, license assignment has been tightening across the platform, so "nobody checks anyway" is no longer a strategy.

A 33-user company in our sample scenario overpays about £14,000 a year just by giving everyone a full license. Most of them never find out, because nobody ever showed them the other number.

## The solution

D365 License Optimizer turns the licensing guide into a calculator. You describe your team as groups: how many people, which apps they need, whether they run processes or mostly read and approve. The rules engine does the rest:

- Picks the most expensive app as the **base** and converts the others to **attach** licenses
- Checks **Team Member** eligibility against usage depth and custom app criteria
- Enforces the **Professional / Enterprise mixing ban** across the whole environment, the rule that most often slips through budget planning
- Puts the result next to the "full license for everyone" scenario, so the first thing you see is what getting it wrong costs

Every recommendation comes with its reasoning. The green compatibility panel inside the receipt lists every rule that was applied, confirms valid combinations and flags invalid ones with the reason. The surprise shows up on your screen, not on your invoice.

## Why this is different

There are other Dynamics 365 calculators out there. Two things separate this one.

**It optimizes, it doesn't just add up.** Most calculators on partner websites are sum machines: pick licenses, multiply by users, see a total, then hand over your email address so a sales team can call you. This tool answers a harder question: given the rules, what is the cheapest combination that is actually compliant? That answer requires the rules to live in the code, and here they do.

**It has no agenda.** No sign-up, no email gate, no lead form, no sales team. It runs entirely client-side, so nothing you enter ever leaves your browser. The pricing data and the rule set are public in this repo, every price carries a verification date, and anyone can submit a correction. When the rules are genuinely ambiguous (multiplexing, dual-write, ISV licensing), the tool says so and points you to your partner instead of guessing. A tool you can trust starts with a tool that can say what it doesn't know.

## Built UK-first

GBP is the default currency, using Microsoft's official United Kingdom list prices, not a currency conversion. A one-click toggle in the header and footer switches the entire site to USD, and `?currency=usd` makes the choice shareable as a link. UK consultants quoting in pounds and global teams thinking in dollars both get real numbers.

## Who it's for

- **D365 consultants and CSP partners** running pre-sales numbers, who currently do this math by hand for every quote
- **IT managers** with a renewal on the horizon, who need to walk into the negotiation knowing what the right answer looks like
- **Finance teams and CFOs** asking "are we paying the right amount" and getting shrugs

## Scope

**V1 covers:** Dynamics 365 Sales, Customer Service, Field Service, Team Member, base/attach logic, GBP and USD list prices.

**Deliberately out of scope:** multiplexing edge cases, dual-write licensing, ISV solution requirements. These are genuine gray areas in Microsoft's documentation. The tool marks them openly on the License Guide page rather than producing confident nonsense.

## Project structure

```
d365-license-optimizer/
├── index.html            App shell and all page content
├── css/
│   └── styles.css        All styling (Fluent-inspired, Segoe UI Variable)
├── js/
│   ├── pricing-data.js   Single source of truth for prices and rules
│   └── app.js            Navigation, group editor, rules engine, currency switch
├── data/
│   └── pricing.json      Public JSON mirror of the pricing data
├── assets/
│   └── img/              Photos used across the site
└── LICENSE
```

No build step, no dependencies, no backend. Clone it, open `index.html`, it works.

## Keeping prices current

All prices live in `js/pricing-data.js`, mirrored in `data/pricing.json`. The data is checked against Microsoft's official pricing pages monthly, and each currency carries its own verification date. Spot a change before I do? PRs are welcome and go live the same day they are approved.

## Disclaimer

This tool is for information and early-stage planning only. Results are estimates, not an official quote, licensing advice or legal opinion. Microsoft's rules and prices can change without notice. Confirm final decisions against the current Microsoft Licensing Guide and with your Microsoft partner. This is an independent project with no affiliation to Microsoft.

## Author

Built by **Baran Çevik**, Dynamics 365 Developer & Multichannel Ecommerce Operations.
[LinkedIn](https://www.linkedin.com/in/baran-%C3%A7evik-463a0014b/)

## License

MIT. See [LICENSE](LICENSE).
