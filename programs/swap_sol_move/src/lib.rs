use anchor_lang::prelude::*;
use anchor_lang::solana_program::program_option::COption;
use anchor_spl::token::{self, Burn, Mint, MintTo, TokenAccount, Transfer};
use curve::base::CurveType;
use std::convert::TryFrom;

pub mod curve;
use crate::curve::{
    base::SwapCurve,
    calculator::{CurveCalculator, RoundDirection, TradeDirection},
    fees::CurveFees,
};
use crate::curve::{
    constant_price::ConstantPriceCurve, constant_product::ConstantProductCurve,
    offset::OffsetCurve, stable::StableCurve,
};

declare_id!("Fr85xkdi1fvpfR9XCb6uy3rJUDq2pmoH6UTKaTy4aUtQ");


#[program]
pub mod swap_sol_move {
    use super::*;

    pub fn initialize(
        ctx: Context<Initialize>,
        fees_input: FeesInput,
        curve_input: CurveInput
    ) -> Result<()> {
        if ctx.accounts.amm.is_initialized {
            return Err(SwapError::AlreadyInUse.into());
        }

        let (swap_authority, bump_seed) = Pubkey::find_program_address(
            &[&ctx.accounts.amm.to_account_info().key.to_bytes()],
            ctx.program_id,
        );
        let seeds = &[
            &ctx.accounts.amm.to_account_info().key.to_bytes(),
            &[bump_seed][..],
        ];

        if *ctx.accounts.authority.key != swap_authority {
            return Err(SwapError::InvalidProgramAddress.into());
        }
        if *ctx.accounts.authority.key != ctx.accounts.token_a.owner {
            return Err(SwapError::InvalidOwner.into());
        }
        if *ctx.accounts.authority.key != ctx.accounts.token_b.owner {
            return Err(SwapError::InvalidOwner.into());
        }
        if *ctx.accounts.authority.key == ctx.accounts.destination.owner {
            return Err(SwapError::InvalidOutputOwner.into());
        }
        if *ctx.accounts.authority.key == ctx.accounts.fee_account.owner {
            return Err(SwapError::InvalidOutputOwner.into());
        }
        if COption::Some(*ctx.accounts.authority.key) != ctx.accounts.pool_mint.mint_authority {
            return Err(SwapError::InvalidOwner.into());
        }

        if ctx.accounts.token_a.mint == ctx.accounts.token_b.mint {
            return Err(SwapError::RepeatedMint.into());
        }

        let curve = build_curve(&curve_input).unwrap();
        curve
            .calculator
            .validate_supply(ctx.accounts.token_a.amount, ctx.accounts.token_b.amount)?;
        if ctx.accounts.token_a.delegate.is_some() {
            return Err(SwapError::InvalidDelegate.into());
        }
        if ctx.accounts.token_b.delegate.is_some() {
            return Err(SwapError::InvalidDelegate.into());
        }
        if ctx.accounts.token_a.close_authority.is_some() {
            return Err(SwapError::InvalidCloseAuthority.into());
        }
        if ctx.accounts.token_b.close_authority.is_some() {
            return Err(SwapError::InvalidCloseAuthority.into());
        }

        if ctx.accounts.pool_mint.supply != 0 {
            return Err(SwapError::InvalidSupply.into());
        }
        if ctx.accounts.pool_mint.freeze_authority.is_some() {
            return Err(SwapError::InvalidFreezeAuthority.into());
        }
        if *ctx.accounts.pool_mint.to_account_info().key != ctx.accounts.fee_account.mint {
            return Err(SwapError::IncorrectPoolMint.into());
        }
        let fees = build_fees(&fees_input).unwrap();

        if let Some(swap_constraints) = SWAP_CONSTRAINTS {
            let owner_key = swap_constraints
                .owner_key
                .parse::<Pubkey>()
                .map_err(|_| SwapError::InvalidOwner)?;
            if ctx.accounts.fee_account.owner != owner_key {
                return Err(SwapError::InvalidOwner.into());
            }
            swap_constraints.validate_curve(&curve)?;
            swap_constraints.validate_fees(&fees)?;
        }
        fees.validate()?;
        curve.calculator.validate()?;

        let initial_amount = curve.calculator.new_pool_supply();

        token::mint_to(
            ctx.accounts
                .into_mint_to_context()
                .with_signer(&[&seeds[..]]),
            u64::try_from(initial_amount).unwrap(),
        )?;

        let amm = &mut ctx.accounts.amm;
        amm.is_initialized = true;
        amm.bump_seed = bump_seed;
        amm.token_program_id = *ctx.accounts.token_program.key;
        amm.token_a_account = *ctx.accounts.token_a.to_account_info().key;
        amm.token_b_account = *ctx.accounts.token_b.to_account_info().key;
        amm.pool_mint = *ctx.accounts.pool_mint.to_account_info().key;
        amm.token_a_mint = ctx.accounts.token_a.mint;
        amm.token_b_mint = ctx.accounts.token_b.mint;
        amm.pool_fee_account = *ctx.accounts.fee_account.to_account_info().key;
        amm.fees = fees_input;
        amm.curve = curve_input;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
