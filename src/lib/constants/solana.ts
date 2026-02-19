import { PublicKey } from '@solana/web3.js';
import { createHash } from 'expo-crypto';

export const PROGRAM_ID = new PublicKey('5AaoN6kBmNoEqTiNPaV2y1am9QrEEHwgRHneR1QNExLm');
export const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
export const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL');
export const SYSTEM_PROGRAM_ID = new PublicKey('11111111111111111111111111111111');
export const RENT_SYSVAR = new PublicKey('SysvarRent111111111111111111111111111111111');

export const USDC_DECIMALS = 6;

// PDA derivation helpers matching the Anchor program seeds in lib.rs

export function getPlatformPda(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('platform')], PROGRAM_ID);
}

export function getTournamentPda(tournamentId: number): [PublicKey, number] {
  const idBuffer = Buffer.alloc(8);
  idBuffer.writeBigUInt64LE(BigInt(tournamentId));
  return PublicKey.findProgramAddressSync([Buffer.from('tournament'), idBuffer], PROGRAM_ID);
}

export function getPrizeVaultPda(tournamentId: number): [PublicKey, number] {
  const idBuffer = Buffer.alloc(8);
  idBuffer.writeBigUInt64LE(BigInt(tournamentId));
  return PublicKey.findProgramAddressSync([Buffer.from('prize_vault'), idBuffer], PROGRAM_ID);
}

export function getTeamPda(tournamentId: number, participant: PublicKey): [PublicKey, number] {
  const idBuffer = Buffer.alloc(8);
  idBuffer.writeBigUInt64LE(BigInt(tournamentId));
  return PublicKey.findProgramAddressSync(
    [Buffer.from('team'), idBuffer, participant.toBuffer()],
    PROGRAM_ID,
  );
}

export function getPlayerStatsPda(player: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('player_stats'), player.toBuffer()], PROGRAM_ID);
}

export function getParticipantListPda(tournamentId: number): [PublicKey, number] {
  const idBuffer = Buffer.alloc(8);
  idBuffer.writeBigUInt64LE(BigInt(tournamentId));
  return PublicKey.findProgramAddressSync([Buffer.from('participant_list'), idBuffer], PROGRAM_ID);
}

export function getAssociatedTokenAddress(owner: PublicKey, mint: PublicKey): PublicKey {
  const [ata] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  );
  return ata;
}
