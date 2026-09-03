import { describe, expect, it } from "vitest";
import { attachPaymentsToVendors } from "./admin-desk";

describe("attachPaymentsToVendors", () => {
  it("groups traveller payments under the vendor they booked", () => {
    const desk = attachPaymentsToVendors(
      [
        {
          id: "v1",
          businessName: "Ubud Kitchen",
          verificationStatus: "verified",
          assignedTo: "dev-1",
          assignedUsername: "ravi",
        },
        {
          id: "v2",
          businessName: "Wayan Transport",
          verificationStatus: "draft",
          assignedTo: null,
          assignedUsername: null,
        },
      ],
      [
        {
          vendorId: "v1",
          bookingId: "b1",
          reference: "O2B-AAAA-BBBB",
          travellerName: "Meera Shah",
          pax: 8,
          amount: 1120000,
          currency: "INR",
          bookingStatus: "confirmed",
          paymentStatus: "captured",
          provider: "razorpay",
          capturedAt: "2026-08-24T00:00:00.000Z",
        },
        {
          vendorId: null,
          bookingId: "b2",
          reference: "O2B-CCCC-DDDD",
          travellerName: "Orphan",
          pax: 2,
          amount: 100,
          currency: "INR",
          bookingStatus: "pending_payment",
          paymentStatus: null,
          provider: null,
          capturedAt: null,
        },
      ]
    );

    expect(desk[0]?.assignedUsername).toBe("ravi");
    expect(desk[0]?.payments).toHaveLength(1);
    expect(desk[0]?.payments[0]?.travellerName).toBe("Meera Shah");
    expect(desk[0]?.payments[0]?.amount).toBe(1120000);
    expect(desk[1]?.payments).toEqual([]);
  });
});
