import React, { useState, useEffect } from "react";
import { calculatePrice, matchVendors } from "../services/api";
import { fetchRates, formatCurrency } from "../services/currency";
import VendorCard from "./VendorCard";
import "./PricingEstimate.css";

const TIERS = ["budget", "mid", "premium"];

const TIER_LABELS = {
  budget: "Budget",
  mid: "Mid",
  premium: "Premium",
};

const PricingEstimate = ({ tripId, groupSize, days, onProceedToBooking }) => {
  const [selectedTier, setSelectedTier] = useState("mid");
  const [pricing, setPricing] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [isLoadingVendors, setIsLoadingVendors] = useState(false);
  const [error, setError] = useState("");
  const [currency, setCurrency] = useState(
    localStorage.getItem("only2bali_currency") || "USD"
  );
  const [exchangeRates, setExchangeRates] = useState(null);

  useEffect(() => {
    const loadRates = async () => {
      const rates = await fetchRates();
      setExchangeRates(rates);
    };
    loadRates();
  }, []);

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem("only2bali_currency", newCurrency);
    window.dispatchEvent(new Event("only2bali_currency_changed"));
  };

  const fetchPricing = async (tier) => {
    setIsLoadingPrice(true);
    setError("");
    try {
      const res = await calculatePrice({
        trip_id: tripId,
        group_size: groupSize,
        price_tier: tier,
        days: days,
      });
      setPricing(res.data);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Failed to fetch pricing. Please try again.";
      setError(msg);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  const fetchVendors = async (tier) => {
    setIsLoadingVendors(true);
    try {
      const res = await matchVendors({ trip_id: tripId, price_tier: tier });
      setVendors(res.data?.vendors || res.data || []);
    } catch {
      setVendors([]);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  useEffect(() => {
    if (tripId) {
      fetchPricing(selectedTier);
      fetchVendors(selectedTier);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  const handleTierChange = (tier) => {
    setSelectedTier(tier);
    fetchPricing(tier);
    fetchVendors(tier);
  };

  const breakdown = pricing?.breakdown || pricing?.price_breakdown || null;
  const totalPerPerson = pricing?.total_per_person ?? pricing?.total ?? null;
  const grandTotal =
    pricing?.grand_total ??
    (totalPerPerson != null && groupSize
      ? totalPerPerson * groupSize
      : null);

  const rate = exchangeRates ? exchangeRates[currency] || 1 : 1;

  return (
    <div className="pe-container">
      <div className="loading-bar-container">
        <div
          className="loading-bar"
          style={{ width: isLoadingPrice ? "60%" : "100%" }}
        ></div>
      </div>

      <h2 className="pe-title">Pricing Estimate</h2>
      <p className="pe-subtitle">
        Select a tier to see estimated costs and matched vendors.
      </p>

      {/* Currency Selector */}
      <div className="pe-currency-row">
        <label htmlFor="pe-currency-select" className="pe-currency-label">Display Currency:</label>
        <select
          id="pe-currency-select"
          value={currency}
          onChange={(e) => handleCurrencyChange(e.target.value)}
          className="pe-currency-select"
        >
          <option value="USD">USD ($)</option>
          <option value="IDR">IDR (Rp)</option>
          <option value="EUR">EUR (€)</option>
          <option value="AUD">AUD (A$)</option>
          <option value="SGD">SGD (S$)</option>
          <option value="INR">INR (₹)</option>
          <option value="GBP">GBP (£)</option>
        </select>
      </div>

      {/* Tier Toggle */}
      <div className="pe-tier-group">
        {TIERS.map((tier) => (
          <button
            key={tier}
            className={`pe-tier-btn${selectedTier === tier ? " selected" : ""}`}
            onClick={() => handleTierChange(tier)}
          >
            {TIER_LABELS[tier]}
          </button>
        ))}
      </div>

      {/* Pricing Table */}
      <div className="pe-table-wrap">
        {isLoadingPrice ? (
          <div className="pe-loading">Calculating prices...</div>
        ) : pricing ? (
          <table className="pe-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Per Person</th>
                <th>Total ({groupSize || 1} pax)</th>
              </tr>
            </thead>
            <tbody>
              {breakdown ? (
                Object.entries(breakdown).map(([key, val]) => {
                  const perPerson =
                    typeof val === "object" ? val.per_person ?? val : val;
                  const total =
                    typeof val === "object"
                      ? val.total ?? perPerson * (groupSize || 1)
                      : val * (groupSize || 1);
                  return (
                    <tr key={key}>
                      <td className="pe-category">
                        {key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ")}
                      </td>
                      <td>{formatCurrency(perPerson, rate, currency)}</td>
                      <td>{formatCurrency(total, rate, currency)}</td>
                    </tr>
                  );
                })
              ) : (
                <>
                  {pricing.hotel != null && (
                    <tr>
                      <td className="pe-category">Hotel</td>
                      <td>{formatCurrency(pricing.hotel, rate, currency)}</td>
                      <td>{formatCurrency(Number(pricing.hotel) * (groupSize || 1), rate, currency)}</td>
                    </tr>
                  )}
                  {pricing.food != null && (
                    <tr>
                      <td className="pe-category">Food</td>
                      <td>{formatCurrency(pricing.food, rate, currency)}</td>
                      <td>{formatCurrency(Number(pricing.food) * (groupSize || 1), rate, currency)}</td>
                    </tr>
                  )}
                  {pricing.transport != null && (
                    <tr>
                      <td className="pe-category">Transport</td>
                      <td>{formatCurrency(pricing.transport, rate, currency)}</td>
                      <td>{formatCurrency(Number(pricing.transport) * (groupSize || 1), rate, currency)}</td>
                    </tr>
                  )}
                  {pricing.tours != null && (
                    <tr>
                      <td className="pe-category">Tours</td>
                      <td>{formatCurrency(pricing.tours, rate, currency)}</td>
                      <td>{formatCurrency(Number(pricing.tours) * (groupSize || 1), rate, currency)}</td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
            <tfoot>
              <tr className="pe-total-row">
                <td>
                  <strong>Total</strong>
                </td>
                <td>
                  {totalPerPerson != null ? (
                    <strong>{formatCurrency(totalPerPerson, rate, currency)}</strong>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  {grandTotal != null ? (
                    <strong className="pe-grand-total">
                      {formatCurrency(grandTotal, rate, currency)}
                    </strong>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            </tfoot>
          </table>
        ) : (
          !isLoadingPrice && (
            <div className="pe-no-data">
              No pricing data yet. Select a tier above.
            </div>
          )
        )}
      </div>

      {/* Vendors Section */}
      <div className="pe-vendors-section">
        <h3 className="pe-vendors-title">Matched Vendors</h3>
        {isLoadingVendors ? (
          <div className="pe-loading">Finding vendors...</div>
        ) : vendors.length > 0 ? (
          <div className="pe-vendors-grid">
            {vendors.map((vendor, idx) => (
              <VendorCard key={vendor.id || idx} vendor={vendor} />
            ))}
          </div>
        ) : (
          <p className="pe-no-vendors">
            No vendors matched for this tier yet. Our team will suggest the best
            options for you.
          </p>
        )}
      </div>

      {/* Proceed */}
      <div className="pe-proceed-section">
        <button
          className="pe-proceed-btn"
          onClick={() => onProceedToBooking(grandTotal ?? totalPerPerson ?? 0)}
          disabled={isLoadingPrice}
        >
          Proceed to Booking &rarr;
        </button>
      </div>

      {error && (
        <div className="popup-overlay">
          <div className="popup">
            <p className="error">{error}</p>
            <button onClick={() => setError("")}>OK</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingEstimate;
