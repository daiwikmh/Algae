import { Contract } from '@algorandfoundation/tealscript';

const MAX_ACCOUNTS = 5;

export class MerchantRegistry extends Contract {
  admin = GlobalStateKey<Address>();

  merchantAddress = BoxMap<bytes, Address>({ prefix: 'ma' });

  merchantActive = BoxMap<bytes, boolean>({ prefix: 'mc' });

  merchantExtraCount = BoxMap<bytes, uint64>({ prefix: 'mx' });

  merchantExtraAccounts = BoxMap<bytes, Address>({ prefix: 'me' });

  createApplication(): void {
    this.admin.value = this.txn.sender;
  }

  registerMerchant(merchantId: bytes, primaryAccount: Address): void {
    assert(this.txn.sender === this.admin.value, 'admin only');
    assert(!this.merchantAddress(merchantId).exists, 'merchant already registered');

    this.merchantAddress(merchantId).value = primaryAccount;
    this.merchantActive(merchantId).value = true;
    this.merchantExtraCount(merchantId).value = 0;
  }

  addAccount(merchantId: bytes, account: Address): void {
    assert(this.txn.sender === this.admin.value, 'admin only');
    assert(this.merchantAddress(merchantId).exists, 'merchant not found');
    assert(this.merchantActive(merchantId).value, 'merchant inactive');

    const count = this.merchantExtraCount(merchantId).value;
    assert(count < MAX_ACCOUNTS, 'account limit reached');

    const key = concat(merchantId, itob(count));
    this.merchantExtraAccounts(key).value = account;
    this.merchantExtraCount(merchantId).value = count + 1;
  }

  deactivateMerchant(merchantId: bytes): void {
    assert(this.txn.sender === this.admin.value, 'admin only');
    assert(this.merchantAddress(merchantId).exists, 'merchant not found');
    this.merchantActive(merchantId).value = false;
  }

  getMerchantAddress(merchantId: bytes): Address {
    assert(this.merchantAddress(merchantId).exists, 'merchant not found');
    assert(this.merchantActive(merchantId).value, 'merchant inactive');
    return this.merchantAddress(merchantId).value;
  }

  isMerchantActive(merchantId: bytes): boolean {
    if (!this.merchantActive(merchantId).exists) return false;
    return this.merchantActive(merchantId).value;
  }
}
