"use client";

import { useState } from "react";
import type { Dictionary } from "@/lib/i18n";

type Protocol = "jain" | "veg" | "vegan";
type Rating = "green" | "amber" | "red";

const ICON: Record<Rating, React.ReactNode> = {
  green: <path d="M20 6 9 17l-5-5" />,
  amber: (
    <>
      <path d="M12 8v5" />
      <path d="M12 17h.01" />
    </>
  ),
  red: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
};

/**
 * The compliance rating is the product's core logic, so it is shown working
 * rather than described. Switching protocol re-rates the same day: on Jain the
 * shared-kitchen warung is not quietly downgraded, it is substituted out.
 */
export default function GuaranteeDemo({ dict }: { dict: Dictionary }) {
  const [protocol, setProtocol] = useState<Protocol>("jain");
  const g = dict.guarantee;
  const data = g[protocol];

  const ratings: Record<Protocol, Rating[]> = {
    jain: ["green", "green", "red"],
    veg: ["green", "green", "amber"],
    vegan: ["green", "green", "green"],
  };

  const labelFor = (r: Rating) =>
    r === "green" ? g.ratingLabel.dedicated : r === "amber" ? g.ratingLabel.shared : g.ratingLabel.substituted;

  const rows = [
    { when: g.meals.breakfast, ...data.breakfast, rating: ratings[protocol][0] },
    { when: g.meals.lunch, ...data.lunch, rating: ratings[protocol][1] },
    { when: g.meals.dinner, ...data.dinner, rating: ratings[protocol][2] },
  ];

  return (
    <div className="gwrap">
      <div>
        <div className="switch" role="group" aria-label={g.heading}>
          {(["jain", "veg", "vegan"] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={protocol === p}
              onClick={() => setProtocol(p)}
            >
              {g.protocols[p]}
            </button>
          ))}
        </div>

        <p className="gnote" dangerouslySetInnerHTML={{ __html: data.note }} />

        <div className="glegend">
          <span><i className="dot dot-green" />{g.legend.green}</span>
          <span><i className="dot dot-amber" />{g.legend.amber}</span>
          <span><i className="dot dot-red" />{g.legend.red}</span>
        </div>
      </div>

      <div className="daycard">
        <header>
          <h4>{g.dayTitle}</h4>
          <span>{g.protocolLabel[protocol]}</span>
        </header>

        {rows.map((row) => (
          <div className="meal" key={row.when}>
            <div className="when">{row.when}</div>
            <div className="what">
              <b>{row.what}</b>
              <em>{row.note}</em>
            </div>
            <span className={`pill ${row.rating}`}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                   strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {ICON[row.rating]}
              </svg>
              {labelFor(row.rating)}
            </span>
          </div>
        ))}

        <footer>{data.foot}</footer>
      </div>
    </div>
  );
}
