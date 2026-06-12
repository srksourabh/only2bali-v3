import React, { useState, useEffect, useRef } from "react";
import { createBooking } from "../services/api";
import { fetchRates, formatCurrency } from "../services/currency";
import "./BookingForm.css";

const BookingForm = ({ tripId, itineraryId, totalPrice, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef(null);

  const [currency] = useState(
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formRef.current.checkValidity()) {
      formRef.current.reportValidity();
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await createBooking({
        trip_id: tripId,
        itinerary_id: itineraryId || null,
        email,
        special_requests: specialRequests || null,
        total_price: totalPrice,
      });

      const ref =
        res.data?.confirmation_ref ||
        res.data?.booking_ref ||
        res.data?.reference ||
        `OB-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

      onSuccess(ref);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Booking failed. Please try again.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bf-container">
      <div className="loading-bar-container">
        <div className="loading-bar" style={{ width: "90%" }}></div>
      </div>

      <div className="bf-card">
        <h2 className="bf-title">Confirm Your Booking</h2>

        {/* Trip summary strip */}
        <div className="bf-summary-strip">
          <div className="bf-summary-item">
            <span className="bf-summary-label">Trip ID</span>
            <span className="bf-summary-value">{tripId || "—"}</span>
          </div>
          {totalPrice != null && (
            <div className="bf-summary-item">
              <span className="bf-summary-label">Total Price</span>
              <span className="bf-summary-value bf-price">
                {currency !== "USD" && exchangeRates ? (
                  <>
                    <span>{formatCurrency(totalPrice, exchangeRates[currency] || 1, currency)}</span>
                    <span className="bf-price-usd-sub">
                      (equiv. ${Number(totalPrice).toFixed(0)} USD)
                    </span>
                  </>
                ) : (
                  `$${Number(totalPrice).toFixed(0)}`
                )}
              </span>
            </div>
          )}
        </div>

        <form ref={formRef} onSubmit={handleSubmit} noValidate className="bf-form">
          <div className="bf-field">
            <label htmlFor="bf-email">Contact Email</label>
            <input
              id="bf-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="bf-field">
            <label htmlFor="bf-requests">
              Special Requests{" "}
              <span className="bf-optional">(optional)</span>
            </label>
            <textarea
              id="bf-requests"
              placeholder="Any dietary requirements, accessibility needs, or special notes..."
              rows={4}
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
            />
          </div>

          <button type="submit" className="bf-submit-btn" disabled={isLoading}>
            {isLoading ? (
              <span className="bf-btn-loading">
                <span className="bf-spinner"></span> Confirming...
              </span>
            ) : (
              "Confirm Booking"
            )}
          </button>
        </form>
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

export default BookingForm;
