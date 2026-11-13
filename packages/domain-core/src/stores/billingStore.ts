import { create } from 'zustand';
import type { Billing, MeterReading, PaymentRecord, BillingStatus } from '@qlnt/shared-types';
import { db } from '../db/appDatabase';
import { generateUUID } from '../business/auditLogRecorder';

export interface BillingState {
  billings: Billing[];
  meterReadings: MeterReading[];
  paymentRecords: PaymentRecord[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBillingsByRoom: (roomId: string) => Promise<void>;
  updateBillingStatus: (billingId: string, status: BillingStatus) => Promise<void>;
  verifyPayment: (params: {
    billingId: string;
    roomId: string;
    landlordId: string;
    amountPaid: number;
    paymentMethod: 'BANK_TRANSFER_MANUAL' | 'VIETQR_AUTO' | 'CASH';
    verifiedBy: string;
    note?: string;
  }) => Promise<void>;
}

export const useBillingStore = create<BillingState>((set, get) => ({
  billings: [],
  meterReadings: [],
  paymentRecords: [],
  isLoading: false,
  error: null,

  fetchBillingsByRoom: async (roomId: string) => {
    set({ isLoading: true, error: null });
    try {
      const [billings, meterReadings, paymentRecords] = await Promise.all([
        db.billings.where('room_id').equals(roomId).toArray(),
        db.meter_readings.where('room_id').equals(roomId).toArray(),
        db.payment_records.where('room_id').equals(roomId).toArray(),
      ]);
      set({ billings, meterReadings, paymentRecords, isLoading: false });
    } catch (err: unknown) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  updateBillingStatus: async (billingId: string, status: BillingStatus) => {
    const now = new Date().toISOString();
    await db.billings.update(billingId, { status, updated_at: now });
    const current = get().billings;
    set({
      billings: current.map((b) => (b.id === billingId ? { ...b, status, updated_at: now } : b)),
    });
  },

  verifyPayment: async (params) => {
    const paymentId = generateUUID();
    const now = new Date().toISOString();

    const record: PaymentRecord = {
      id: paymentId,
      landlord_id: params.landlordId,
      billing_id: params.billingId,
      room_id: params.roomId,
      amount_paid: params.amountPaid,
      payment_method: params.paymentMethod,
      payment_date: now,
      verified_by: params.verifiedBy,
      note: params.note,
      created_at: now,
    };

    await db.transaction('rw', db.payment_records, db.billings, async () => {
      await db.payment_records.add(record);
      await db.billings.update(params.billingId, { status: 'PAID', updated_at: now });
    });

    const currentRecords = get().paymentRecords;
    const currentBillings = get().billings;
    set({
      paymentRecords: [record, ...currentRecords],
      billings: currentBillings.map((b) =>
        b.id === params.billingId ? { ...b, status: 'PAID', updated_at: now } : b
      ),
    });
  },
}));
