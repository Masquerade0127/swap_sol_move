import {
    clusterApiUrl,
    Connection,
    Keypair,
    Transaction,
    SystemProgram,
  } from "@solana/web3.js";
  import {
    createInitializeMintInstruction,
    TOKEN_PROGRAM_ID,
    MINT_SIZE,
    getMinimumBalanceForRentExemptMint,
    createMint,
  } from "@solana/spl-token";
  import * as bs58 from "bs58";
  
  (async () => {
    // connection
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  
    // 5YNmS1R9nNSCDzb5a7mMJ1dwK9uHeAAF4CmPEwKgVWr8
    const feePayer = Keypair.fromSecretKey(
      Uint8Array.from([55,138,81,58,193,12,123,185,231,114,239,139,38,210,233,183,53,10,222,33,160,232
                      ,246,79,88,244,44,74,22,158,179,213,220,153,22,152,16,22,227,39,118,224,126,91,217
                      ,170,229,195,4,192,155,11,213,178,108,220,32,138,216,217,198,234,86,201])
      // bs58.decode(
      //   "588FU4PktJWfGfxtzpAAXywSNt74AvtroVzGfKkVN1LwRuvHwKGr851uH8czM5qm4iqLbs1kKoMKtMJG4ATR7Ld2"
      //   "B1UkUZFNMRSmWmpgWRcVJ7pFgK2snv6Fgt1pt3ZYUY8CbcZdjroWGLCNfqBDLkki1kvfitQX83j6Ht9jDxaqpa2"
      // )
    );
  
    // G2FAbFQPFa5qKXCetoFZQEvF9BVvCKbvUZvodpVidnoY
    const alice = Keypair.fromSecretKey(
      bs58.decode(
        "4NMwxzmYj2uvHuq8xoqhY8RXg63KSVJM1DXkpbmkUY7YQWuoyQgFnnzn6yo3CMnqZasnNPNuAT2TLwQsCaKkUddp"
      )
    );
  
    // 1) use build-in function
    let mintPubkey = await createMint(
      connection, // conneciton
      feePayer, // fee payer
      alice.publicKey, // mint authority
      alice.publicKey, // freeze authority (you can use `null` to disable it. when you disable it, you can't turn it on again)
      8 // decimals
    );
    console.log(`mint: ${mintPubkey.toBase58()}`);
  
    // or
  
    // 2) compose by yourself
    const mint = Keypair.generate();
    console.log(`mint: ${mint.publicKey.toBase58()}`);
  
    let tx = new Transaction().add(
      // create mint account
      SystemProgram.createAccount({
        fromPubkey: feePayer.publicKey,
        newAccountPubkey: mint.publicKey,
        space: MINT_SIZE,
        lamports: await getMinimumBalanceForRentExemptMint(connection),
        programId: TOKEN_PROGRAM_ID,
      }),
      // init mint account
      createInitializeMintInstruction(
        mint.publicKey, // mint pubkey
        8, // decimals
        alice.publicKey, // mint authority
        alice.publicKey // freeze authority (you can use `null` to disable it. when you disable it, you can't turn it on again)
      )
    );
    console.log(
      `txhash: ${await connection.sendTransaction(tx, [feePayer, mint])}`
    );
  })();
  