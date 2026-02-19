import { useCallback } from 'react';
import {
  PublicKey,
  TransactionInstruction,
  Transaction,
  Connection,
} from '@solana/web3.js';
import { useSolanaWallet } from './useSolanaWallet';
import {
  PROGRAM_ID,
  USDC_MINT,
  TOKEN_PROGRAM_ID,
  SYSTEM_PROGRAM_ID,
  RENT_SYSVAR,
  USDC_DECIMALS,
  getPlatformPda,
  getTournamentPda,
  getPrizeVaultPda,
  getTeamPda,
  getPlayerStatsPda,
  getParticipantListPda,
  getAssociatedTokenAddress,
} from '@/lib/constants/solana';

// Anchor instruction discriminators: SHA256("global:<name>") first 8 bytes
// Pre-computed for each instruction
const DISCRIMINATORS = {
  create_tournament: Buffer.from([43, 117, 215, 195, 50, 149, 205, 156]),
  join_tournament: Buffer.from([9, 119, 51, 174, 145, 47, 175, 195]),
  initialize_participant_list: Buffer.from([203, 145, 119, 207, 71, 163, 60, 234]),
};

// We'll compute discriminators dynamically if the hardcoded ones don't work
async function getDiscriminator(name: string): Promise<Buffer> {
  // Use the pre-computed values first
  const precomputed = DISCRIMINATORS[name as keyof typeof DISCRIMINATORS];
  if (precomputed) return precomputed;

  // Fallback: compute via SHA-256
  const crypto = globalThis.crypto;
  const data = new TextEncoder().encode(`global:${name}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Buffer.from(new Uint8Array(hash).slice(0, 8));
}

// ============================================================================
// Borsh encoding helpers (manual, no extra dependency)
// ============================================================================

function encodeString(str: string): Buffer {
  const bytes = Buffer.from(str, 'utf8');
  const len = Buffer.alloc(4);
  len.writeUInt32LE(bytes.length);
  return Buffer.concat([len, bytes]);
}

function encodeU64(value: number | bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64LE(BigInt(value));
  return buf;
}

function encodeU16(value: number): Buffer {
  const buf = Buffer.alloc(2);
  buf.writeUInt16LE(value);
  return buf;
}

function encodeI64(value: number | bigint): Buffer {
  const buf = Buffer.alloc(8);
  buf.writeBigInt64LE(BigInt(value));
  return buf;
}

function encodeU32Vec(values: number[]): Buffer {
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(values.length);
  const dataBuf = Buffer.alloc(values.length * 4);
  values.forEach((v, i) => dataBuf.writeUInt32LE(v, i * 4));
  return Buffer.concat([lenBuf, dataBuf]);
}

// ============================================================================
// Account data deserialization
// ============================================================================

function decodeTournament(data: Buffer) {
  // Skip 8-byte discriminator
  let offset = 8;
  const id = Number(data.readBigUInt64LE(offset)); offset += 8;
  const creator = new PublicKey(data.slice(offset, offset + 32)); offset += 32;

  // String: 4-byte length + bytes
  const nameLen = data.readUInt32LE(offset); offset += 4;
  const name = data.slice(offset, offset + nameLen).toString('utf8'); offset += nameLen;

  const compLen = data.readUInt32LE(offset); offset += 4;
  const competition = data.slice(offset, offset + compLen).toString('utf8'); offset += compLen;

  const entryFee = Number(data.readBigUInt64LE(offset)); offset += 8;
  const maxParticipants = data.readUInt16LE(offset); offset += 2;
  const currentParticipants = data.readUInt32LE(offset); offset += 4;
  const prizePool = Number(data.readBigUInt64LE(offset)); offset += 8;
  const registrationDeadline = Number(data.readBigInt64LE(offset)); offset += 8;
  const durationDays = data.readUInt16LE(offset); offset += 2;
  const endTime = Number(data.readBigInt64LE(offset)); offset += 8;
  const currentGameweek = data.readUInt32LE(offset); offset += 4;
  const status = data.readUInt8(offset); offset += 1;
  const prizesDistributed = data.readUInt8(offset) === 1; offset += 1;

  return {
    id,
    creator: creator.toBase58(),
    name,
    competition,
    entryFee: entryFee / Math.pow(10, USDC_DECIMALS),
    entryFeeRaw: entryFee,
    maxParticipants,
    currentParticipants,
    prizePool: prizePool / Math.pow(10, USDC_DECIMALS),
    prizePoolRaw: prizePool,
    registrationDeadline,
    durationDays,
    endTime,
    currentGameweek,
    status: ['Created', 'Active', 'Completed', 'Cancelled'][status] ?? 'Unknown',
    prizesDistributed,
  };
}

// ============================================================================
// Hook
// ============================================================================

export function useFootballFusion() {
  const { connection, wallet: rawWallet, address, connected } = useSolanaWallet();

  const createTournament = useCallback(
    async (params: {
      name: string;
      competition: string;
      entryFee: number; // in USDC (human-readable)
      maxParticipants: number;
      registrationDeadline: number; // unix timestamp in seconds
      durationDays: number;
    }): Promise<{ signature: string; onChainId: number }> => {
      if (!connected || !address || !connection || !rawWallet) {
        throw new Error('Wallet not connected');
      }

      const creatorPubkey = new PublicKey(address);
      const [platformPda] = getPlatformPda();

      // Fetch platform to get the next tournament counter
      const platformInfo = await connection.getAccountInfo(platformPda);
      if (!platformInfo) throw new Error('Platform not initialized. Please initialize the platform first.');
      // Read tournament_counter at offset 8 + 32 = 40
      const nextId = Number(platformInfo.data.readBigUInt64LE(40)) + 1;

      const [tournamentPda] = getTournamentPda(nextId);
      const [prizeVaultPda] = getPrizeVaultPda(nextId);

      const entryFeeRaw = BigInt(Math.round(params.entryFee * Math.pow(10, USDC_DECIMALS)));

      const discriminator = await getDiscriminator('create_tournament');
      const instructionData = Buffer.concat([
        discriminator,
        encodeString(params.name),
        encodeString(params.competition),
        encodeU64(entryFeeRaw),
        encodeU16(params.maxParticipants),
        encodeI64(params.registrationDeadline),
        encodeU16(params.durationDays),
      ]);

      const ix = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: platformPda, isSigner: false, isWritable: true },
          { pubkey: tournamentPda, isSigner: false, isWritable: true },
          { pubkey: prizeVaultPda, isSigner: false, isWritable: true },
          { pubkey: USDC_MINT, isSigner: false, isWritable: false },
          { pubkey: creatorPubkey, isSigner: true, isWritable: true },
          { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: RENT_SYSVAR, isSigner: false, isWritable: false },
        ],
        data: instructionData,
      });

      const tx = new Transaction().add(ix);
      tx.feePayer = creatorPubkey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signedTx = await rawWallet.signAndSendTransaction(tx);
      const signature = typeof signedTx === 'string' ? signedTx : signedTx.signature;
      return { signature, onChainId: nextId };
    },
    [connected, address, connection, rawWallet],
  );

  const joinTournament = useCallback(
    async (params: {
      tournamentId: number;
      teamName: string;
      playerIds: number[]; // array of 15 player IDs
    }): Promise<string> => {
      if (!connected || !address || !connection || !rawWallet) {
        throw new Error('Wallet not connected');
      }

      if (params.playerIds.length !== 15) {
        throw new Error('Must select exactly 15 players');
      }

      const participantPubkey = new PublicKey(address);
      const [platformPda] = getPlatformPda();
      const [tournamentPda] = getTournamentPda(params.tournamentId);
      const [teamPda] = getTeamPda(params.tournamentId, participantPubkey);
      const [playerStatsPda] = getPlayerStatsPda(participantPubkey);
      const [participantListPda] = getParticipantListPda(params.tournamentId);
      const [prizeVaultPda] = getPrizeVaultPda(params.tournamentId);
      const participantTokenAccount = getAssociatedTokenAddress(participantPubkey, USDC_MINT);

      const discriminator = await getDiscriminator('join_tournament');
      const instructionData = Buffer.concat([
        discriminator,
        encodeString(params.teamName),
        encodeU32Vec(params.playerIds),
      ]);

      const ix = new TransactionInstruction({
        programId: PROGRAM_ID,
        keys: [
          { pubkey: platformPda, isSigner: false, isWritable: true },
          { pubkey: tournamentPda, isSigner: false, isWritable: true },
          { pubkey: teamPda, isSigner: false, isWritable: true },
          { pubkey: playerStatsPda, isSigner: false, isWritable: true },
          { pubkey: participantListPda, isSigner: false, isWritable: true },
          { pubkey: participantTokenAccount, isSigner: false, isWritable: true },
          { pubkey: prizeVaultPda, isSigner: false, isWritable: true },
          { pubkey: participantPubkey, isSigner: true, isWritable: true },
          { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
          { pubkey: RENT_SYSVAR, isSigner: false, isWritable: false },
        ],
        data: instructionData,
      });

      const tx = new Transaction().add(ix);
      tx.feePayer = participantPubkey;
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

      const signedTx = await rawWallet.signAndSendTransaction(tx);
      return typeof signedTx === 'string' ? signedTx : signedTx.signature;
    },
    [connected, address, connection, rawWallet],
  );

  const getTournament = useCallback(
    async (tournamentId: number) => {
      if (!connection) throw new Error('No connection');
      const [tournamentPda] = getTournamentPda(tournamentId);
      const info = await connection.getAccountInfo(tournamentPda);
      if (!info) return null;
      return decodeTournament(info.data);
    },
    [connection],
  );

  return {
    createTournament,
    joinTournament,
    getTournament,
    connected,
    address,
  };
}
