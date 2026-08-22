"use client";

import { useActionState } from "react";
import Link from "next/link";

import { H2, ItalicBodyLg, SubtitleMd, BodyMd, BodySm } from "./typography";
import { Button, OutlineButton, type ButtonState } from "./button";
import {
  resendCode,
  saveProfile,
  signIn,
  signUp,
  verifyEmail,
  type AccountState,
} from "@/lib/actions/account";

/**
 * These forms deliberately reuse the contact page's language — the same
 * underlined fields, the same generous spacing, and the same animated submit
 * button that carries loading, success and error in one place.
 */

const INPUT_CLS =
  "w-full h-[48px] bg-transparent outline-none border-0 border-b border-beige px-0 pt-0 pb-[8px] " +
  "font-inter font-normal text-[20px] leading-[1.2] tracking-[0em] text-black placeholder:text-beige";

/** The contact form tints the rule brown while a field has focus. */
const focusProps = {
  style: { transition: "border-color 0.3s cubic-bezier(0.44,0,0.56,1)" },
  onFocus: (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderBottomColor = "var(--color-brown)"),
  onBlur: (e: React.FocusEvent<HTMLInputElement>) =>
    (e.currentTarget.style.borderBottomColor = "var(--color-beige)"),
};

/**
 * Deliberately no `required` attribute. The browser's own validation blocks
 * submission behind a native tooltip, which hides the server's message — and
 * the server is the one that knows the field is too short, the email is
 * malformed, or the address is already taken. Every field here is validated
 * server-side, so letting the submit through is what surfaces the real reason.
 */
function Field({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  defaultValue,
  inputMode,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  defaultValue?: string;
  inputMode?: React.ComponentProps<"input">["inputMode"];
  maxLength?: number;
}) {
  return (
    <div className="w-full flex flex-col justify-start items-center gap-[32px] p-0 overflow-visible rounded-none">
      <SubtitleMd className="w-full !text-brown !text-left">{label}</SubtitleMd>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        inputMode={inputMode}
        maxLength={maxLength}
        className={INPUT_CLS}
        {...focusProps}
      />
    </div>
  );
}

/**
 * The button's error state says only that something went wrong; the reason goes
 * underneath it, because "An account already uses that email" is the thing the
 * shopper actually needs in order to act.
 */
function Reason({ children }: { children: React.ReactNode }) {
  return (
    <BodySm className="w-full !text-error !text-center [text-wrap:balance]">{children}</BodySm>
  );
}

function stateOf(pending: boolean, state: AccountState): ButtonState {
  if (pending) return "loading";
  if (state.error) return "error";
  if (state.ok) return "success";
  return "default";
}

/** The white card the contact form sits in. */
function Card({
  title,
  tagline,
  children,
}: {
  title: string;
  tagline?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="w-full max-w-[720px] flex flex-col justify-start items-center overflow-clip rounded-none bg-white
        gap-[64px] p-[32px]
        tablet:p-[80px]
        desktop:p-[80px]"
    >
      <div className="w-full flex flex-col justify-start items-center gap-[4px]">
        <H2 className="w-full !text-black !text-center">{title}</H2>
        {tagline && (
          <ItalicBodyLg className="w-full !text-black !text-center [text-wrap:balance]">
            {tagline}
          </ItalicBodyLg>
        )}
      </div>
      {children}
    </div>
  );
}

/** Carries the shopper back where they were once they are signed in. */
function NextField({ next }: { next?: string }) {
  return next ? <input type="hidden" name="next" value={next} /> : null;
}

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(signIn, {});

  return (
    <Card title="Sign in" tagline="your orders, kept together">
      <form
        action={action}
        className="w-full flex flex-col justify-start items-start gap-[48px] p-0 overflow-hidden rounded-none"
      >
        <NextField next={next} />

        <div className="w-full flex flex-col justify-start items-start gap-[32px] p-0 overflow-clip rounded-none">
          <Field
            label="Email"
            name="email"
            type="email"
            placeholder="jane@example.com"
            autoComplete="email"
          />
          <Field
            label="Password"
            name="password"
            type="password"
            placeholder="Your password"
            autoComplete="current-password"
          />
        </div>

        <div className="w-full flex flex-col justify-center items-center gap-[16px]">
          <Button
            type="submit"
            className="max-w-full"
            buttonState={stateOf(pending, state)}
            label="Sign in"
            successLabel="Welcome back"
          />
          {state.error && <Reason>{state.error}</Reason>}
        </div>
      </form>

      <div className="w-full flex flex-col justify-center items-center gap-[12px]">
        <BodyMd className="w-full !text-brown !text-center">No account yet?</BodyMd>
        <Link href="/account/sign-up">
          <OutlineButton icon={null}>Create one</OutlineButton>
        </Link>
      </div>
    </Card>
  );
}

