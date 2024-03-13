import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, clusterApiUrl } from "@solana/web3.js";
// import * as bs58 from bs58;

const connection = new Connection(clusterApiUrl("testnet"), "confirmed");
(async () => {
    const signature = await connection.requestAirdrop(new PublicKey("AUjdfQBNxcnGwgu6UteHZPoNRTHppoJvxgKfp16BhxJn"), 1*LAMPORTS_PER_SOL);
    console.log(`Tx Complete: https://explorer.solana.com/tx/${signature}?cluster=testnet`);
})();


