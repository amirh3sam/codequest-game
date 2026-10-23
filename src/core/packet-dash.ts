export type PacketDashPickupState = {
  collected: number;
  combo: number;
  bonus: number;
  shields: number;
};

/** Every third data bit gives a 100-point bonus and recharges one arcade shield. */
export function collectPacketDashBit(state: PacketDashPickupState): PacketDashPickupState {
  const combo = state.combo + 1;
  if (combo < 3) return { ...state, collected: state.collected + 1, combo };
  return {
    collected: state.collected + 1,
    combo: 0,
    bonus: state.bonus + 100,
    shields: Math.min(3, state.shields + 1),
  };
}
