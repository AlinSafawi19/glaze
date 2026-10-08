import { CheckoutForm } from "./checkout-form";
import { currentCustomer } from "@/lib/account";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  // Guests are welcome; a signed-in shopper just gets the form prefilled and
  // the order attached to their account.
  const customer = await currentCustomer();

  return (
    <CheckoutForm
      identity={{
        name: customer?.name ?? "",
        phone: customer?.phone ?? "",
        address: customer?.address ?? "",
        city: customer?.city ?? "",
        signedIn: Boolean(customer),
      }}
    />
  );
}
