"use client";

import { useCallback, useRef, useState, type FormEvent } from "react";

/**
 * Asks "are you sure?" before a form is actually submitted.
 *
 *   const confirmSave = useConfirmSubmit(isEdit);
 *   <form {...confirmSave.formProps} action={formAction}> … </form>
 *   {confirmSave.asking && <ConfirmDialog onConfirm={confirmSave.confirm} onCancel={confirmSave.cancel} … />}
 *
 * Browser validation (`required`, …) still runs first: the question only appears for a valid form.
 * With `enabled = false` (e.g. creating something new) the form is submitted straight away.
 */
export function useConfirmSubmit(enabled: boolean) {
  const formRef = useRef<HTMLFormElement>(null);
  const confirmed = useRef(false);
  const [asking, setAsking] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    if (!enabled || confirmed.current) {
      confirmed.current = false;
      return;
    }
    event.preventDefault();
    setAsking(true);
  }

  function confirm() {
    confirmed.current = true;
    setAsking(false);
    formRef.current?.requestSubmit();
  }

  function cancel() {
    setAsking(false);
  }

  /** Clears the form fields (e.g. after a successful save). */
  const reset = useCallback(() => formRef.current?.reset(), []);

  return { formProps: { ref: formRef, onSubmit }, asking, confirm, cancel, reset };
}
