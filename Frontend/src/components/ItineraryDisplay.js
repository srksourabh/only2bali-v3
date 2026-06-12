import React, { useState, useEffect } from "react";
import { fetchRates, formatCurrency } from "../services/currency";
import "./ItineraryDisplay.css";

const ItineraryDisplay = ({ itinerary, onProceed }) => {
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

    const handleCurrencyChange = () => {
      setCurrency(localStorage.getItem("only2bali_currency") || "USD");
    };
    window.addEventListener("only2bali_currency_changed", handleCurrencyChange);
    return () => {
      window.removeEventListener("only2bali_currency_changed", handleCurrencyChange);
    };
  }, []);

  if (!itinerary) {
    return (
      <div className="itin-page">
        <div className="itin-empty">No itinerary data available.</div>
      </div>
    );
  }

  const days = itinerary.days || [];
  const totalDays = days.length || itinerary.total_days || 0;
  const title = itinerary.title || `Your ${totalDays}-Day Bali Itinerary`;

  const rate = exchangeRates ? exchangeRates[currency] || 1 : 1;

  return (
    <div className="itin-page">
      <div className="loading-bar-container">
        <div className="loading-bar" style={{ width: "85%" }}></div>
      </div>

      <div className="itin-container">
        <div className="itin-header">
          <h1 className="itin-main-title">{title}</h1>
          {itinerary.summary && (
            <p className="itin-summary">{itinerary.summary}</p>
          )}
        </div>

        <div className="itin-days-grid">
          {days.map((day, idx) => (
            <div className="itin-day-card" key={idx}>
              <div className="itin-day-header">
                <span className="itin-day-badge">Day {day.day_number || idx + 1}</span>
                {day.date && <span className="itin-day-date">{day.date}</span>}
                {day.theme && <span className="itin-day-theme">{day.theme}</span>}
              </div>

              <div className="itin-day-body">
                {/* Activities */}
                {day.activities && day.activities.length > 0 && (
                  <div className="itin-section">
                    <h4 className="itin-section-label">Activities</h4>
                    <ul className="itin-activity-list">
                      {day.activities.map((act, ai) => (
                        <li key={ai} className="itin-activity-item">
                          {typeof act === "string" ? act : act.name || act.description || JSON.stringify(act)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Meals */}
                {day.meals && (
                  <div className="itin-section">
                    <h4 className="itin-section-label">Meals</h4>
                    <div className="itin-meals-row">
                      {day.meals.breakfast && (
                        <div className="itin-meal-tag">
                          <span className="meal-icon">🌅</span>
                          <span className="meal-type">Breakfast</span>
                          <span className="meal-name">{day.meals.breakfast}</span>
                        </div>
                      )}
                      {day.meals.lunch && (
                        <div className="itin-meal-tag">
                          <span className="meal-icon">☀️</span>
                          <span className="meal-type">Lunch</span>
                          <span className="meal-name">{day.meals.lunch}</span>
                        </div>
                      )}
                      {day.meals.dinner && (
                        <div className="itin-meal-tag">
                          <span className="meal-icon">🌙</span>
                          <span className="meal-type">Dinner</span>
                          <span className="meal-name">{day.meals.dinner}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Transport */}
                {day.transport && (
                  <div className="itin-section">
                    <h4 className="itin-section-label">Transport</h4>
                    <p className="itin-transport-info">
                      {typeof day.transport === "string"
                        ? day.transport
                        : day.transport.description || day.transport.type || JSON.stringify(day.transport)}
                    </p>
                  </div>
                )}

                {/* Accommodation */}
                {day.accommodation && (
                  <div className="itin-section">
                    <h4 className="itin-section-label">Accommodation</h4>
                    <p className="itin-accommodation-info">
                      {typeof day.accommodation === "string"
                        ? day.accommodation
                        : day.accommodation.name || day.accommodation.description || JSON.stringify(day.accommodation)}
                    </p>
                  </div>
                )}

                {/* Cost */}
                {day.estimated_cost !== undefined && day.estimated_cost !== null && (
                  <div className="itin-cost-badge">
                    Est. {formatCurrency(day.estimated_cost, rate, currency)} / person
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {itinerary.total_estimated_cost && (
          <div className="itin-total-cost">
            <span>Total Estimated Cost:</span>
            <strong>{formatCurrency(itinerary.total_estimated_cost, rate, currency)} per person</strong>
          </div>
        )}

        <div className="itin-proceed-section">
          <button className="itin-proceed-btn" onClick={onProceed}>
            Get Pricing &amp; Vendors &rarr;
          </button>
        </div>
      </div>
    </div>
  );
};

export default ItineraryDisplay;
