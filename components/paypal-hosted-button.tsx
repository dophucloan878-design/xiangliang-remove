type PayPalHostedButtonProps = {
  hostedButtonId: string
}

export function PayPalHostedButton({ hostedButtonId }: PayPalHostedButtonProps) {
  const checkoutBase = process.env.NEXT_PUBLIC_PAYPAL_PAYMENT_BASE_URL || "https://www.paypal.com/ncp/payment"
  const checkoutUrl = `${checkoutBase}/${hostedButtonId}`

  return (
    <a
      href={checkoutUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex w-full items-center justify-center rounded-xl bg-[#FFC439] px-4 py-3 text-base font-semibold text-[#001C64] transition-opacity hover:opacity-90"
    >
      Pay with PayPal
    </a>
  )
}
