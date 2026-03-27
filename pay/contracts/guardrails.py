from algopy import (
    ARC4Contract,
    Account,
    Bytes,
    Global,
    GlobalState,
    LocalState,
    Txn,
    UInt64,
    arc4,
)


class Guardrails(ARC4Contract):
    def __init__(self) -> None:
        self.admin = GlobalState(Bytes, key="admin")
        # local state slots per opted-in agent
        self.daily_limit = LocalState(UInt64, key="dl")
        self.vendor_hash = LocalState(Bytes, key="vh")
        self.daily_spent = LocalState(UInt64, key="ds")
        self.last_reset_day = LocalState(UInt64, key="lr")

    @arc4.abimethod(allow_actions=["NoOp"], create="require")
    def create(self) -> None:
        self.admin.value = Txn.sender.bytes

    @arc4.abimethod(allow_actions=["OptIn"])
    def register_agent(
        self,
        daily_limit_usd_cents: UInt64,
        vendor_whitelist_hash: Bytes,
    ) -> None:
        assert Txn.sender.bytes == self.admin.value, "admin only"
        self.daily_limit[Txn.sender] = daily_limit_usd_cents
        self.vendor_hash[Txn.sender] = vendor_whitelist_hash
        self.daily_spent[Txn.sender] = UInt64(0)
        self.last_reset_day[Txn.sender] = Global.latest_timestamp // UInt64(86400)

    @arc4.abimethod
    def check_and_spend(
        self,
        amount_usd_cents: UInt64,
        vendor_hash: Bytes,
    ) -> arc4.Bool:
        # lazy daily reset
        current_day = Global.latest_timestamp // UInt64(86400)
        if current_day > self.last_reset_day[Txn.sender]:
            self.daily_spent[Txn.sender] = UInt64(0)
            self.last_reset_day[Txn.sender] = current_day

        limit = self.daily_limit[Txn.sender]
        spent = self.daily_spent[Txn.sender]
        stored_hash = self.vendor_hash[Txn.sender]

        if vendor_hash != stored_hash:
            return arc4.Bool(False)
        if spent + amount_usd_cents > limit:
            return arc4.Bool(False)

        self.daily_spent[Txn.sender] = spent + amount_usd_cents
        return arc4.Bool(True)

    @arc4.abimethod(readonly=True)
    def get_agent_status(
        self,
        agent: Account,
    ) -> arc4.Tuple[arc4.UInt64, arc4.UInt64, arc4.UInt64]:
        return arc4.Tuple(
            (
                arc4.UInt64(self.daily_limit[agent]),
                arc4.UInt64(self.daily_spent[agent]),
                arc4.UInt64(self.last_reset_day[agent]),
            )
        )