export function SignUpForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(signUp, {});

  return (
    <Card title="Create account" tagline="checkout, prefilled">
      <form
        action={action}
        className="w-full flex flex-col justify-start items-start gap-[48px] p-0 overflow-hidden rounded-none"
      >
        <NextField next={next} />

        <div className="w-full flex flex-col justify-start items-start gap-[32px] p-0 overflow-clip rounded-none">
          <Field
            label="Full name"
            name="name"
            placeholder="Jane Smith"
            autoComplete="name"
          />
          <Field
            label="Email"
            name="email"
            type="email"
            placeholder="jane@example.com"
            autoComplete="email"
          />
          <Field
            label="Password"
            name="password"
            type="password"
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
          <Field
            label="Confirm password"
            name="confirmPassword"
            type="password"
            placeholder="Type it again"
            autoComplete="new-password"
          />
          <Field
            label="Phone"
            name="phone"
            type="tel"
            placeholder="+961 70 000 000"
            autoComplete="tel"
          />
          <Field
            label="Address"
            name="address"
            placeholder="Street, building, floor"
            autoComplete="street-address"
          />
          <Field
            label="City"
            name="city"
            placeholder="City"
            autoComplete="address-level2"
          />
        </div>

        <div className="w-full flex flex-col justify-center items-center gap-[16px]">
          <Button
            type="submit"
            className="max-w-full"
            buttonState={stateOf(pending, state)}
            label="Create account"
            successLabel="Welcome"
          />
          {state.error && <Reason>{state.error}</Reason>}
        </div>
      </form>

      <div className="w-full flex flex-col justify-center items-center gap-[12px]">
        <BodyMd className="w-full !text-brown !text-center">Already have one?</BodyMd>
        <Link href="/account/sign-in">
          <OutlineButton icon={null}>Sign in</OutlineButton>
        </Link>
      </div>
    </Card>
  );
}

/**
 * The code screen.
 *
 * Registering creates the account but not a session — `verify` is the call that
 * returns a token, so confirming the address here is what signs the shopper in.
 * They go straight on to `next` (or their account) already authenticated,
 * rather than being handed back to the sign-in form.
 */
export function VerifyForm({ email, next }: { email: string; next?: string }) {
  const [state, action, pending] = useActionState<AccountState, FormData>(verifyEmail, {});
  const [resent, resendAction, resending] = useActionState<AccountState, FormData>(
    resendCode,
    {}
  );

  return (
    <Card title="Confirm your email" tagline={`we sent a six-digit code to ${email}`}>
      <form
        action={action}
        className="w-full flex flex-col justify-start items-start gap-[48px] p-0 overflow-hidden rounded-none"
      >
        <NextField next={next} />
        <input type="hidden" name="email" value={email} />

        <div className="w-full flex flex-col justify-start items-start gap-[32px] p-0 overflow-clip rounded-none">
          <Field
            label="Verification code"
            name="code"
            placeholder="000000"
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
          />
        </div>

        <div className="w-full flex flex-col justify-center items-center gap-[16px]">
          <Button
            type="submit"
            className="max-w-full"
            buttonState={stateOf(pending, state)}
            label="Confirm"
            successLabel="Welcome"
          />
          {state.error && <Reason>{state.error}</Reason>}
          <BodySm className="w-full !text-brown !text-center [text-wrap:balance]">
            The code lasts fifteen minutes. Check your spam folder if it has not arrived.
          </BodySm>
        </div>
      </form>

      {/* Its own form: a nested one is invalid HTML, and resending must not
          carry the half-typed code with it. */}
      <form
        action={resendAction}
        className="w-full flex flex-col justify-center items-center gap-[12px]"
      >
        <input type="hidden" name="email" value={email} />
        <BodyMd className="w-full !text-brown !text-center">No code yet?</BodyMd>
        <OutlineButton type="submit" icon={null} disabled={resending}>
          {resending ? "Sending…" : "Send another"}
        </OutlineButton>
        {resent.ok && (
          <BodySm className="w-full !text-brown !text-center">
            A new code is on its way.
          </BodySm>
        )}
        {resent.error && <Reason>{resent.error}</Reason>}
      </form>
    </Card>
  );
}

export function ProfileForm({
  customer,
}: {
  customer: { name: string; phone: string | null; address: string | null; city: string | null };
}) {
  const [state, action, pending] = useActionState<AccountState, FormData>(saveProfile, {});

  return (
    <Card title="Your details" tagline="what checkout fills in for you">
      <form
        action={action}
        className="w-full flex flex-col justify-start items-start gap-[48px] p-0 overflow-hidden rounded-none"
      >
        <div className="w-full flex flex-col justify-start items-start gap-[32px] p-0 overflow-clip rounded-none">
          <Field
            label="Full name"
            name="name"
            placeholder="Jane Smith"
            defaultValue={customer.name}
          />
          <Field
            label="Phone"
            name="phone"
            type="tel"
            placeholder="+961 70 000 000"
            defaultValue={customer.phone ?? ""}
          />
          <Field
            label="Address"
            name="address"
            placeholder="Street, building, floor"
            defaultValue={customer.address ?? ""}
          />
          <Field
            label="City"
            name="city"
            placeholder="City"
            defaultValue={customer.city ?? ""}
          />
        </div>

        <div className="w-full flex flex-col justify-center items-center gap-[16px]">
          <Button
            type="submit"
            className="max-w-full"
            buttonState={stateOf(pending, state)}
            label="Save details"
            successLabel="Saved"
          />
          {state.error && <Reason>{state.error}</Reason>}
        </div>
      </form>
    </Card>
  );
}
