import { describe, expect, it } from 'vitest';
import React from 'react';
import type { FloorMapRoomDTO } from '@qlnt/shared-types';
import {
  RoomBlueprintSVG,
  StandardSingleRoomLayout,
  MezzanineRoomLayout,
  StudioApartmentLayout,
  generateRoomBlueprintSvgString,
} from '../src';
import { ROOM_STATUS_COLORS } from '../src/constants';

describe('Task 1: Room Architectural Blueprint Layouts (SVG + RoughJS)', () => {
  const baseRoom: FloorMapRoomDTO = {
    roomId: 'room-101',
    roomNumber: '101',
    status: 'RENTED',
    tenantName: 'Nguyen Van A',
    hasPaymentNotice: false,
    hasBrokenDevice: false,
  };

  it('renders correctly all 3 Vietnamese layout types: STANDARD_SINGLE, MEZZANINE, STUDIO_MINI', () => {
    const singleEl = RoomBlueprintSVG({
      room: baseRoom,
      layoutType: 'STANDARD_SINGLE',
      width: 240,
      height: 200,
    });
    expect(singleEl).toBeDefined();
    expect(singleEl.props['data-layout']).toBe('STANDARD_SINGLE');

    const mezzanineEl = RoomBlueprintSVG({
      room: baseRoom,
      layoutType: 'MEZZANINE',
      width: 240,
      height: 200,
    });
    expect(mezzanineEl).toBeDefined();
    expect(mezzanineEl.props['data-layout']).toBe('MEZZANINE');

    const studioEl = RoomBlueprintSVG({
      room: baseRoom,
      layoutType: 'STUDIO_MINI',
      width: 280,
      height: 220,
    });
    expect(studioEl).toBeDefined();
    expect(studioEl.props['data-layout']).toBe('STUDIO_MINI');
  });

  it('enforces touch target size >= 44x44px for viewBox and interactive elements', () => {
    // When small dimensions are requested, it enforces at least MIN_TOUCH_TARGET_SIZE (44)
    const el = RoomBlueprintSVG({
      room: baseRoom,
      width: 30,
      height: 20,
    });
    expect(el.props.width).toBeGreaterThanOrEqual(44);
    expect(el.props.height).toBeGreaterThanOrEqual(44);
    expect(el.props['data-touch-target']).toBe('true');
  });

  it('contains essential architectural elements for StandardSingleRoomLayout (door arc, window, bed, desk, WC)', () => {
    const svgStr = generateRoomBlueprintSvgString({
      room: baseRoom,
      layoutType: 'STANDARD_SINGLE',
      width: 300,
      height: 240,
    });
    expect(svgStr).toContain('data-element="door-arc"');
    expect(svgStr).toContain('data-element="window"');
    expect(svgStr).toContain('data-element="bed"');
    expect(svgStr).toContain('data-element="desk"');
    expect(svgStr).toContain('data-element="wc"');
    expect(svgStr).toContain('101');
  });

  it('contains essential architectural elements for MezzanineRoomLayout (stairs, kitchen, balcony, WC)', () => {
    const svgStr = generateRoomBlueprintSvgString({
      room: baseRoom,
      layoutType: 'MEZZANINE',
      width: 300,
      height: 240,
    });
    expect(svgStr).toContain('data-element="stairs"');
    expect(svgStr).toContain('data-element="kitchen"');
    expect(svgStr).toContain('data-element="balcony"');
    expect(svgStr).toContain('data-element="wc"');
  });

  it('contains essential architectural elements for StudioApartmentLayout (L-shaped kitchen, sofa, balcony-wash, bed, WC)', () => {
    const svgStr = generateRoomBlueprintSvgString({
      room: baseRoom,
      layoutType: 'STUDIO_MINI',
      width: 340,
      height: 260,
    });
    expect(svgStr).toContain('data-element="kitchen-l"');
    expect(svgStr).toContain('data-element="sofa"');
    expect(svgStr).toContain('data-element="balcony-wash"');
    expect(svgStr).toContain('data-element="bed"');
    expect(svgStr).toContain('data-element="wc"');
  });

  it('reflects the 4 room status styles and colors accurately', () => {
    const statuses = ['EMPTY', 'OCCUPIED', 'PAYMENT_DUE', 'BROKEN'] as const;

    for (const status of statuses) {
      const room: FloorMapRoomDTO = {
        ...baseRoom,
        status: status === 'EMPTY' ? 'EMPTY' : 'RENTED',
        hasPaymentNotice: status === 'PAYMENT_DUE',
        hasBrokenDevice: status === 'BROKEN',
      };

      const svgStr = generateRoomBlueprintSvgString({
        room,
        statusOverride: status,
        layoutType: 'STANDARD_SINGLE',
      });

      expect(svgStr).toContain(`data-status="${status}"`);
      const expectedBg = ROOM_STATUS_COLORS[status].bg;
      expect(svgStr.toLowerCase()).toContain(expectedBg.toLowerCase());
    }
  });

  it('shows payment notice badge and broken device badge when active', () => {
    const paymentRoom: FloorMapRoomDTO = {
      ...baseRoom,
      hasPaymentNotice: true,
      hasBrokenDevice: false,
    };
    const paymentSvg = generateRoomBlueprintSvgString({
      room: paymentRoom,
      showNoticeBadge: true,
    });
    expect(paymentSvg).toContain('data-testid="notice-badge"');
    expect(paymentSvg).toContain('qlnt-badge-payment');

    const brokenRoom: FloorMapRoomDTO = {
      ...baseRoom,
      hasPaymentNotice: false,
      hasBrokenDevice: true,
    };
    const brokenSvg = generateRoomBlueprintSvgString({
      room: brokenRoom,
      showNoticeBadge: true,
    });
    expect(brokenSvg).toContain('data-testid="notice-badge"');
    expect(brokenSvg).toContain('qlnt-badge-broken');
  });
});
