use anchor_lang::prelude::*;

declare_id!("Fr85xkdi1fvpfR9XCb6uy3rJUDq2pmoH6UTKaTy4aUtQ");

#[program]
pub mod swap_sol_move {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
